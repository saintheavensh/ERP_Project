import { describe, it, expect } from 'vitest';
import { groupReceivablesByCustomer, outstandingOf, type ReceivableInvoice } from '../group-receivables';

function inv(over: Partial<ReceivableInvoice> & { id: string }): ReceivableInvoice {
  return { grandTotal: 0, amountPaid: 0, ...over };
}

describe('groupReceivablesByCustomer', () => {
  it('menggabungkan dua nota milik pelanggan yang sama jadi satu baris', () => {
    const groups = groupReceivablesByCustomer([
      inv({ id: 'i1', grandTotal: 450000, amountPaid: 0, customer: { id: 'c1', name: 'Budi' } }),
      inv({ id: 'i2', grandTotal: 800000, amountPaid: 300000, customer: { id: 'c1', name: 'Budi' } }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].customerName).toBe('Budi');
    expect(groups[0].invoices).toHaveLength(2);
    // 450.000 sisa + 500.000 sisa
    expect(groups[0].totalOutstanding).toBe(950000);
    expect(groups[0].totalBilled).toBe(1250000);
  });

  it('TIDAK menggabungkan dua pelanggan berbeda yang kebetulan bernama sama', () => {
    // Ini kesalahan yang paling mahal dan paling senyap: menagih satu orang
    // untuk utang orang lain, tanpa error apa pun.
    const groups = groupReceivablesByCustomer([
      inv({ id: 'i1', grandTotal: 100000, customer: { id: 'c1', name: 'Budi' } }),
      inv({ id: 'i2', grandTotal: 200000, customer: { id: 'c2', name: 'Budi' } }),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups.map((g) => g.totalOutstanding)).toEqual([100000, 200000]);
  });

  it('TIDAK menggabungkan faktur tanpa pelanggan (POS walk-in) jadi satu orang', () => {
    const groups = groupReceivablesByCustomer([
      inv({ id: 'i1', grandTotal: 50000 }),
      inv({ id: 'i2', grandTotal: 75000 }),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups.every((g) => g.customerId === null)).toBe(true);
    expect(groups.map((g) => g.key)).toEqual(['walk-in:i1', 'walk-in:i2']);
  });

  it('memakai customerName saat objek customer tidak ikut, dan customerId tetap mengelompokkan', () => {
    const groups = groupReceivablesByCustomer([
      inv({ id: 'i1', grandTotal: 10000, customerId: 'c9', customerName: 'Siti' }),
      inv({ id: 'i2', grandTotal: 20000, customerId: 'c9', customerName: 'Siti' }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].customerName).toBe('Siti');
  });

  it('pelanggan tanpa nama tetap menghasilkan baris yang bisa ditagih', () => {
    const groups = groupReceivablesByCustomer([
      inv({ id: 'i1', grandTotal: 30000, customer: { id: 'c3', name: '   ' } }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].customerName).toBe('Tanpa Nama');
    expect(groups[0].customerId).toBe('c3');
  });

  it('mempertahankan urutan kemunculan pertama dari server', () => {
    const groups = groupReceivablesByCustomer([
      inv({ id: 'i1', grandTotal: 1, customer: { id: 'cB', name: 'B' } }),
      inv({ id: 'i2', grandTotal: 1, customer: { id: 'cA', name: 'A' } }),
      inv({ id: 'i3', grandTotal: 1, customer: { id: 'cB', name: 'B' } }),
    ]);

    expect(groups.map((g) => g.customerName)).toEqual(['B', 'A']);
  });

  it('daftar kosong / undefined tidak melempar', () => {
    expect(groupReceivablesByCustomer([])).toEqual([]);
    expect(groupReceivablesByCustomer(undefined as unknown as ReceivableInvoice[])).toEqual([]);
  });

  it('menghitung sisa dari nilai string (Drizzle numeric mengembalikan string)', () => {
    // Kalau Number() dilewatkan, '800000' - '300000' jadi penggabungan teks,
    // bukan pengurangan — jenis bug yang cuma muncul dengan data sungguhan.
    expect(outstandingOf(inv({ id: 'i1', grandTotal: '800000', amountPaid: '300000' }))).toBe(500000);

    const groups = groupReceivablesByCustomer([
      inv({ id: 'i1', grandTotal: '800000', amountPaid: '300000', customer: { id: 'c1', name: 'Budi' } }),
    ]);
    expect(groups[0].totalOutstanding).toBe(500000);
  });
});
