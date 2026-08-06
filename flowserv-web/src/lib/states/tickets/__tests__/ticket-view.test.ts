import { describe, it, expect } from 'vitest';
import { ticketSectionsFor } from '../ticket-view';

// ---------------------------------------------------------------------------
// R2.2. Diuji di sini, bukan lewat browser, karena yang dijaga adalah TABEL
// keputusannya — 8 baris × 5 peran. Membuktikannya lewat Playwright berarti 40
// pemuatan halaman untuk menguji satu fungsi murni, dan tetap tidak menjangkau
// peran `'no-role'` (tak ada akun seed-nya).
//
// Kelas bug yang ditangkap berkas ini TIDAK memunculkan error apa pun: sebuah
// bagian yang hilang untuk peran yang seharusnya melihatnya cuma... tidak ada.
// Tak ada 403, tak ada pesan, tak ada yang mengadu.
// ---------------------------------------------------------------------------

const TIKET_TERBUKA = { status: 'open' };

describe('ticketSectionsFor — kolom konter vs kolom teknisi', () => {
  it('kasir mengubah data konter, tidak menulis diagnosa', () => {
    const v = ticketSectionsFor('Cashier', TIKET_TERBUKA);
    expect(v.canEditCounterFields).toBe(true);
    expect(v.canEditDiagnosis).toBe(false);
  });

  it('teknisi menulis diagnosa, tidak mengubah data konter', () => {
    // Arah yang persis terbalik dari kasir — bug R1.11-T1 adalah kedua arah ini
    // tertukar selama empat hari tanpa satu tes pun gagal.
    const v = ticketSectionsFor('Technician', TIKET_TERBUKA);
    expect(v.canEditDiagnosis).toBe(true);
    expect(v.canEditCounterFields).toBe(false);
  });

  it('manager mengubah keduanya', () => {
    const v = ticketSectionsFor('Manager', TIKET_TERBUKA);
    expect(v.canEditCounterFields).toBe(true);
    expect(v.canEditDiagnosis).toBe(true);
  });
});

describe('ticketSectionsFor — tombol yang backend pasti tolak', () => {
  it('hanya manager & super admin yang menugaskan teknisi lain', () => {
    expect(ticketSectionsFor('Manager', TIKET_TERBUKA).canAssignOthers).toBe(true);
    expect(ticketSectionsFor('Super Admin', TIKET_TERBUKA).canAssignOthers).toBe(true);
    expect(ticketSectionsFor('Technician', TIKET_TERBUKA).canAssignOthers).toBe(false);
    expect(ticketSectionsFor('Cashier', TIKET_TERBUKA).canAssignOthers).toBe(false);
  });

  it('kasir & teknisi tidak melihat tombol Batalkan Tiket', () => {
    // Ini bug yang R2.2 temukan, bukan yang ia rencanakan: sebelum fase ini
    // tombol Batalkan hanya dijaga `status === 'open'` TANPA cek peran sama
    // sekali, padahal backend menuntut `ticket.cancel` (Manager & Super Admin).
    expect(ticketSectionsFor('Cashier', TIKET_TERBUKA).canCancelTicket).toBe(false);
    expect(ticketSectionsFor('Technician', TIKET_TERBUKA).canCancelTicket).toBe(false);
    expect(ticketSectionsFor('Manager', TIKET_TERBUKA).canCancelTicket).toBe(true);
  });

  it('tiket yang sudah ditutup tidak bisa dibatalkan siapa pun', () => {
    // Izin saja tidak cukup — backend menolak membatalkan tiket non-open.
    for (const status of ['closed', 'cancelled']) {
      expect(ticketSectionsFor('Manager', { status }).canCancelTicket).toBe(false);
      expect(ticketSectionsFor('Super Admin', { status }).canCancelTicket).toBe(false);
    }
  });

  it('kasir tidak mengubah baris sparepart & jasa', () => {
    // seed 01-core.ts:136 — "Kasir menerima unit; ia tidak mendiagnosis dan
    // tidak memberi harga".
    expect(ticketSectionsFor('Cashier', TIKET_TERBUKA).canEditCharges).toBe(false);
    expect(ticketSectionsFor('Technician', TIKET_TERBUKA).canEditCharges).toBe(true);
  });
});

