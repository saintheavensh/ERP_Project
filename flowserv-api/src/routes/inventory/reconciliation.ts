import { Hono } from 'hono';
import { db } from '../../db/connection';
import { stockLevels, stockBatches } from '../../db/schema/index';
import { eq } from 'drizzle-orm';
import { getAuthContext } from '../../middleware/auth';
import { successResponse, errorResponse } from '../../lib/response';
import { reconcileStockLevels } from '../../lib/reconciliation';

const router = new Hono();

// GET /v1/inventory/reconciliation — H4 Part 3: compares the stock_levels
// cache against SUM(stock_batches.quantity_remaining) per item/branch.
router.get('/reconciliation', async (c) => {
  const { tenantId } = getAuthContext(c);

  try {
    const levels = await db.select({
      inventoryItemId: stockLevels.inventoryItemId,
      branchId: stockLevels.branchId,
      quantityAvailable: stockLevels.quantityAvailable,
    }).from(stockLevels).where(eq(stockLevels.tenantId, tenantId));

    const batches = await db.select({
      inventoryItemId: stockBatches.inventoryItemId,
      branchId: stockBatches.branchId,
      quantityRemaining: stockBatches.quantityRemaining,
    }).from(stockBatches).where(eq(stockBatches.tenantId, tenantId));

    const drift = reconcileStockLevels(levels, batches);

    return successResponse(c, { isClean: drift.length === 0, drift });
  } catch (err: any) {
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to reconcile stock levels', [err.message]);
  }
});

export { router as reconciliationRouter };
