import { describe, it, expect } from 'vitest';
import {
  buildSaleEntries,
  buildVoidReversalEntries,
  buildTicketCogsEntry,
  buildApInvoiceEntry,
  buildApSettlementEntry,
} from '../ledger';

const invoice = { id: 'inv-1', tenantId: 'tenant-1', branchId: 'branch-1', grandTotal: 150000 };

describe('buildSaleEntries', () => {
  it('posts revenue with zero COGS for a labor-only sale', () => {
    const lines = [{ sourceType: 'labor' as const, quantity: 1, unitCost: null }];

    const entries = buildSaleEntries(invoice, lines);

    expect(entries).toEqual([
      { tenantId: 'tenant-1', branchId: 'branch-1', entryType: 'revenue', amount: 150000, referenceType: 'pos_sale', referenceId: 'inv-1' },
    ]);
  });

  it('posts a matched revenue/COGS pair for a part-only sale', () => {
    const lines = [{ sourceType: 'part' as const, quantity: 2, unitCost: 50000 }];

    const entries = buildSaleEntries(invoice, lines);

    expect(entries).toEqual([
      { tenantId: 'tenant-1', branchId: 'branch-1', entryType: 'revenue', amount: 150000, referenceType: 'pos_sale', referenceId: 'inv-1' },
      { tenantId: 'tenant-1', branchId: 'branch-1', entryType: 'cogs', amount: 100000, referenceType: 'pos_sale', referenceId: 'inv-1' },
    ]);
  });

  it('covers only the part lines of a mixed sale, ignoring labor/fee lines entirely', () => {
    const lines = [
      { sourceType: 'part' as const, quantity: 1, unitCost: 40000 },
      { sourceType: 'labor' as const, quantity: 1, unitCost: null },
      { sourceType: 'fee' as const, quantity: 1, unitCost: null },
    ];

    const entries = buildSaleEntries(invoice, lines);

    const cogsEntry = entries.find((e) => e.entryType === 'cogs');
    expect(cogsEntry?.amount).toBe(40000);
  });

  it('sums each part line by its own captured unit cost rather than averaging across lines', () => {
    // Two part lines with different blended-FIFO unit costs (e.g. one line drew
    // from a 10k batch, the other from a mix of 10k/12k batches) — the total
    // must be the exact sum, never a re-averaged cost across both lines.
    const lines = [
      { sourceType: 'part' as const, quantity: 5, unitCost: 10000 },
      { sourceType: 'part' as const, quantity: 5, unitCost: 11200 }, // blended cost from a split batch
    ];

    const entries = buildSaleEntries(invoice, lines);

    const cogsEntry = entries.find((e) => e.entryType === 'cogs');
    expect(cogsEntry?.amount).toBe(5 * 10000 + 5 * 11200);
  });
});

describe('buildVoidReversalEntries', () => {
  it('nets the original entries to zero, referenceType/referenceId unchanged', () => {
    const lines = [{ sourceType: 'part' as const, quantity: 2, unitCost: 50000 }];

    const original = buildSaleEntries(invoice, lines);
    const reversal = buildVoidReversalEntries(invoice, lines);

    const byType = (type: string) =>
      [...original, ...reversal].filter((e) => e.entryType === type).reduce((sum, e) => sum + e.amount, 0);

    expect(byType('revenue')).toBe(0);
    expect(byType('cogs')).toBe(0);
    expect(reversal.every((e) => e.referenceType === 'pos_sale' && e.referenceId === 'inv-1')).toBe(true);
  });

  it('reverses a labor-only sale (revenue only, no COGS to reverse)', () => {
    const lines = [{ sourceType: 'labor' as const, quantity: 1, unitCost: null }];

    const reversal = buildVoidReversalEntries(invoice, lines);

    expect(reversal).toEqual([
      { tenantId: 'tenant-1', branchId: 'branch-1', entryType: 'revenue', amount: -150000, referenceType: 'pos_sale', referenceId: 'inv-1' },
    ]);
  });
});

describe('buildTicketCogsEntry', () => {
  it('posts COGS with no revenue counterpart', () => {
    const entries = buildTicketCogsEntry({
      tenantId: 'tenant-1',
      branchId: 'branch-1',
      chargeId: 'charge-1',
      unitCost: 25000,
      quantity: 3,
    });

    expect(entries).toEqual([
      { tenantId: 'tenant-1', branchId: 'branch-1', entryType: 'cogs', amount: 75000, referenceType: 'ticket_consumption', referenceId: 'charge-1' },
    ]);
  });

  it('posts nothing for a zero-cost consumption', () => {
    const entries = buildTicketCogsEntry({
      tenantId: 'tenant-1',
      branchId: 'branch-1',
      chargeId: 'charge-1',
      unitCost: 0,
      quantity: 3,
    });

    expect(entries).toEqual([]);
  });
});

describe('accounts payable entries', () => {
  it('a supplier invoice followed by full payment nets its AP balance to zero', () => {
    const invoiceEntry = buildApInvoiceEntry({
      tenantId: 'tenant-1',
      branchId: 'branch-1',
      invoiceId: 'sup-inv-1',
      totalAmount: 1000000,
    });
    const paymentEntry = buildApSettlementEntry({
      tenantId: 'tenant-1',
      branchId: 'branch-1',
      invoiceId: 'sup-inv-1',
      amount: 1000000,
    });

    const balance = [...invoiceEntry, ...paymentEntry].reduce((sum, e) => sum + e.amount, 0);
    expect(balance).toBe(0);
  });

  it('a partial payment leaves the remaining AP balance posted', () => {
    const invoiceEntry = buildApInvoiceEntry({
      tenantId: 'tenant-1',
      branchId: 'branch-1',
      invoiceId: 'sup-inv-1',
      totalAmount: 1000000,
    });
    const paymentEntry = buildApSettlementEntry({
      tenantId: 'tenant-1',
      branchId: 'branch-1',
      invoiceId: 'sup-inv-1',
      amount: 400000,
    });

    const balance = [...invoiceEntry, ...paymentEntry].reduce((sum, e) => sum + e.amount, 0);
    expect(balance).toBe(600000);
  });
});
