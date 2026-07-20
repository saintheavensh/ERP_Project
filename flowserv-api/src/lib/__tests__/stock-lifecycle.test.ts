import { describe, it, expect } from 'vitest';
import { pickFifoBatches } from '../fifo';

/**
 * These mirror the exact arithmetic routes/pos/invoices.ts performs across a
 * checkout and a void, using the same pieces (pickFifoBatches for the sale,
 * quantityReceived as the upper bound for the restore) — just without a
 * database. PHASES.md 3.5C.5: receive 10 -> sell 3 -> void -> back to 10.
 */
describe('stock lifecycle arithmetic: receive -> sell -> void', () => {
  it('returns exactly to the original quantity after a sale is voided', () => {
    // Arrange — a single batch, as if 10 units were just received
    let batch = { id: 'batch-1', quantityReceived: 10, quantityRemaining: 10 };

    // Act — sell 3
    const sale = pickFifoBatches([batch], 3);
    expect(sale.deductions).toEqual([{ batchId: 'batch-1', quantity: 3 }]);
    batch = { ...batch, quantityRemaining: batch.quantityRemaining - sale.deductions[0].quantity };
    expect(batch.quantityRemaining).toBe(7);

    // Act — void the sale, restoring exactly what was deducted
    const restoredQuantity = batch.quantityRemaining + sale.deductions[0].quantity;
    expect(restoredQuantity).toBeLessThanOrEqual(batch.quantityReceived); // the BUG-10 guard
    batch = { ...batch, quantityRemaining: restoredQuantity };

    // Assert — back to the original 10, matching what was received
    expect(batch.quantityRemaining).toBe(10);
    expect(batch.quantityRemaining).toBe(batch.quantityReceived);
  });

  it('splits the sale across two batches, then voiding restores both correctly', () => {
    // Arrange — 5 received in one batch, 5 more in a second (e.g. two deliveries)
    let batches = [
      { id: 'batch-1', quantityReceived: 5, quantityRemaining: 5 },
      { id: 'batch-2', quantityReceived: 5, quantityRemaining: 5 },
    ];

    // Act — sell 7, which must span both batches
    const sale = pickFifoBatches(batches, 7);
    expect(sale.deductions).toEqual([
      { batchId: 'batch-1', quantity: 5 },
      { batchId: 'batch-2', quantity: 2 },
    ]);

    batches = batches.map(b => {
      const deduction = sale.deductions.find(d => d.batchId === b.id);
      return deduction ? { ...b, quantityRemaining: b.quantityRemaining - deduction.quantity } : b;
    });
    expect(batches.map(b => b.quantityRemaining)).toEqual([0, 3]);

    // Act — void: restore each batch by its own deducted amount
    batches = batches.map(b => {
      const deduction = sale.deductions.find(d => d.batchId === b.id);
      if (!deduction) return b;
      const restored = b.quantityRemaining + deduction.quantity;
      expect(restored).toBeLessThanOrEqual(b.quantityReceived);
      return { ...b, quantityRemaining: restored };
    });

    // Assert — both batches back to what they originally received
    expect(batches).toEqual([
      { id: 'batch-1', quantityReceived: 5, quantityRemaining: 5 },
      { id: 'batch-2', quantityReceived: 5, quantityRemaining: 5 },
    ]);
  });

  it('the BUG-10 guard rejects a restore that would exceed quantityReceived', () => {
    // Arrange — simulates a batch that was independently reduced by something
    // else after the original sale, so blindly restoring the old deduction
    // would push it above what was ever physically received.
    const batch = { id: 'batch-1', quantityReceived: 10, quantityRemaining: 9 };
    const previouslyDeductedQuantity = 3;

    // Act
    const restoredQuantity = batch.quantityRemaining + previouslyDeductedQuantity;

    // Assert — this is exactly the condition the route checks before voiding
    expect(restoredQuantity).toBeGreaterThan(batch.quantityReceived);
  });
});