describe('ticketSectionsFor — keputusan pemilik 2026-08-06', () => {
  it('modal & margin hanya untuk manager ke atas', () => {
    // Aturan pemilik sejak R1.5A: "teknisi hanya bisa melihat harga jual".
    expect(ticketSectionsFor('Manager', TIKET_TERBUKA).canSeeCostAndMargin).toBe(true);
    expect(ticketSectionsFor('Super Admin', TIKET_TERBUKA).canSeeCostAndMargin).toBe(true);
    expect(ticketSectionsFor('Technician', TIKET_TERBUKA).canSeeCostAndMargin).toBe(false);
    expect(ticketSectionsFor('Cashier', TIKET_TERBUKA).canSeeCostAndMargin).toBe(false);
  });

  it('kasir MELIHAT daftar periksa tapi tidak mengisinya', () => {
    // Pemilik memilih ini menggantikan usul rencana induk ("kasir tidak melihat
    // QC sama sekali"): kasir yang menyerahkan unit, dan hasil QC adalah bukti
    // yang ditunjukkan ke pelanggan.
    //
    // "Melihat" tidak digerbangi di mana pun — tak ada `canSeeChecklist`, dan
    // itu disengaja: menambah bendera untuk sesuatu yang selalu true hanya
    // menciptakan tempat baru untuk salah.
    expect(ticketSectionsFor('Cashier', TIKET_TERBUKA).canFillChecklist).toBe(false);
    expect(ticketSectionsFor('Technician', TIKET_TERBUKA).canFillChecklist).toBe(true);
    expect(ticketSectionsFor('Manager', TIKET_TERBUKA).canFillChecklist).toBe(true);
  });

  it('mencatat biaya dan MENGAJUKANNYA ke pelanggan adalah dua izin berbeda', () => {
    // Ditemukan saat memeriksa tabel rencana induk ke seed, bukan direncanakan:
    // tabel itu menulis "minta persetujuan: kasir ✓, teknisi ✕" dan seed
    // membantah KEDUANYA. `POST /:id/quotation` digerbangi
    // `ticket.approve_quote` — Manager & Super Admin saja.
    //
    // Akibatnya teknisi melihat tombol "Minta Persetujuan" yang pasti 403,
    // karena tombol itu digambar bersama form biaya yang ia memang boleh pakai.
    const teknisi = ticketSectionsFor('Technician', TIKET_TERBUKA);
    expect(teknisi.canEditCharges).toBe(true);
    expect(teknisi.canRequestQuotation).toBe(false);

    const kasir = ticketSectionsFor('Cashier', TIKET_TERBUKA);
    expect(kasir.canEditCharges).toBe(false);
    expect(kasir.canRequestQuotation).toBe(false);

    expect(ticketSectionsFor('Manager', TIKET_TERBUKA).canRequestQuotation).toBe(true);
  });

  it('hanya teknisi yang dibatasi ke cetak label', () => {
    expect(ticketSectionsFor('Technician', TIKET_TERBUKA).printableDocuments).toBe('label-saja');
    for (const role of ['Cashier', 'Manager', 'Super Admin']) {
      expect(ticketSectionsFor(role, TIKET_TERBUKA).printableDocuments).toBe('semua');
    }
  });
});

describe('ticketSectionsFor — peran tak dikenal', () => {
  it("'no-role' mendapat pandangan tersempit, bukan error", () => {
    // Aturan yang sama dengan canAccessRoute & roleCan. Yang penting: TIDAK
    // melempar — pengguna tanpa peran harus tetap bisa membuka halaman dan
    // melihat versi paling sempitnya.
    for (const role of ['no-role', '', null, undefined, 'Peran Yang Tidak Ada']) {
      const v = ticketSectionsFor(role, TIKET_TERBUKA);
      expect(v.canEditCounterFields).toBe(false);
      expect(v.canEditDiagnosis).toBe(false);
      expect(v.canAssignOthers).toBe(false);
      expect(v.canCancelTicket).toBe(false);
      expect(v.canEditCharges).toBe(false);
      expect(v.canSeeCostAndMargin).toBe(false);
      expect(v.canFillChecklist).toBe(false);
      expect(v.canRequestQuotation).toBe(false);
      // Cetak tetap 'semua' — ia bukan gerbang keamanan (backend tak
      // menggerbanginya sama sekali), jadi menyempitkannya di sini hanya
      // menyembunyikan tombol tanpa melindungi apa pun.
      expect(v.printableDocuments).toBe('semua');
    }
  });

  it('Super Admin melewati seluruh pemeriksaan izin', () => {
    // Sama seperti `evaluateRbac` di backend: tanpa ini, satu kesalahan peta
    // izin membuat admin sendiri kehilangan tombol untuk memperbaikinya.
    const v = ticketSectionsFor('Super Admin', TIKET_TERBUKA);
    expect(v.canEditCounterFields).toBe(true);
    expect(v.canEditDiagnosis).toBe(true);
    expect(v.canAssignOthers).toBe(true);
    expect(v.canCancelTicket).toBe(true);
    expect(v.canEditCharges).toBe(true);
    expect(v.canSeeCostAndMargin).toBe(true);
    expect(v.canFillChecklist).toBe(true);
    expect(v.canRequestQuotation).toBe(true);
  });
});

describe('ticketSectionsFor — status tiket tidak mengubah selain pembatalan', () => {
  it('tiket tertutup tetap boleh DIBACA seluruh bagiannya', () => {
    // Tiket yang sudah selesai tetap harus bisa ditunjukkan ke pelanggan yang
    // datang bertanya. Yang berhenti cuma tindakannya, dan itu diputuskan di
    // masing-masing bagian (status), bukan dengan menghapus bagiannya.
    const terbuka = ticketSectionsFor('Manager', { status: 'open' });
    const tertutup = ticketSectionsFor('Manager', { status: 'closed' });
    expect(tertutup.canSeeCostAndMargin).toBe(terbuka.canSeeCostAndMargin);
    expect(tertutup.canEditCharges).toBe(terbuka.canEditCharges);
    expect(tertutup.printableDocuments).toBe(terbuka.printableDocuments);
  });

  it('tanpa argumen tiket sama sekali tidak melempar', () => {
    // Halaman sempat merender sebelum datanya tiba; fungsi ini tidak boleh
    // menjadi alasan layar putih.
    expect(() => ticketSectionsFor('Manager')).not.toThrow();
    expect(ticketSectionsFor('Manager').canCancelTicket).toBe(false);
  });
});
