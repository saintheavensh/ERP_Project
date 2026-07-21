import { describe, it, expect } from 'vitest';
import { reconcileSaleLedger } from '../ledger-reconciliation';

describe('reconcileSaleLedger', () => {
  it('reports no gap when an active invoice has matching posted revenue', () => {
    const invoices = [{ id: 'inv-1', grandTotal: 150000, status: 'active' as const }];
    const entries = [{ referenceId: 'inv-1', amount: 150000 }];

    expect(reconcileSaleLedger(invoices, entries)).toEqual([]);
  });

  it('reports no gap for a voided invoice whose entries net to zero', () => {
    const invoices = [{ id: 'inv-1', grandTotal: 150000, status: 'voided' as const }];
    const entries = [
      { referenceId: 'inv-1', amount: 150000 },
      { referenceId: 'inv-1', amount: -150000 },
    ];

    expect(reconcileSaleLedger(invoices, entries)).toEqual([]);
  });

  it('flags an active invoice with no posted revenue at all', () => {
    const invoices = [{ id: 'inv-1', grandTotal: 150000, status: 'active' as const }];
    const entries: { referenceId: string; amount: number }[] = [];

    expect(reconcileSaleLedger(invoices, entries)).toEqual([
      { invoiceId: 'inv-1', expectedRevenue: 150000, postedRevenue: 0, gap: 150000 },
    ]);
  });

  it('flags a voided invoice that was never reversed (still shows posted revenue)', () => {
    const invoices = [{ id: 'inv-1', grandTotal: 150000, status: 'voided' as const }];
    const entries = [{ referenceId: 'inv-1', amount: 150000 }];

    expect(reconcileSaleLedger(invoices, entries)).toEqual([
      { invoiceId: 'inv-1', expectedRevenue: 0, postedRevenue: 150000, gap: -150000 },
    ]);
  });

  it('checks each invoice independently across a mixed set', () => {
    const invoices = [
      { id: 'inv-1', grandTotal: 100000, status: 'active' as const },
      { id: 'inv-2', grandTotal: 200000, status: 'active' as const },
    ];
    const entries = [{ referenceId: 'inv-1', amount: 100000 }];

    expect(reconcileSaleLedger(invoices, entries)).toEqual([
      { invoiceId: 'inv-2', expectedRevenue: 200000, postedRevenue: 0, gap: 200000 },
    ]);
  });
});
