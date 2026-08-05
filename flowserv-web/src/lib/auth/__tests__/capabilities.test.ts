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

// ---------------------------------------------------------------------------
// R1.11-T2 — kolom halaman tiket punya DUA pemilik.
//
// Padanan backend-nya nyata dan per-kolom sejak R1.11-T1
// (`intakePermissionsNeeded` di flowserv-api/src/lib/intake-fields.ts), jadi
// tabel ini menyembunyikan tepat apa yang backend tolak — tidak lebih (fitur
// hilang diam-diam) dan tidak kurang (tombol yang pasti gagal).
// ---------------------------------------------------------------------------

describe('roleCan — ticket.create / ticket.diagnose (R1.11-T2)', () => {
  it('Kasir mencatat data konter, TIDAK mendiagnosis', () => {
    expect(roleCan('Cashier', 'ticket.create')).toBe(true);
    expect(roleCan('Cashier', 'ticket.diagnose')).toBe(false);
  });

  it('Teknisi mendiagnosis, TIDAK mencatat data konter', () => {
    // Inilah keluhan pemilik di uji R1.10 A6, ditulis sebagai tes: "teknisi
    // masih bisa edit keluhan Pola dan lainnya... seharusnya tidak bisa".
    expect(roleCan('Technician', 'ticket.diagnose')).toBe(true);
    expect(roleCan('Technician', 'ticket.create')).toBe(false);
  });

  it('Manager memegang keduanya, sesuai seed', () => {
    expect(roleCan('Manager', 'ticket.create')).toBe(true);
    expect(roleCan('Manager', 'ticket.diagnose')).toBe(true);
  });

  it('Super Admin memegang keduanya lewat bypass', () => {
    expect(roleCan('Super Admin', 'ticket.create')).toBe(true);
    expect(roleCan('Super Admin', 'ticket.diagnose')).toBe(true);
  });

  it('peran tak dikenal tidak mendapat satu pun', () => {
    for (const peran of ['no-role', null, undefined]) {
      expect(roleCan(peran, 'ticket.create')).toBe(false);
      expect(roleCan(peran, 'ticket.diagnose')).toBe(false);
    }
  });
});
