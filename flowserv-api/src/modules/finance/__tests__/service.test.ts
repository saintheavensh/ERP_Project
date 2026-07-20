import { describe, it, expect } from 'vitest';
import { applyPayment } from '../service';

describe('applyPayment', () => {
  it('records a partial payment, leaving the invoice partial', () => {
    // Arrange
    const invoice = { totalAmount: 1000000, amountPaid: 0, status: 'unpaid' as const };
    // Act
    const result = applyPayment(invoice, 400000);
    // Assert
    expect(result).toEqual({ ok: true, newAmountPaid: 400000, newStatus: 'partial' });
  });

  it('marks the invoice paid when the payment completes the balance', () => {
    // Arrange — 400000 already paid, this payment covers the remaining 600000
    const invoice = { totalAmount: 1000000, amountPaid: 400000, status: 'partial' as const };
    // Act
    const result = applyPayment(invoice, 600000);
    // Assert
    expect(result).toEqual({ ok: true, newAmountPaid: 1000000, newStatus: 'paid' });
  });

  it('rejects a payment that exceeds the outstanding balance', () => {
    // Arrange — only 600000 remains outstanding
    const invoice = { totalAmount: 1000000, amountPaid: 400000, status: 'partial' as const };
    // Act
    const result = applyPayment(invoice, 999999);
    // Assert
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('OVERPAYMENT');
    }
  });

  it('rejects any payment against an already-paid invoice', () => {
    // Arrange
    const invoice = { totalAmount: 1000000, amountPaid: 1000000, status: 'paid' as const };
    // Act
    const result = applyPayment(invoice, 1);
    // Assert
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('ALREADY_PAID');
    }
  });

  it('rejects a zero or negative payment amount', () => {
    // Arrange
    const invoice = { totalAmount: 1000000, amountPaid: 0, status: 'unpaid' as const };
    // Act
    const zeroResult = applyPayment(invoice, 0);
    const negativeResult = applyPayment(invoice, -100);
    // Assert
    expect(zeroResult.ok).toBe(false);
    if (!zeroResult.ok) expect(zeroResult.code).toBe('INVALID_AMOUNT');
    expect(negativeResult.ok).toBe(false);
    if (!negativeResult.ok) expect(negativeResult.code).toBe('INVALID_AMOUNT');
  });

  it('reaches "paid" across two sequential partial payments summing to the total', () => {
    // Arrange — first partial payment
    const invoice = { totalAmount: 1000000, amountPaid: 0, status: 'unpaid' as const };
    // Act — first payment
    const first = applyPayment(invoice, 400000);
    expect(first).toEqual({ ok: true, newAmountPaid: 400000, newStatus: 'partial' });

    // Act — second payment, applied against the invoice's new state
    if (!first.ok) throw new Error('expected first payment to succeed');
    const second = applyPayment(
      { totalAmount: 1000000, amountPaid: first.newAmountPaid, status: 'partial' },
      600000
    );
    // Assert
    expect(second).toEqual({ ok: true, newAmountPaid: 1000000, newStatus: 'paid' });
  });
});
