import { describe, it, expect } from 'vitest';
import { calculateWac } from '../wac';

describe('calculateWac', () => {
  it('computes a weighted average across two batches', () => {
    // 5 units @ 100 + 5 units @ 200 => (500 + 1000) / 10 = 150.00
    const batches = [
      { unitCost: '100', quantityRemaining: 5 },
      { unitCost: '200', quantityRemaining: 5 },
    ];
    expect(calculateWac(batches)).toBe('150.00');
  });

  it('ignores batches with zero remaining quantity', () => {
    // Arrange — the 999 batch is fully depleted and must not skew the average
    const batches = [
      { unitCost: '999', quantityRemaining: 0 },
      { unitCost: '100', quantityRemaining: 10 },
    ];
    expect(calculateWac(batches)).toBe('100.00');
  });

  it('returns "0.00" when no batch has remaining stock', () => {
    const batches = [{ unitCost: '100', quantityRemaining: 0 }];
    expect(calculateWac(batches)).toBe('0.00');
  });

  it('returns "0.00" for an empty batch list', () => {
    expect(calculateWac([])).toBe('0.00');
  });

  it('accepts a numeric unitCost, not just a string', () => {
    // Postgres decimal columns come back as strings through the driver, but a
    // caller building a batch object manually might pass a plain number.
    const batches = [{ unitCost: 100, quantityRemaining: 5 }];
    expect(calculateWac(batches)).toBe('100.00');
  });
});
