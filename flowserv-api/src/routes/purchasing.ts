import { Hono } from 'hono';
import { db } from '../db/connection';
import { purchaseOrders, purchaseOrderLines, stockBatches, stockMovements, stockLevels, inventoryItems, itemBrandPricing, supplierInvoices, suppliers } from '../db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { requireAuth, getAuthContext } from '../middleware/auth';
import { successResponse, errorResponse } from '../lib/response';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const purchasingRouter = new Hono();
purchasingRouter.use('*', requireAuth);

// GET /v1/purchasing/orders
purchasingRouter.get('/orders', async (c) => {
  const { tenantId } = getAuthContext(c);
  const status = c.req.query('status');
  
  try {
    const filters = [eq(purchaseOrders.tenantId, tenantId)];
    if (status) {
      filters.push(eq(purchaseOrders.status, status));
    }
    
    const orders = await db.query.purchaseOrders.findMany({
      where: and(...filters),
      orderBy: [desc(purchaseOrders.createdAt)],
      with: {
        supplier: true
      }
    });
    return successResponse(c, orders);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to fetch purchase orders', [err.message]);
  }
});

// GET /v1/purchasing/orders/:id
purchasingRouter.get('/orders/:id', async (c) => {
  const { tenantId } = getAuthContext(c);
  const orderId = c.req.param('id');
  
  try {
    const order = await db.query.purchaseOrders.findFirst({
      where: and(eq(purchaseOrders.id, orderId), eq(purchaseOrders.tenantId, tenantId)),
      with: {
        supplier: true,
        purchaseOrderLines: {
          with: {
            inventoryItem: {
              with: {
                category: true
              }
            },
            stockBatches: {
              with: {
                partBrand: true
              }
            }
          }
        }
      }
    });
    if (!order) return errorResponse(c, 'NOT_FOUND', 'Order not found', [], 404);
    return successResponse(c, order);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to fetch order', [err.message]);
  }
});

// POST /v1/purchasing/orders
const createOrderSchema = z.object({
  branchId: z.string().uuid(),
  supplierId: z.string().uuid(),
  expectedDeliveryDate: z.string().optional(),
  lines: z.array(z.object({
    inventoryItemId: z.string().uuid(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0).optional().default(0) // Estimated, now optional
  })).min(1)
});

purchasingRouter.post('/orders', zValidator('json', createOrderSchema), async (c) => {
  const { tenantId, userId } = getAuthContext(c);
  const data = c.req.valid('json');
  
  try {
    const result = await db.transaction(async (tx) => {
      // Calculate estimated total
      const estimatedTotal = data.lines.reduce((acc, line) => acc + (line.quantity * line.unitPrice), 0);
      
      const [order] = await tx.insert(purchaseOrders).values({
        tenantId,
        branchId: data.branchId,
        supplierId: data.supplierId,
        poNumber: `PO-${Date.now().toString().slice(-6)}`, // simple generator
        status: 'draft',
        expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : null,
        estimatedTotal: estimatedTotal.toString(),
        createdBy: userId // User UUID
      }).returning();
      
      const lineValues = data.lines.map(line => ({
        purchaseOrderId: order.id,
        inventoryItemId: line.inventoryItemId,
        quantity: line.quantity,
        unitPrice: line.unitPrice.toString()
      }));
      
      await tx.insert(purchaseOrderLines).values(lineValues);
      
      return order;
    });
    
    return successResponse(c, result, undefined, 201);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create purchase order', [err.message]);
  }
});

// PUT /v1/purchasing/orders/:id/status
const updateStatusSchema = z.object({
  status: z.enum(['draft', 'ordered', 'received', 'completed'])
});

purchasingRouter.put('/orders/:id/status', zValidator('json', updateStatusSchema), async (c) => {
  const { tenantId } = getAuthContext(c);
  const orderId = c.req.param('id');
  const { status } = c.req.valid('json');
  
  try {
    const [updated] = await db.update(purchaseOrders)
      .set({ status })
      .where(and(eq(purchaseOrders.id, orderId), eq(purchaseOrders.tenantId, tenantId)))
      .returning();
      
    if (!updated) return errorResponse(c, 'NOT_FOUND', 'Order not found', [], 404);
    
    return successResponse(c, updated);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update status', [err.message]);
  }
});

