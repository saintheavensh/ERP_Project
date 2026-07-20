import { describe, it, expect } from 'vitest';
import { pickFifoBatches } from '../fifo';

describe('pickFifoBatches', () => {
  it('takes from a single batch when it has enough', () => {
    // Arrange
    const batches = [{ id: 'a', quantityRemaining: 10 }];
    // Act
    const result = pickFifoBatches(batches, 7);
    // Assert
    expect(result.deductions).toEqual([{ batchId: 'a', quantity: 7 }]);
    expect(result.remainingUnfulfilled).toBe(0);
  });

  it('splits across two batches, oldest first: 5 @ 10k then 5 @ 12k, consuming 7', () => {
    // Arrange — the caller is responsible for sorting oldest-first before
    // calling this; the function trusts the given order.
    const batches = [
      { id: 'old-5-at-10k', quantityRemaining: 5 },
      { id: 'new-5-at-12k', quantityRemaining: 5 },
    ];
    // Act
    const result = pickFifoBatches(batches, 7);
    // Assert — 5 from the oldest batch, then the remaining 2 from the next
    expect(result.deductions).toEqual([
      { batchId: 'old-5-at-10k', quantity: 5 },
      { batchId: 'new-5-at-12k', quantity: 2 },
    ]);
    expect(result.remainingUnfulfilled).toBe(0);
  });

  it('reports remainingUnfulfilled when the batches together do not have enough', () => {
    // Arrange — this is the case that must become a 422 INSUFFICIENT_STOCK
    const batches = [{ id: 'a', quantityRemaining: 3 }];
    // Act
    const result = pickFifoBatches(batches, 10);
    // Assert
    expect(result.deductions).toEqual([{ batchId: 'a', quantity: 3 }]);
    expect(result.remainingUnfulfilled).toBe(7);
  });

  it('skips a zero-remaining batch and stops as soon as the quantity is satisfied', () => {
    // Arrange
    const batches = [
      { id: 'empty', quantityRemaining: 0 },
      { id: 'has-stock', quantityRemaining: 10 },
      { id: 'never-touched', quantityRemaining: 10 },
    ];
    // Act
    const result = pickFifoBatches(batches, 4);
    // Assert
    expect(result.deductions).toEqual([{ batchId: 'has-stock', quantity: 4 }]);
    expect(result.remainingUnfulfilled).toBe(0);
  });

  it('returns no deductions and the full quantity unfulfilled for an empty batch list', () => {
    // Act
    const result = pickFifoBatches([], 5);
    // Assert
    expect(result.deductions).toEqual([]);
    expect(result.remainingUnfulfilled).toBe(5);
  });

  it('takes exactly what is needed and leaves the rest of the last batch untouched', () => {
    // Arrange
    const batches = [{ id: 'a', quantityRemaining: 20 }];
    // Act
    const result = pickFifoBatches(batches, 4);
    // Assert — only 4 is deducted, not the full 20
    expect(result.deductions).toEqual([{ batchId: 'a', quantity: 4 }]);
    expect(result.remainingUnfulfilled).toBe(0);
  });
});
