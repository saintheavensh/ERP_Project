import { Hono } from 'hono';
import { db } from '../db/connection';
import { stockBatches, stockMovements, stockLevels, suppliers, inventoryItems } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth, getAuthContext } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { auditMiddleware } from '../middleware/audit';
import { successResponse, errorResponse } from '../lib/response';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { calculateWac } from '../lib/wac';

const opnameRouter = new Hono();
opnameRouter.use('*', requireAuth);

const opnameSchema = z.object({
  branchId: z.string().uuid(),
  items: z.array(z.object({
    inventoryItemId: z.string().uuid(),
    quantity: z.number().min(1),
    supplierId: z.string().uuid().optional().nullable(),
    brandId: z.string().uuid().optional().nullable(),
    unitCost: z.number().min(0),
    sellingPrice: z.number().min(0).optional()
  })).optional().default([]),
  skippedItemIds: z.array(z.string().uuid()).optional().default([])
});

// POST /v1/opname
opnameRouter.post('/', requirePermission('inventory.adjust_stock'), zValidator('json', opnameSchema), auditMiddleware({ action: 'stock.adjust', entityType: 'stock_opname', bodyFields: ['branchId', 'items', 'skippedItemIds'] }), async (c) => {
  const { tenantId } = getAuthContext(c);
  const data = c.req.valid('json');
  
  try {
    let systemSupplierId: string | null = null;

    await db.transaction(async (tx) => {
      // 1. Process each item
      for (const item of data.items) {
        let finalSupplierId = item.supplierId;
        
        // 2. If no supplier provided, find or create the dummy supplier
        if (!finalSupplierId) {
          if (!systemSupplierId) {
            // Find existing
            const existing = await tx.query.suppliers.findFirst({
              where: and(
                eq(suppliers.tenantId, tenantId),
                eq(suppliers.name, 'STOK AWAL (UNKNOWN SYSTEM)')
              )
            });
            
            if (existing) {
              systemSupplierId = existing.id;
            } else {
              // Create dummy supplier
              const [newSupp] = await tx.insert(suppliers).values({
                tenantId,
                name: 'STOK AWAL (UNKNOWN SYSTEM)',
                type: 'wholesale',
                paymentTermDays: 0
              }).returning();
              systemSupplierId = newSupp.id;
            }
          }
          finalSupplierId = systemSupplierId;
        }
        
        // 3. Create stock batch
        const [batch] = await tx.insert(stockBatches).values({
          tenantId,
          branchId: data.branchId,
          inventoryItemId: item.inventoryItemId,
          partBrandId: item.brandId,
          supplierId: finalSupplierId!,
          unitCost: item.unitCost.toString(),
          quantityReceived: item.quantity,
          quantityRemaining: item.quantity
        }).returning();
        
        // 4. Create stock movement
        await tx.insert(stockMovements).values({
          tenantId,
          branchId: data.branchId,
          inventoryItemId: item.inventoryItemId,
          stockBatchId: batch.id,
          movementType: 'in', // opname upload = stock entering the system, same as a goods receipt
          quantity: item.quantity
        });
        
        // 5. Update stock levels — locked FOR UPDATE so two concurrent opname
        // uploads for the same item/branch don't lose one of the two increments.
        const [existingLevel] = await tx.select().from(stockLevels).where(
          and(
            eq(stockLevels.tenantId, tenantId),
            eq(stockLevels.inventoryItemId, item.inventoryItemId),
            eq(stockLevels.branchId, data.branchId)
          )
        ).for('update');

        if (existingLevel) {
          await tx.update(stockLevels)
            .set({ quantityAvailable: existingLevel.quantityAvailable + item.quantity })
            .where(eq(stockLevels.id, existingLevel.id));
        } else {
          await tx.insert(stockLevels).values({
            tenantId,
            inventoryItemId: item.inventoryItemId,
            branchId: data.branchId,
            quantityAvailable: item.quantity,
            quantityReserved: 0
          });
        }

        // 6. Recalculate WAC for the inventory item
        const allActiveBatches = await tx.select().from(stockBatches).where(
          and(
            eq(stockBatches.inventoryItemId, item.inventoryItemId),
            eq(stockBatches.tenantId, tenantId)
          )
        ).for('update');

        const wac = calculateWac(allActiveBatches);
        
        let updateData: { unitCostAvg: string; isStockInitialized: boolean; sellingPrice?: string } = { 
          unitCostAvg: wac, 
          isStockInitialized: true 
        };
        if (item.sellingPrice !== undefined) {
          updateData.sellingPrice = item.sellingPrice.toString();
        }
        
        await tx.update(inventoryItems)
          .set(updateData)
          .where(eq(inventoryItems.id, item.inventoryItemId));
      }
      
      // 7. Process skipped items
      if (data.skippedItemIds && data.skippedItemIds.length > 0) {
        for (const skippedId of data.skippedItemIds) {
          await tx.update(inventoryItems)
            .set({ isStockInitialized: true })
            .where(eq(inventoryItems.id, skippedId));
        }
      }
    });

    return successResponse(c, { message: 'Stock opname processed successfully' });
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to process opname', [err.message]);
  }
});

export { opnameRouter };
