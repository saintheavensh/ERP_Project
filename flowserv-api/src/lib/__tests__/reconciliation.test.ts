import { describe, it, expect } from 'vitest';
import { reconcileStockLevels } from '../reconciliation';

describe('reconcileStockLevels', () => {
  it('reports no drift when the cache equals the batch sum', () => {
    const levels = [{ inventoryItemId: 'item-1', branchId: 'branch-1', quantityAvailable: 8 }];
    const batches = [
      { inventoryItemId: 'item-1', branchId: 'branch-1', quantityRemaining: 5 },
      { inventoryItemId: 'item-1', branchId: 'branch-1', quantityRemaining: 3 },
    ];

    expect(reconcileStockLevels(levels, batches)).toEqual([]);
  });

  it('reports a drift when the cache disagrees with the batch sum', () => {
    const levels = [{ inventoryItemId: 'item-1', branchId: 'branch-1', quantityAvailable: 10 }];
    const batches = [{ inventoryItemId: 'item-1', branchId: 'branch-1', quantityRemaining: 7 }];

    expect(reconcileStockLevels(levels, batches)).toEqual([
      { inventoryItemId: 'item-1', branchId: 'branch-1', cachedQuantity: 10, batchSum: 7, drift: 3 },
    ]);
  });

  it('reports drift for an item/branch with batches but no stock_levels row at all', () => {
    const levels: { inventoryItemId: string; branchId: string; quantityAvailable: number }[] = [];
    const batches = [{ inventoryItemId: 'item-2', branchId: 'branch-1', quantityRemaining: 4 }];

    expect(reconcileStockLevels(levels, batches)).toEqual([
      { inventoryItemId: 'item-2', branchId: 'branch-1', cachedQuantity: 0, batchSum: 4, drift: -4 },
    ]);
  });

  it('reports drift for a stock_levels row with no batches backing it (fully consumed or stale)', () => {
    const levels = [{ inventoryItemId: 'item-3', branchId: 'branch-1', quantityAvailable: 2 }];
    const batches: { inventoryItemId: string; branchId: string; quantityRemaining: number }[] = [];

    expect(reconcileStockLevels(levels, batches)).toEqual([
      { inventoryItemId: 'item-3', branchId: 'branch-1', cachedQuantity: 2, batchSum: 0, drift: 2 },
    ]);
  });

  it('ignores batches that have zero remaining quantity but still sum them correctly', () => {
    const levels = [{ inventoryItemId: 'item-4', branchId: 'branch-1', quantityAvailable: 5 }];
    const batches = [
      { inventoryItemId: 'item-4', branchId: 'branch-1', quantityRemaining: 5 },
      { inventoryItemId: 'item-4', branchId: 'branch-1', quantityRemaining: 0 },
    ];

    expect(reconcileStockLevels(levels, batches)).toEqual([]);
  });
});
