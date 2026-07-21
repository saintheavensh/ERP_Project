import { Hono } from 'hono';
import { db } from '../../db/connection';
import { posInvoices, posInvoiceLines, stockBatches, stockMovements, stockLevels, inventoryItems, posDrafts, invoiceSequences, customers } from '../../db/schema/index';
import { eq, and, sql, asc, gt, desc, inArray } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { successResponse, errorResponse } from '../../lib/response';
import { requireAuth, getAuthContext } from '../../middleware/auth';
import { BusinessError } from '../../lib/errors';
import { pickFifoBatches, calculateConsumedUnitCost } from '../../lib/fifo';
import { roundMoney, toMoneyString } from '../../lib/money';
import { posCheckoutSchema } from './types';

const router = new Hono();

// GET /v1/pos/invoices - Get sales history
router.get('/invoices', async (c) => {
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
router.get('/invoices/:id', async (c) => {
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
router.post('/invoices', zValidator('json', posCheckoutSchema), async (c) => {
  const { tenantId, userId } = getAuthContext(c);
  const data = c.req.valid('json');

  // Business rule (tempo requires a real customer link) is enforced by
  // posCheckoutSchema's .refine() and, as a second guard, the
  // `tempo_requires_customer` CHECK constraint in Postgres.

  // Resolve the customer snapshot: customerId is the link, customerName is
  // what the invoice says at the time — it must survive a rename/delete later.
  let resolvedCustomerName = data.customerName || 'Pelanggan Umum';
  if (data.customerId) {
    const [customer] = await db
      .select({ name: customers.name })
      .from(customers)
      .where(and(eq(customers.id, data.customerId), eq(customers.tenantId, tenantId)));
    if (!customer) {
      return errorResponse(c, 'CUSTOMER_NOT_FOUND', 'Customer not found', undefined, 404);
    }
    resolvedCustomerName = customer.name;
  }

  // Hitung total
  let subtotal = 0;
  for (const item of data.items) {
    subtotal = roundMoney(subtotal + item.unitPrice * item.quantity);
  }

  const grandTotal = roundMoney(subtotal - data.discountAmount);
  const paymentStatus = data.paymentMethod === 'tempo' ? 'unpaid' : 'paid';

  try {
    // Jalankan seluruh proses checkout dalam satu database transaction
    const result = await db.transaction(async (tx) => {

      // 1. Allocate the next sequence number for this tenant and day. Runs
      // inside the checkout transaction — INSERT ... ON CONFLICT DO UPDATE ...
      // RETURNING is atomic, so two concurrent checkouts can never receive the
      // same number without extra row locking.
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const [{ last_number: lastNumber }] = await tx.execute<{ last_number: number }>(sql`
        INSERT INTO invoice_sequences (tenant_id, date_key, last_number)
        VALUES (${tenantId}, ${dateStr}, 1)
        ON CONFLICT (tenant_id, date_key)
        DO UPDATE SET last_number = invoice_sequences.last_number + 1
        RETURNING last_number
      `);
      const invoiceNumber = `INV-${dateStr}-${String(lastNumber).padStart(4, '0')}`;

      // 2. Buat Invoice Header
      const [newInvoice] = await tx.insert(posInvoices).values({
        tenantId,
        branchId: data.branchId,
        invoiceNumber,
        customerName: resolvedCustomerName,
        customerId: data.customerId,
        serviceTicketId: data.serviceTicketId,
        subtotal: toMoneyString(subtotal),
        discountAmount: toMoneyString(data.discountAmount),
        taxAmount: '0',
        grandTotal: toMoneyString(grandTotal),
        paymentStatus,
        paymentMethod: data.paymentMethod,
        createdBy: userId,
      }).returning();

      // 3. Look up descriptions for part lines up front. Server-derived, never
      // client-supplied — a part's description is what the item was actually
      // called at sale time, not whatever text a request happens to send.
      const partItemIds = data.items
        .filter((item) => item.sourceType === 'part')
        .map((item) => item.inventoryItemId);

      const itemNameById = new Map<string, string>();
      if (partItemIds.length > 0) {
        const rows = await tx.select({ id: inventoryItems.id, name: inventoryItems.name })
          .from(inventoryItems)
          .where(and(eq(inventoryItems.tenantId, tenantId), inArray(inventoryItems.id, partItemIds)));
        for (const row of rows) itemNameById.set(row.id, row.name);
      }

      // 4. Proses tiap item di keranjang. Only 'part' lines touch stock —
      // 'labor'/'fee' lines are pure billing, no inventory behind them.
      for (const item of data.items) {
        const lineSubtotal = roundMoney(item.unitPrice * item.quantity);

        if (item.sourceType !== 'part') {
          // Labor / fee: bill it, skip FIFO entirely.
          await tx.insert(posInvoiceLines).values({
            tenantId,
            posInvoiceId: newInvoice.id,
            sourceType: item.sourceType,
            description: item.description,
            inventoryItemId: null,
            partBrandId: null,
            quantity: item.quantity,
            unitPrice: toMoneyString(item.unitPrice),
            subtotal: toMoneyString(lineSubtotal),
            unitCost: null,
          });
          continue;
        }

        // FIFO Stock Deduction
        // FOR UPDATE locks these rows for the rest of this transaction — without
        // it, two concurrent checkouts can both read the same quantityRemaining
        // and both succeed, overselling the last unit.
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

        const availableBatches = await tx.select()
          .from(stockBatches)
          .where(and(...batchFilters))
          .orderBy(asc(stockBatches.receivedAt))
          .for('update');

        const { deductions, remainingUnfulfilled } = pickFifoBatches(availableBatches, item.quantity);

        if (remainingUnfulfilled > 0) {
          throw new BusinessError(
            'INSUFFICIENT_STOCK',
            `Stok tidak cukup untuk item ${item.inventoryItemId}`,
            422
          );
        }

        // unitCost captured now, at sale time — a historical fact about which
        // batches this specific sale drew from (H6).
        const unitCost = calculateConsumedUnitCost(deductions, availableBatches);

        // Buat Invoice Line
        await tx.insert(posInvoiceLines).values({
          tenantId,
          posInvoiceId: newInvoice.id,
          sourceType: 'part',
          description: itemNameById.get(item.inventoryItemId) ?? 'Item tidak ditemukan',
          inventoryItemId: item.inventoryItemId,
          partBrandId: item.partBrandId || null,
          quantity: item.quantity,
          unitPrice: toMoneyString(item.unitPrice),
          subtotal: toMoneyString(lineSubtotal),
          unitCost: toMoneyString(Number(unitCost)),
        });

        // Terapkan setiap potongan batch (FIFO) yang sudah diputuskan di atas
        for (const deduction of deductions) {
          const batch = availableBatches.find(b => b.id === deduction.batchId)!;

          await tx.update(stockBatches)
            .set({ quantityRemaining: batch.quantityRemaining - deduction.quantity })
            .where(eq(stockBatches.id, batch.id));

          // Catat Stock Movement untuk potongan batch ini
          await tx.insert(stockMovements).values({
            tenantId,
            branchId: data.branchId,
            inventoryItemId: item.inventoryItemId,
            stockBatchId: batch.id, // Referensi ke batch mana yang kepakai
            movementType: 'out',
            quantity: -deduction.quantity,
            referenceType: 'pos_sale',
            referenceId: newInvoice.id
          });
        }

        // 5. Update Master Stock Level (Global per branch)
        // Dapatkan stok level saat ini, atau buat kalau belum ada (seharusnya ada)
        const stockLevel = await tx.query.stockLevels.findFirst({
          where: and(
            eq(stockLevels.tenantId, tenantId),
            eq(stockLevels.inventoryItemId, item.inventoryItemId),
            eq(stockLevels.branchId, data.branchId)
          )
        });

        if (stockLevel) {
          await tx.update(stockLevels)
            .set({ quantityAvailable: stockLevel.quantityAvailable - item.quantity })
            .where(eq(stockLevels.id, stockLevel.id));
        } else {
          // The FIFO deduction above already succeeded against real batches,
          // so physical stock genuinely exists — a missing stockLevels row here
          // means the level cache is out of sync with the batches, not that
          // stock is unavailable. Fail loudly rather than inventing a
          // negative-quantity row that would corrupt future stock reads.
          throw new BusinessError(
            'STOCK_LEVEL_MISSING',
            `No stock level record found for item ${item.inventoryItemId} at this branch — batches exist but the level cache does not`,
            422
          );
        }
      }

      return newInvoice;
    });

    return successResponse(c, result, undefined, 201);
  } catch (error) {
    if (error instanceof BusinessError) {
      return errorResponse(c, error.code, error.message, error.details, error.statusCode);
    }
    console.error('POS checkout failed:', error);
    return errorResponse(c, 'INTERNAL_SERVER_ERROR', 'Terjadi kesalahan saat memproses POS', undefined, 500);
  }
});

// DELETE /v1/pos/invoices/:id (Void)
router.delete('/invoices/:id', async (c) => {
  const { tenantId } = getAuthContext(c);
  const id = c.req.param('id');

  try {
    await db.transaction(async (tx) => {
      // 1. Fetch invoice and verify it is not already voided. Locked FOR UPDATE
      // so two simultaneous void requests for the same invoice can't both pass
      // this check before either has written 'voided' back.
      const [invoice] = await tx.select().from(posInvoices)
        .where(and(eq(posInvoices.id, id), eq(posInvoices.tenantId, tenantId)))
        .for('update');

      if (!invoice) throw new BusinessError('NOT_FOUND', 'Invoice not found', 404);
      if (invoice.status === 'voided') {
        throw new BusinessError('ALREADY_VOIDED', 'Invoice is already voided', 409);
      }

      // Second, independent guard: a 'void_pos' movement already existing for
      // this invoice means it was voided before, even if status somehow
      // disagrees — the movement ledger is append-only and the source of truth.
      const existingVoidMovements = await tx.select({ id: stockMovements.id })
        .from(stockMovements)
        .where(and(
          eq(stockMovements.referenceType, 'void_pos'),
          eq(stockMovements.referenceId, id)
        ));

      if (existingVoidMovements.length > 0) {
        throw new BusinessError('ALREADY_VOIDED', 'Invoice is already voided', 409);
      }

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
        // Return stock to batch. Locked FOR UPDATE — the same batch could be
        // concurrently consumed by another sale between this read and write.
        const [batch] = await tx.select().from(stockBatches)
          .where(eq(stockBatches.id, mov.stockBatchId!))
          .for('update');

        if (batch) {
          const restoredQuantity = batch.quantityRemaining + Math.abs(mov.quantity);

          // A batch can never hold more than it originally received. Exceeding
          // that means something else already changed this batch in a way that
          // makes this void inconsistent — fail loudly rather than invent stock.
          if (restoredQuantity > batch.quantityReceived) {
            throw new BusinessError(
              'VOID_CONFLICT',
              `Cannot void: batch ${batch.id} would exceed its received quantity`,
              409
            );
          }

          await tx.update(stockBatches)
            .set({ quantityRemaining: restoredQuantity })
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

      // 3. Update Master Stock Levels — locked FOR UPDATE for the same lost-update
      // reason as everywhere else in this file.
      for (const itemId of Object.keys(itemRestores)) {
        const qtyToRestore = itemRestores[itemId];
        const [stockLevel] = await tx.select().from(stockLevels)
          .where(and(
            eq(stockLevels.tenantId, tenantId),
            eq(stockLevels.inventoryItemId, itemId),
            eq(stockLevels.branchId, invoice.branchId)
          ))
          .for('update');

        if (stockLevel) {
          await tx.update(stockLevels)
            .set({ quantityAvailable: stockLevel.quantityAvailable + qtyToRestore })
            .where(eq(stockLevels.id, stockLevel.id));
        }
      }

      // 4. Update Invoice Status to voided — document lifecycle only; paymentStatus
      // (was this invoice paid before it was voided?) is left untouched.
      await tx.update(posInvoices)
        .set({ status: 'voided' })
        .where(eq(posInvoices.id, invoice.id));
    });

    return successResponse(c, { voided: true });
  } catch (error) {
    if (error instanceof BusinessError) {
      return errorResponse(c, error.code, error.message, error.details, error.statusCode);
    }
    console.error('Failed to void invoice:', error);
    return errorResponse(c, 'INTERNAL_SERVER_ERROR', 'Gagal melakukan void transaksi', undefined, 500);
  }
});

export { router as invoicesRouter };
