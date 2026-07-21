import { describe, it, expect } from 'vitest';
import { computeSellable, clampReleasedReserved } from '../service';

// H10 — the two pure functions behind stock reservation. No database: these are
// exactly what reserveStock/releaseReservation compute after locking the row.
describe('computeSellable', () => {
  it('subtracts reserved from available', () => {
    expect(computeSellable(10, 3)).toBe(7);
  });

  it('is fully sellable when nothing is reserved', () => {
    expect(computeSellable(5, 0)).toBe(5);
  });

  it('is zero when every unit is reserved', () => {
    expect(computeSellable(5, 5)).toBe(0);
  });

  it('the core scenario: 1 unit in stock, 1 reserved, nothing left to sell', () => {
    expect(computeSellable(1, 1)).toBe(0);
  });
});

describe('clampReleasedReserved', () => {
  it('decrements normally when releasing less than or equal to what is reserved', () => {
    expect(clampReleasedReserved(5, 2)).toBe(3);
    expect(clampReleasedReserved(5, 5)).toBe(0);
  });

  it('never goes negative — clamps at zero when releasing more than is reserved', () => {
    expect(clampReleasedReserved(2, 5)).toBe(0);
  });

  it('releasing from zero stays at zero', () => {
    expect(clampReleasedReserved(0, 3)).toBe(0);
  });
});
