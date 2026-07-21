export type FifoBatch = { id: string; quantityRemaining: number };
export type FifoDeduction = { batchId: string; quantity: number };
export type FifoBatchWithCost = FifoBatch & { unitCost: string | number };

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

/**
 * Pure — no database. Weighted-average cost of a set of FIFO deductions,
 * using each consumed batch's own unitCost. This is what pos_invoice_lines
 * .unitCost captures at sale time: a historical fact about which batches
 * this specific sale drew from — not calculateWac's question (the average
 * of what's left in stock, a different number that keeps changing).
 */
export function calculateConsumedUnitCost(
  deductions: FifoDeduction[],
  batches: FifoBatchWithCost[]
): string {
  let totalValue = 0;
  let totalQty = 0;

  for (const deduction of deductions) {
    const batch = batches.find(b => b.id === deduction.batchId);
    if (!batch) continue;
    totalValue += parseFloat(batch.unitCost.toString()) * deduction.quantity;
    totalQty += deduction.quantity;
  }

  return totalQty > 0 ? (totalValue / totalQty).toFixed(2) : '0.00';
}