// POST /v1/purchasing/orders/:id/receive (Phase 2 - Warehouse)
const receiveSchema = z.object({
  lines: z.array(z.object({
    lineId: z.string().uuid(),
    splits: z.array(z.object({
      partBrandId: z.string().uuid().nullable().optional(),
      receivedQuantity: z.number().min(1)
    })).optional(),
    receivedQuantity: z.number().min(0).optional() // fallback if no splits
  }))
});

purchasingRouter.post('/orders/:id/receive', zValidator('json', receiveSchema), async (c) => {
  const { tenantId, userId } = getAuthContext(c);
  const orderId = c.req.param('id');
  const { lines } = c.req.valid('json');
  
  try {
    const result = await db.transaction(async (tx) => {
      const order = await tx.query.purchaseOrders.findFirst({
        where: and(eq(purchaseOrders.id, orderId), eq(purchaseOrders.tenantId, tenantId))
      });
      
      if (!order) throw new Error('Order not found');
      if (order.status === 'received' || order.status === 'completed') throw new Error('Order is already received');
      
      let allReceived = true;
      
      for (const lineInput of lines) {
        // Calculate total received for this line
        let lineTotalReceived = 0;
        if (lineInput.splits && lineInput.splits.length > 0) {
          lineTotalReceived = lineInput.splits.reduce((sum, s) => sum + s.receivedQuantity, 0);
        } else if (lineInput.receivedQuantity !== undefined) {
          lineTotalReceived = lineInput.receivedQuantity;
        }

        if (lineTotalReceived === 0) {
          allReceived = false;
          continue; 
        }
        
        // Update line received qty
        const [line] = await tx.update(purchaseOrderLines)
          .set({ receivedQuantity: lineTotalReceived })
          .where(eq(purchaseOrderLines.id, lineInput.lineId))
          .returning();
          
        if (line.receivedQuantity < line.quantity) allReceived = false;
        
        // If splits are provided, insert multiple batches
        if (lineInput.splits && lineInput.splits.length > 0) {
          for (const split of lineInput.splits) {
            const [batch] = await tx.insert(stockBatches).values({
              tenantId,
              branchId: order.branchId,
              inventoryItemId: line.inventoryItemId,
              supplierId: order.supplierId,
              partBrandId: split.partBrandId || null,
              purchaseOrderLineId: line.id,
              unitCost: line.unitPrice.toString(), 
              quantityReceived: split.receivedQuantity,
              quantityRemaining: split.receivedQuantity
            }).returning();
            
            await tx.insert(stockMovements).values({
              tenantId,
              branchId: order.branchId,
              inventoryItemId: line.inventoryItemId,
              stockBatchId: batch.id,
              movementType: 'in',
              quantity: split.receivedQuantity,
              referenceType: 'purchase_order',
              referenceId: order.id
            });
          }
        } else {
           // Fallback: no brand specific splitting, just insert one batch
           const [batch] = await tx.insert(stockBatches).values({
              tenantId,
              branchId: order.branchId,
              inventoryItemId: line.inventoryItemId,
              supplierId: order.supplierId,
              purchaseOrderLineId: line.id,
              unitCost: line.unitPrice.toString(), 
              quantityReceived: lineTotalReceived,
              quantityRemaining: lineTotalReceived
            }).returning();
            
            await tx.insert(stockMovements).values({
              tenantId,
              branchId: order.branchId,
              inventoryItemId: line.inventoryItemId,
              stockBatchId: batch.id,
              movementType: 'in',
              quantity: lineTotalReceived,
              referenceType: 'purchase_order',
              referenceId: order.id
            });
        }
        
        // Upsert Stock Level (aggregating total)
        const existingLevels = await tx.select().from(stockLevels).where(
          and(
            eq(stockLevels.inventoryItemId, line.inventoryItemId),
            eq(stockLevels.branchId, order.branchId)
          )
        );
        
        if (existingLevels.length > 0) {
          await tx.update(stockLevels)
            .set({ quantityAvailable: existingLevels[0].quantityAvailable + lineTotalReceived })
            .where(eq(stockLevels.id, existingLevels[0].id));
        } else {
          await tx.insert(stockLevels).values({
            inventoryItemId: line.inventoryItemId,
            branchId: order.branchId,
            quantityAvailable: lineTotalReceived,
            quantityReserved: 0
          });
        }
      }
      
      // Update PO Status
      const [updatedOrder] = await tx.update(purchaseOrders)
        .set({ status: 'received' })
        .where(eq(purchaseOrders.id, orderId))
        .returning();
        
      return updatedOrder;
    });
    
    return successResponse(c, result);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to receive purchase order', [err.message]);
  }
});

