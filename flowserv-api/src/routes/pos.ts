import { Hono } from 'hono';
import { db } from '../db/connection';
import { 
  posInvoices, posInvoiceLines, stockBatches, stockMovements, stockLevels, inventoryItems, posDrafts 
} from '../db/schema';
import { eq, and, sql, asc, gt, desc } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { successResponse, errorResponse } from '../lib/response';
import { requireAuth, getAuthContext } from '../middleware/auth';

export const posRouter = new Hono();
posRouter.use('*', requireAuth);

// Skema validasi untuk checkout POS
const posCheckoutSchema = z.object({
  branchId: z.string().uuid(),
  customerName: z.string().optional(),
  serviceTicketId: z.string().uuid().optional(),
  paymentMethod: z.enum(['cash', 'transfer', 'qris', 'split', 'tempo']),
  discountAmount: z.coerce.number().min(0).default(0),
  items: z.array(z.object({
    inventoryItemId: z.string().uuid(),
    partBrandId: z.string().uuid().optional(),
    quantity: z.number().int().positive(),
    unitPrice: z.coerce.number().positive(),
  })).min(1, 'Keranjang tidak boleh kosong'),
});

// GET /v1/pos/invoices - Get sales history
posRouter.get('/invoices', async (c) => {
  const { tenantId } = getAuthContext(c);

  const branchId = c.req.query('branchId');
  
  const filters = [eq(posInvoices.tenantId, tenantId)];
  if (branchId) {
    filters.push(eq(posInvoices.branchId, branchId));
  }

  const invoices = await db.query.posInvoices.findMany({
    where: and(...filters),
    orderBy: [desc(posInvoices.createdAt)],
    with: {
      creator: {
        columns: { name: true }
      }
    },
    limit: 100,
  });

  return successResponse(c, invoices);
});

// GET /v1/pos/invoices/:id - Get specific invoice
posRouter.get('/invoices/:id', async (c) => {
  const { tenantId } = getAuthContext(c);
  const id = c.req.param('id');

  const invoice = await db.query.posInvoices.findFirst({
    where: and(eq(posInvoices.tenantId, tenantId), eq(posInvoices.id, id)),
    with: {
      creator: { columns: { name: true } },
      lines: {
        with: {
          inventoryItem: { columns: { name: true, sku: true } }
        }
      }
    }
  });

  if (!invoice) {
    return errorResponse(c, 'NOT_FOUND', 'Invoice not found', undefined, 404);
  }

  return successResponse(c, invoice);
});

