export type FifoBatch = { id: string; quantityRemaining: number };
export type FifoDeduction = { batchId: string; quantity: number };

/**
 * Pure decision — no database. Given batches already sorted oldest-first,
 * decides how much to take from each to satisfy the requested quantity.
 * If the batches don't have enough between them, `remainingUnfulfilled`
 * is left greater than 0 so the caller can reject the sale.
 */
export function pickFifoBatches(
  batches: FifoBatch[],
  quantityNeeded: number
): { deductions: FifoDeduction[]; remainingUnfulfilled: number } {
  const deductions: FifoDeduction[] = [];
  let remaining = quantityNeeded;

  for (const batch of batches) {
    if (remaining <= 0) break;
    const take = Math.min(batch.quantityRemaining, remaining);
    if (take > 0) {
      deductions.push({ batchId: batch.id, quantity: take });
      remaining -= take;
    }
  }

  return { deductions, remainingUnfulfilled: remaining };
}