// POST /v1/purchasing/orders/:id/invoice (Phase 3 - Costing/Manager)
const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1),
  invoiceDate: z.string(),
  invoiceDueDate: z.string().optional(),
  paymentMethod: z.enum(['cash', 'transfer', 'tempo']).default('cash'),
  batches: z.array(z.object({
    batchId: z.string().uuid(),
    actualUnitCost: z.number().min(0),
    sellingPrice: z.number().min(0)
  }))
});

purchasingRouter.post('/orders/:id/invoice', zValidator('json', invoiceSchema), async (c) => {
  const { tenantId } = getAuthContext(c);
  const orderId = c.req.param('id');
  const data = c.req.valid('json');
  
  try {
    const result = await db.transaction(async (tx) => {
      const order = await tx.query.purchaseOrders.findFirst({
        where: and(eq(purchaseOrders.id, orderId), eq(purchaseOrders.tenantId, tenantId))
      });
      if (!order) throw new Error('Order not found');
      
      let actualTotal = 0;
      
      for (const batchInput of data.batches) {
        // Fetch current batch
        const [batch] = await tx.select().from(stockBatches).where(eq(stockBatches.id, batchInput.batchId));
        if (!batch) continue;
        
        actualTotal += (batchInput.actualUnitCost * batch.quantityReceived);
        
        // Update batch actual unit cost
        await tx.update(stockBatches)
          .set({ unitCost: batchInput.actualUnitCost.toString() })
          .where(eq(stockBatches.id, batch.id));
          
        // Upsert Selling Price
        if (batch.partBrandId) {
          // Check if exists
          const existingPricing = await tx.select().from(itemBrandPricing).where(
            and(
              eq(itemBrandPricing.inventoryItemId, batch.inventoryItemId),
              eq(itemBrandPricing.partBrandId, batch.partBrandId)
            )
          );
          
          if (existingPricing.length > 0) {
            await tx.update(itemBrandPricing)
              .set({ sellingPrice: batchInput.sellingPrice.toString(), updatedAt: new Date() })
              .where(eq(itemBrandPricing.id, existingPricing[0].id));
          } else {
            await tx.insert(itemBrandPricing).values({
              tenantId,
              inventoryItemId: batch.inventoryItemId,
              partBrandId: batch.partBrandId,
              sellingPrice: batchInput.sellingPrice.toString()
            });
          }
        } else {
          // Base item selling price
          await tx.update(inventoryItems)
            .set({ sellingPrice: batchInput.sellingPrice.toString() })
            .where(eq(inventoryItems.id, batch.inventoryItemId));
        }
          
        // Re-calculate Moving Average Cost (WAC) for the inventory item globally
        const activeBatches = await tx.select().from(stockBatches)
          .where(and(
            eq(stockBatches.inventoryItemId, batch.inventoryItemId),
            sql`${stockBatches.quantityRemaining} > 0`
          ));
          
        let totalValue = 0;
        let totalQty = 0;
        activeBatches.forEach(b => {
          totalValue += (parseFloat(b.unitCost) * b.quantityRemaining);
          totalQty += b.quantityRemaining;
        });
        
        const wac = totalQty > 0 ? (totalValue / totalQty).toFixed(2) : '0.00';
        
        await tx.update(inventoryItems)
          .set({ 
            unitCostAvg: wac
          })
          .where(eq(inventoryItems.id, batch.inventoryItemId));
      }
      
      // Complete the order
      const [updatedOrder] = await tx.update(purchaseOrders)
        .set({ 
          status: 'completed',
          invoiceNumber: data.invoiceNumber,
          invoiceDate: new Date(data.invoiceDate),
          invoiceDueDate: data.invoiceDueDate ? new Date(data.invoiceDueDate) : null,
          actualTotal: actualTotal.toString()
        })
        .where(eq(purchaseOrders.id, orderId))
        .returning();
        
      // Create Accounts Payable (Supplier Invoice) record if payment is tempo
      if (data.paymentMethod === 'tempo') {
        const [supplier] = await tx.select().from(suppliers).where(eq(suppliers.id, order.supplierId));
        
        let dueDate = data.invoiceDueDate ? new Date(data.invoiceDueDate) : null;
        if (!dueDate && supplier && supplier.paymentTermDays) {
          dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + supplier.paymentTermDays);
        }

        await tx.insert(supplierInvoices).values({
          tenantId,
          branchId: order.branchId,
          supplierId: order.supplierId,
          purchaseOrderId: order.id,
          invoiceNumber: data.invoiceNumber,
          invoiceDate: new Date(data.invoiceDate),
          dueDate: dueDate,
          totalAmount: actualTotal.toString(),
          amountPaid: '0',
          status: 'pending',
          paymentMethod: data.paymentMethod
        });
      } else {
        // If cash/transfer, create invoice but mark as paid
        await tx.insert(supplierInvoices).values({
          tenantId,
          branchId: order.branchId,
          supplierId: order.supplierId,
          purchaseOrderId: order.id,
          invoiceNumber: data.invoiceNumber,
          invoiceDate: new Date(data.invoiceDate),
          dueDate: data.invoiceDueDate ? new Date(data.invoiceDueDate) : null,
          totalAmount: actualTotal.toString(),
          amountPaid: actualTotal.toString(),
          status: 'paid',
          paymentMethod: data.paymentMethod
        });
      }
        
      return updatedOrder;
    });
    
    return successResponse(c, result);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to process invoice', [err.message]);
  }
});

