export type WacBatch = { unitCost: string | number; quantityRemaining: number };

/**
 * Pure — no database. Weighted average cost across all batches that still
 * have remaining stock. The single implementation of this calculation —
 * it previously existed as three near-identical inline copies across
 * purchasing/invoices.ts, inventory/receipts.ts (missing), and opname.ts,
 * which is how the same item ended up costed differently depending on
 * which endpoint received it (RECOVERY-PLAN BUG-09).
 */
export function calculateWac(batches: WacBatch[]): string {
  let totalValue = 0;
  let totalQty = 0;

  for (const batch of batches) {
    if (batch.quantityRemaining > 0) {
      totalValue += parseFloat(batch.unitCost.toString()) * batch.quantityRemaining;
      totalQty += batch.quantityRemaining;
    }
  }

  return totalQty > 0 ? (totalValue / totalQty).toFixed(2) : '0.00';
}
