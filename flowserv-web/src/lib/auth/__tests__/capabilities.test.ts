import { describe, it, expect } from 'vitest';
import { roleCan } from '../capabilities';

describe('roleCan — customer.allow_tempo (R1.9-T1b)', () => {
  it('Manager dan Super Admin boleh memberi hak tempo', () => {
    expect(roleCan('Manager', 'customer.allow_tempo')).toBe(true);
    expect(roleCan('Super Admin', 'customer.allow_tempo')).toBe(true);
  });

  it('Kasir TIDAK boleh — inti dari T1b', () => {
    // T1 memberi kasir jalan ke halaman pelanggan; tanpa baris ini satu klik
    // menyerahkan wewenang memberi utang ke konter (menabrak keputusan D1).
    expect(roleCan('Cashier', 'customer.allow_tempo')).toBe(false);
  });

  it('Teknisi dan peran tak dikenal mendapat pandangan tersempit', () => {
    expect(roleCan('Technician', 'customer.allow_tempo')).toBe(false);
    expect(roleCan('no-role', 'customer.allow_tempo')).toBe(false);
    expect(roleCan(null, 'customer.allow_tempo')).toBe(false);
    expect(roleCan(undefined, 'customer.allow_tempo')).toBe(false);
  });

  it('Super Admin melewati izin yang tidak ada di peta sama sekali', () => {
    // Sama seperti `evaluateRbac` di backend: tanpa bypass ini, satu kesalahan
    // peta membuat admin kehilangan tombol untuk memperbaikinya.
    expect(roleCan('Super Admin', 'izin.yang.belum.ada')).toBe(true);
    expect(roleCan('Manager', 'izin.yang.belum.ada')).toBe(false);
  });
});