// DELETE /v1/purchasing/orders/:id
purchasingRouter.delete('/orders/:id', async (c) => {
  const { tenantId } = getAuthContext(c);
  const orderId = c.req.param('id');
  
  try {
    await db.transaction(async (tx) => {
      // 1. Get the order to check status
      const order = await tx.query.purchaseOrders.findFirst({
        where: and(eq(purchaseOrders.id, orderId), eq(purchaseOrders.tenantId, tenantId))
      });
      
      if (!order) throw new Error('Order not found');
      
      // TODO: In Production, prevent deletion if status is 'received' or 'completed'
      // if (order.status === 'received' || order.status === 'completed') {
      //   throw new Error('Cannot delete a PO that has already been received. Please use purchase returns.');
      // }
      
      // 2. Find lines
      const lines = await tx.query.purchaseOrderLines.findMany({
        where: eq(purchaseOrderLines.purchaseOrderId, orderId)
      });
      
      const lineIds = lines.map(l => l.id);
      
      if (lineIds.length > 0) {
        // Find stock batches related to these lines
        const batches = await tx.query.stockBatches.findMany({
          // Note: we can't easily query whereIn array in drizzle without inArray, so we loop or build query.
          // Let's just fetch all batches for this tenant and filter, or use raw sql.
        });
      }
      
      // Simple dev rollback (ignoring strict consistency for now since it's requested by user for dev)
      if (lineIds.length > 0) {
        // Rollback stock levels manually by looking up batches
        // This is complex, but required for the "undo" effect.
        for (const line of lines) {
           const relatedBatches = await tx.query.stockBatches.findMany({
             where: eq(stockBatches.purchaseOrderLineId, line.id)
           });
           
           for (const batch of relatedBatches) {
             // delete movements
             await tx.delete(stockMovements).where(eq(stockMovements.stockBatchId, batch.id));
             
             // decrement stock level
             await tx.execute(sql`
               UPDATE stock_levels 
               SET quantity_available = quantity_available - ${batch.quantityReceived}
               WHERE inventory_item_id = ${batch.inventoryItemId} AND branch_id = ${batch.branchId}
             `);
           }
           
           // delete batches
           await tx.delete(stockBatches).where(eq(stockBatches.purchaseOrderLineId, line.id));
        }
      }
      
      // Delete lines
      await tx.delete(purchaseOrderLines).where(eq(purchaseOrderLines.purchaseOrderId, orderId));
      
      // Delete order
      await tx.delete(purchaseOrders).where(eq(purchaseOrders.id, orderId));
    });
    
    return successResponse(c, null);
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete order', [err.message]);
  }
});

export { purchasingRouter };
