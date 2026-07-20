import { describe, it, expect } from 'vitest';
import { computeOrderStatus, type ReceivableLine } from '../order-status';

describe('computeOrderStatus', () => {
  it('keeps the current status when nothing has been received yet', () => {
    // Arrange — a fresh 'ordered' PO, no deliveries recorded
    const lines: ReceivableLine[] = [
      { quantity: 10, receivedQuantity: 0 },
      { quantity: 5, receivedQuantity: 0 },
    ];
    // Act
    const result = computeOrderStatus(lines, 'ordered');
    // Assert
    expect(result).toBe('ordered');
  });

  it('returns "partial" when some but not all quantity has arrived', () => {
    // Arrange — this is the exact case BUG-03 got wrong: receiving 3 of 10
    // used to flip the order straight to 'received'
    const lines: ReceivableLine[] = [{ quantity: 10, receivedQuantity: 3 }];
    // Act
    const result = computeOrderStatus(lines, 'ordered');
    // Assert
    expect(result).toBe('partial');
  });

  it('returns "partial" when one line is complete but another is not', () => {
    // Arrange
    const lines: ReceivableLine[] = [
      { quantity: 10, receivedQuantity: 10 },
      { quantity: 5, receivedQuantity: 2 },
    ];
    // Act
    const result = computeOrderStatus(lines, 'partial');
    // Assert
    expect(result).toBe('partial');
  });

  it('returns "received" when every line is fully received', () => {
    // Arrange — the accumulated total across two deliveries: 3 + 7 = 10
    const lines: ReceivableLine[] = [{ quantity: 10, receivedQuantity: 10 }];
    // Act
    const result = computeOrderStatus(lines, 'partial');
    // Assert
    expect(result).toBe('received');
  });

  it('returns "received" when a line was over-received', () => {
    // Arrange — over-receipt is rejected at the route level (422), but the
    // decision function itself should still treat >= quantity as complete
    const lines: ReceivableLine[] = [{ quantity: 10, receivedQuantity: 12 }];
    // Act
    const result = computeOrderStatus(lines, 'partial');
    // Assert
    expect(result).toBe('received');
  });

  it('preserves the current status for an order with no lines at all', () => {
    // Arrange — defensive: an order should never have zero lines in practice,
    // but the function must not misreport it as 'received'
    // Act
    const result = computeOrderStatus([], 'draft');
    // Assert
    expect(result).toBe('draft');
  });
});
