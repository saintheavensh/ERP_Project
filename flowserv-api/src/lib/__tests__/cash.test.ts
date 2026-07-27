import { describe, it, expect } from 'vitest';
import { evaluateCashTender } from '../cash';

describe('evaluateCashTender — Tahap B: uang diterima & kembalian', () => {
  it('menghitung kembalian untuk pembayaran tunai', () => {
    const result = evaluateCashTender({ paymentMethod: 'cash', amountTendered: 100000, grandTotal: 73500 });
    expect(result.ok).toBe(true);
    expect(result.changeAmount).toBe(26500);
    expect(result.amountTendered).toBe(100000);
  });

  it('uang pas menghasilkan kembalian nol, bukan ditolak', () => {
    const result = evaluateCashTender({ paymentMethod: 'cash', amountTendered: 50000, grandTotal: 50000 });
    expect(result.ok).toBe(true);
    expect(result.changeAmount).toBe(0);
  });

  it('menolak nominal yang kurang dari total', () => {
    const result = evaluateCashTender({ paymentMethod: 'cash', amountTendered: 40000, grandTotal: 50000 });
    expect(result.ok).toBe(false);
    expect(result.code).toBe('INSUFFICIENT_TENDER');
    // Nominal yang ditolak tidak boleh ikut tersimpan.
    expect(result.amountTendered).toBeNull();
  });

  it('tunai tanpa nominal tetap boleh — kasir uang pas tak wajib mengetik', () => {
    const result = evaluateCashTender({ paymentMethod: 'cash', amountTendered: undefined, grandTotal: 50000 });
    expect(result.ok).toBe(true);
    expect(result.amountTendered).toBeNull();
    expect(result.changeAmount).toBe(0);
  });

  it('metode non-tunai mengabaikan nominal, bukan menolaknya', () => {
    // Kasir sempat mengetik nominal lalu berganti ke QRIS — bukan error.
    for (const method of ['transfer', 'qris', 'ewallet', 'tempo', 'split']) {
      const result = evaluateCashTender({ paymentMethod: method, amountTendered: 999, grandTotal: 50000 });
      expect(result.ok, method).toBe(true);
      expect(result.amountTendered, method).toBeNull();
      expect(result.changeAmount, method).toBe(0);
    }
  });

  it('membulatkan kembalian ke rupiah penuh', () => {
    const result = evaluateCashTender({ paymentMethod: 'cash', amountTendered: 100000, grandTotal: 73500.4 });
    expect(result.changeAmount).toBe(26500);
  });
});
