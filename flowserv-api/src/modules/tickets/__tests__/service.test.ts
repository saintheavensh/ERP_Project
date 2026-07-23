import { describe, it, expect } from 'vitest';
import {
  calculateTicketTotals,
  canModifyCharge,
  canCancelTicket,
  calculateTicketMargin,
  describeAssignment,
  isBillableCharge,
  type ChargeCalcRow,
} from '../service';

// A ticket with: 2 parts (approved), 1 labor (approved), 1 estimated part still being
// quoted, and 1 cancelled part that must count toward nothing.
const sampleCharges: ChargeCalcRow[] = [
  { status: 'approved', quantity: 2, unitPrice: 150000, unitCost: 100000 }, // part, 300k rev / 200k cost
  { status: 'approved', quantity: 1, unitPrice: 200000, unitCost: null },   // labor, 200k rev / 0 cost
  { status: 'estimated', quantity: 1, unitPrice: 50000, unitCost: null },   // fee still estimated
  { status: 'cancelled', quantity: 3, unitPrice: 999999, unitCost: 500000 }, // ignored entirely
];

describe('calculateTicketTotals', () => {
  it('sums quantity × unitPrice grouped by lifecycle bucket', () => {
    const totals = calculateTicketTotals(sampleCharges);
    expect(totals.estimated).toBe(50000);   // the one estimated fee
    expect(totals.approved).toBe(500000);   // 300k part + 200k labor
    expect(totals.consumed).toBe(0);        // none consumed yet
  });

  it('excludes cancelled charges from every bucket', () => {
    const totals = calculateTicketTotals([
      { status: 'cancelled', quantity: 10, unitPrice: 100000, unitCost: null },
    ]);
    expect(totals).toEqual({ estimated: 0, approved: 0, consumed: 0 });
  });

  it('returns zeros for an empty ticket', () => {
    expect(calculateTicketTotals([])).toEqual({ estimated: 0, approved: 0, consumed: 0 });
  });

  it('handles a quantity greater than one', () => {
    const totals = calculateTicketTotals([
      { status: 'estimated', quantity: 3, unitPrice: 125000, unitCost: null },
    ]);
    expect(totals.estimated).toBe(375000);
  });
});

describe('canModifyCharge', () => {
  it('allows editing an estimated charge', () => {
    expect(canModifyCharge({ status: 'estimated' })).toBe(true);
  });

  it('locks approved, consumed and cancelled charges', () => {
    expect(canModifyCharge({ status: 'approved' })).toBe(false);
    expect(canModifyCharge({ status: 'consumed' })).toBe(false);
    expect(canModifyCharge({ status: 'cancelled' })).toBe(false);
  });
});

describe('canCancelTicket (F3)', () => {
  it('allows cancelling an open ticket', () => {
    expect(canCancelTicket('open')).toBe(true);
  });

  it('blocks cancelling an already-closed ticket', () => {
    expect(canCancelTicket('closed')).toBe(false);
  });

  it('blocks cancelling an already-cancelled ticket', () => {
    expect(canCancelTicket('cancelled')).toBe(false);
  });
});

describe('calculateTicketMargin', () => {
  it('computes revenue − cost over non-cancelled charges', () => {
    // revenue = 300k + 200k + 50k = 550k ; cost = 200k + 0 + 0 = 200k
    const m = calculateTicketMargin(sampleCharges);
    expect(m.revenue).toBe(550000);
    expect(m.cost).toBe(200000);
    expect(m.margin).toBe(350000);
  });

  it('treats a zero-cost labor line as pure margin (null unitCost adds nothing to cost)', () => {
    const m = calculateTicketMargin([
      { status: 'approved', quantity: 1, unitPrice: 200000, unitCost: null },
    ]);
    expect(m.revenue).toBe(200000);
    expect(m.cost).toBe(0);
    expect(m.margin).toBe(200000);
  });

  it('can report a negative margin when a part is sold below cost', () => {
    const m = calculateTicketMargin([
      { status: 'consumed', quantity: 1, unitPrice: 80000, unitCost: 100000 },
    ]);
    expect(m.margin).toBe(-20000);
  });

  it('returns zeros for an empty ticket', () => {
    expect(calculateTicketMargin([])).toEqual({ revenue: 0, cost: 0, margin: 0 });
  });
});

describe('describeAssignment', () => {
  it('treats a ticket with no prior technician as a first assignment', () => {
    const result = describeAssignment(null, null, 'tech-1', 'Teknisi Andi');
    expect(result.isReassignment).toBe(false);
    expect(result.note).toBe('Ditugaskan ke Teknisi Andi');
  });

  it('treats assigning the same technician again as a no-op assignment, not a reassignment', () => {
    const result = describeAssignment('tech-1', 'Teknisi Andi', 'tech-1', 'Teknisi Andi');
    expect(result.isReassignment).toBe(false);
    expect(result.note).toBe('Ditugaskan ke Teknisi Andi');
  });

  it('treats assigning a different technician as a reassignment and names both', () => {
    const result = describeAssignment('tech-1', 'Teknisi Andi', 'tech-2', 'Teknisi Budi');
    expect(result.isReassignment).toBe(true);
    expect(result.note).toBe('Dialihkan dari Teknisi Andi ke Teknisi Budi');
  });

  it('falls back to a generic label if the previous technician name could not be resolved', () => {
    const result = describeAssignment('tech-1', null, 'tech-2', 'Teknisi Budi');
    expect(result.isReassignment).toBe(true);
    expect(result.note).toBe('Dialihkan dari teknisi sebelumnya ke Teknisi Budi');
  });
});

describe('isBillableCharge (H17)', () => {
  it('bills a consumed part', () => {
    expect(isBillableCharge({ sourceType: 'part', status: 'consumed' })).toBe(true);
  });

  it('does NOT bill an approved-but-unconsumed part (reserved, not yet fitted)', () => {
    expect(isBillableCharge({ sourceType: 'part', status: 'approved' })).toBe(false);
  });

  it('does NOT bill an estimated part', () => {
    expect(isBillableCharge({ sourceType: 'part', status: 'estimated' })).toBe(false);
  });

  it('bills approved labor and approved fee (no stock behind them)', () => {
    expect(isBillableCharge({ sourceType: 'labor', status: 'approved' })).toBe(true);
    expect(isBillableCharge({ sourceType: 'fee', status: 'approved' })).toBe(true);
  });

  it('does NOT bill estimated labor', () => {
    expect(isBillableCharge({ sourceType: 'labor', status: 'estimated' })).toBe(false);
  });

  it('never bills a cancelled charge, regardless of source', () => {
    expect(isBillableCharge({ sourceType: 'part', status: 'cancelled' })).toBe(false);
    expect(isBillableCharge({ sourceType: 'labor', status: 'cancelled' })).toBe(false);
  });
});