// POST /v1/pos/invoices - Checkout
posRouter.post('/invoices', zValidator('json', posCheckoutSchema), async (c) => {
  const { tenantId, userId } = getAuthContext(c);
  const data = c.req.valid('json');

  // Validasi rule bisnis: Tempo wajib isi nama customer
  if (data.paymentMethod === 'tempo' && (!data.customerName || data.customerName.trim() === '')) {
    return errorResponse(c, 'BAD_REQUEST', 'Nama pelanggan wajib diisi untuk pembayaran tempo', undefined, 400);
  }

  // Hitung total
  let subtotal = 0;
  for (const item of data.items) {
    subtotal += (item.unitPrice * item.quantity);
  }

  const grandTotal = subtotal - data.discountAmount;
  const paymentStatus = data.paymentMethod === 'tempo' ? 'unpaid' : 'paid';

  try {
    // Jalankan seluruh proses checkout dalam satu database transaction
    const result = await db.transaction(async (tx) => {
      
      // 1. Generate Invoice Number
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const invoiceNumber = `INV-${dateStr}-${randomSuffix}`;

      // 2. Buat Invoice Header
      const [newInvoice] = await tx.insert(posInvoices).values({
        tenantId,
        branchId: data.branchId,
        invoiceNumber,
        customerName: data.customerName || 'Pelanggan Umum',
        serviceTicketId: data.serviceTicketId,
        subtotal: subtotal.toString(),
        discountAmount: data.discountAmount.toString(),
        taxAmount: '0',
        grandTotal: grandTotal.toString(),
        paymentStatus,
        paymentMethod: data.paymentMethod,
        createdBy: userId,
      }).returning();

      // 3. Proses tiap item di keranjang
      for (const item of data.items) {
        const lineSubtotal = item.unitPrice * item.quantity;
        
        // Buat Invoice Line
        await tx.insert(posInvoiceLines).values({
          posInvoiceId: newInvoice.id,
          inventoryItemId: item.inventoryItemId,
          partBrandId: item.partBrandId || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          subtotal: lineSubtotal.toString(),
        });

        // 4. FIFO Stock Deduction
        let qtyToDeduct = item.quantity;
        
        // Ambil batch dengan stok tersisa, diurutkan dari yang terlama (filter per item & brand)
        const batchFilters = [
          eq(stockBatches.tenantId, tenantId),
          eq(stockBatches.branchId, data.branchId),
          eq(stockBatches.inventoryItemId, item.inventoryItemId),
          gt(stockBatches.quantityRemaining, 0)
        ];
        
        if (item.partBrandId) {
          batchFilters.push(eq(stockBatches.partBrandId, item.partBrandId));
        } else {
          // If no brand is specified, we might want to deduct from batches that also have no brand,
          // or just any batch. Usually if they select generic, they deduct generic.
          batchFilters.push(sql`${stockBatches.partBrandId} IS NULL`);
        }

        const availableBatches = await tx.query.stockBatches.findMany({
          where: and(...batchFilters),
          orderBy: [asc(stockBatches.receivedAt)]
        });

        // Loop untuk memotong batch satu per satu (FIFO)
        for (const batch of availableBatches) {
          if (qtyToDeduct <= 0) break;

          const deductFromThisBatch = Math.min(batch.quantityRemaining, qtyToDeduct);
          
          await tx.update(stockBatches)
            .set({ quantityRemaining: batch.quantityRemaining - deductFromThisBatch })
            .where(eq(stockBatches.id, batch.id));
            
          // Catat Stock Movement untuk potongan batch ini
          await tx.insert(stockMovements).values({
            tenantId,
            branchId: data.branchId,
            inventoryItemId: item.inventoryItemId,
            stockBatchId: batch.id, // Referensi ke batch mana yang kepakai
            movementType: 'out',
            quantity: -deductFromThisBatch,
            referenceType: 'pos_sale',
            referenceId: newInvoice.id
          });

          qtyToDeduct -= deductFromThisBatch;
        }

        if (qtyToDeduct > 0) {
          // Artinya stok fisik tidak cukup. Kita batalkan transaksi (roll back)
          throw new Error(`Stok tidak cukup untuk item ${item.inventoryItemId}`);
        }

        // 5. Update Master Stock Level (Global per branch)
        // Dapatkan stok level saat ini, atau buat kalau belum ada (seharusnya ada)
        const stockLevel = await tx.query.stockLevels.findFirst({
          where: and(
            eq(stockLevels.inventoryItemId, item.inventoryItemId),
            eq(stockLevels.branchId, data.branchId)
          )
        });

        if (stockLevel) {
          await tx.update(stockLevels)
            .set({ quantityAvailable: stockLevel.quantityAvailable - item.quantity })
            .where(eq(stockLevels.id, stockLevel.id));
        } else {
          // Fallback jika anehnya belum ada
          await tx.insert(stockLevels).values({
            inventoryItemId: item.inventoryItemId,
            branchId: data.branchId,
            quantityAvailable: -item.quantity
          });
        }
      }

      return newInvoice;
    });

    return successResponse(c, result, undefined, 201);
  } catch (error: any) {
    return errorResponse(c, 'INTERNAL_SERVER_ERROR', 'Terjadi kesalahan saat memproses POS', undefined, 500);
  }
});

// ==========================================
// DRAFTS
// ==========================================

const draftSchema = z.object({
  branchId: z.string().uuid(),
  name: z.string().min(1),
  cartItems: z.array(z.any())
});

// GET /v1/pos/drafts
posRouter.get('/drafts', async (c) => {
  const { tenantId } = getAuthContext(c);
  const branchId = c.req.query('branchId');

  const filters = [eq(posDrafts.tenantId, tenantId)];
  if (branchId) filters.push(eq(posDrafts.branchId, branchId));

  const drafts = await db.query.posDrafts.findMany({
    where: and(...filters),
    orderBy: [desc(posDrafts.createdAt)]
  });

  return successResponse(c, drafts);
});

