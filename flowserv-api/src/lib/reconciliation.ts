export type StockLevelRow = { inventoryItemId: string; branchId: string; quantityAvailable: number };
export type StockBatchRow = { inventoryItemId: string; branchId: string; quantityRemaining: number };

export type StockDrift = {
  inventoryItemId: string;
  branchId: string;
  cachedQuantity: number;
  batchSum: number;
  drift: number;
};

/**
 * Pure — no database. stock_levels is a denormalized cache of
 * SUM(stock_batches.quantity_remaining) (H4 decision: keep the cache, make it
 * honest). This is the one place that compares the two, so both the test
 * suite and the admin endpoint exercise the same logic.
 */
export function reconcileStockLevels(levels: StockLevelRow[], batches: StockBatchRow[]): StockDrift[] {
  const key = (itemId: string, branchId: string) => `${itemId}::${branchId}`;

  const batchSums = new Map<string, number>();
  for (const batch of batches) {
    const k = key(batch.inventoryItemId, batch.branchId);
    batchSums.set(k, (batchSums.get(k) ?? 0) + batch.quantityRemaining);
  }

  const cachedQuantities = new Map<string, number>();
  for (const level of levels) {
    const k = key(level.inventoryItemId, level.branchId);
    cachedQuantities.set(k, (cachedQuantities.get(k) ?? 0) + level.quantityAvailable);
  }

  const allKeys = new Set([...batchSums.keys(), ...cachedQuantities.keys()]);
  const drifts: StockDrift[] = [];

  for (const k of allKeys) {
    const [inventoryItemId, branchId] = k.split('::');
    const cachedQuantity = cachedQuantities.get(k) ?? 0;
    const batchSum = batchSums.get(k) ?? 0;
    if (cachedQuantity !== batchSum) {
      drifts.push({ inventoryItemId, branchId, cachedQuantity, batchSum, drift: cachedQuantity - batchSum });
    }
  }

  return drifts;
}
