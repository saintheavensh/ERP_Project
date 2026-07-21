export type InvoiceForReconcile = { id: string; grandTotal: number; status: 'active' | 'voided' };
export type RevenueEntryRow = { referenceId: string; amount: number };

export type LedgerGap = {
  invoiceId: string;
  expectedRevenue: number;
  postedRevenue: number;
  gap: number;
};

/**
 * Pure — no database. Compares each POS invoice's expected revenue (its
 * grandTotal, or 0 if voided — a void's reversal entry should have netted
 * the original to zero) against what is actually posted in
 * finance_ledger_entries for entryType='revenue'/referenceType='pos_sale'.
 * A non-empty gap list means some invoice never got posted (the commit→post
 * gap this task's design deliberately accepts) or a posting bug.
 */
export function reconcileSaleLedger(invoices: InvoiceForReconcile[], revenueEntries: RevenueEntryRow[]): LedgerGap[] {
  const postedByInvoice = new Map<string, number>();
  for (const entry of revenueEntries) {
    postedByInvoice.set(entry.referenceId, (postedByInvoice.get(entry.referenceId) ?? 0) + entry.amount);
  }

  const gaps: LedgerGap[] = [];
  for (const invoice of invoices) {
    const expectedRevenue = invoice.status === 'voided' ? 0 : invoice.grandTotal;
    const postedRevenue = postedByInvoice.get(invoice.id) ?? 0;
    // Money is stored/rounded to cents — guard against float noise, not real gaps.
    if (Math.abs(expectedRevenue - postedRevenue) > 0.005) {
      gaps.push({ invoiceId: invoice.id, expectedRevenue, postedRevenue, gap: roundGap(expectedRevenue - postedRevenue) });
    }
  }
  return gaps;
}

function roundGap(n: number): number {
  return Math.round(n * 100) / 100;
}