// POST /v1/pos/drafts
posRouter.post('/drafts', zValidator('json', draftSchema), async (c) => {
  const { tenantId } = getAuthContext(c);
  const data = c.req.valid('json');

  const [draft] = await db.insert(posDrafts).values({
    tenantId,
    branchId: data.branchId,
    name: data.name,
    cartItems: data.cartItems
  }).returning();

  return successResponse(c, draft, undefined, 201);
});

// DELETE /v1/pos/drafts/:id
posRouter.delete('/drafts/:id', async (c) => {
  const { tenantId } = getAuthContext(c);
  const id = c.req.param('id');

  await db.delete(posDrafts).where(and(eq(posDrafts.id, id), eq(posDrafts.tenantId, tenantId)));
  return successResponse(c, { deleted: true });
});

// ==========================================
// VOID INVOICE
// ==========================================

// DELETE /v1/pos/invoices/:id (Void)
posRouter.delete('/invoices/:id', async (c) => {
  const { tenantId } = getAuthContext(c);
  const id = c.req.param('id');

  try {
    await db.transaction(async (tx) => {
      // 1. Fetch invoice and verify it is not already voided
      const invoice = await tx.query.posInvoices.findFirst({
        where: and(eq(posInvoices.id, id), eq(posInvoices.tenantId, tenantId))
      });

      if (!invoice) throw new Error('Invoice not found');
      if (invoice.paymentStatus === 'voided') throw new Error('Invoice is already voided');

      // 2. Reverse Stock Movements
      const movements = await tx.query.stockMovements.findMany({
        where: and(
          eq(stockMovements.tenantId, tenantId),
          eq(stockMovements.referenceType, 'pos_sale'),
          eq(stockMovements.referenceId, id)
        )
      });

      // Group movements by item to update master levels safely
      const itemRestores: Record<string, number> = {};

      for (const mov of movements) {
        // Return stock to batch
        const batch = await tx.query.stockBatches.findFirst({
          where: eq(stockBatches.id, mov.stockBatchId!)
        });
        
        if (batch) {
          await tx.update(stockBatches)
            .set({ quantityRemaining: batch.quantityRemaining + Math.abs(mov.quantity) })
            .where(eq(stockBatches.id, batch.id));
        }

        // Aggregate for master stock level update
        itemRestores[mov.inventoryItemId] = (itemRestores[mov.inventoryItemId] || 0) + Math.abs(mov.quantity);

        // Record a void movement
        await tx.insert(stockMovements).values({
          tenantId,
          branchId: mov.branchId,
          inventoryItemId: mov.inventoryItemId,
          stockBatchId: mov.stockBatchId,
          movementType: 'in', // returning stock
          quantity: Math.abs(mov.quantity),
          referenceType: 'void_pos',
          referenceId: id
        });
      }

      // 3. Update Master Stock Levels
      for (const itemId of Object.keys(itemRestores)) {
        const qtyToRestore = itemRestores[itemId];
        const stockLevel = await tx.query.stockLevels.findFirst({
          where: and(
            eq(stockLevels.inventoryItemId, itemId),
            eq(stockLevels.branchId, invoice.branchId)
          )
        });

        if (stockLevel) {
          await tx.update(stockLevels)
            .set({ quantityAvailable: stockLevel.quantityAvailable + qtyToRestore })
            .where(eq(stockLevels.id, stockLevel.id));
        }
      }

      // 4. Update Invoice Status to voided
      await tx.update(posInvoices)
        .set({ paymentStatus: 'voided' }) // reusing paymentStatus for voided state
        .where(eq(posInvoices.id, invoice.id));
    });

    return successResponse(c, { voided: true });
  } catch (error: any) {
    console.error('Failed to void invoice', error);
    return errorResponse(c, 'INTERNAL_SERVER_ERROR', error.message || 'Gagal melakukan void transaksi', undefined, 500);
  }
});
