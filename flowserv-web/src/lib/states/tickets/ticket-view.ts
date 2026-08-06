// ---------------------------------------------------------------------------
// R2.2 — "peran ini melihat bagian apa" di halaman tiket.
//
// Berkas MURNI: tanpa `$lib` runtime, tanpa rune, tanpa fetch. Itu syarat agar
// ia bisa diuji di `vitest.config.ts` frontend, yang sengaja tidak memuat plugin
// SvelteKit — aturan yang dipasang di R1.9: begitu sebuah fungsi butuh `$app`
// atau rune, ia bukan logika murni lagi.
//
// ⚠️ TIGA hal yang mengikat berkas ini, semuanya dibayar dengan bug nyata:
//
// 1. **Menyembunyikan tombol bukan keamanan.** Gerbang sesungguhnya di backend
//    (`requirePermission` / `enforcePermission`). Yang di sini hanya supaya
//    kontrol yang PASTI ditolak tidak dipampangkan sebagai kontrol yang hidup —
//    persis temuan pemilik di R1.7-T3 (teknisi melihat pemilih teknisi lain yang
//    selalu gagal) dan R1.10 A7.
//
// 2. **Tiap baris harus bisa ditunjuk ke izin backend.** Baris tanpa padanan =
//    tanda desainnya belum benar. Ada SATU pengecualian di berkas ini
//    (`printableDocuments`) dan ia ditulis terbuka di bawah, bukan disamarkan.
//
// 3. **Jangan menyembunyikan yang backend IZINKAN.** Itu menghilangkan fitur
//    diam-diam — sisi kegagalan yang jauh lebih sulit ditemukan daripada tombol
//    yang menolak, karena tak ada pesan error yang muncul untuk mengadukannya.
//
// Peran tak dikenal (termasuk `'no-role'`) mendapat pandangan TERSEMPIT, bukan
// error — aturan yang sama dengan `canAccessRoute` dan `roleCan`.
// ---------------------------------------------------------------------------

// Impor RELATIF, bukan `$lib/...` — dan itu bukan selera. Vitest frontend
// sengaja tidak memuat plugin SvelteKit, jadi alias `$lib` tak ada di sana:
// versi pertama berkas ini memakainya dan seluruh suite-nya gagal dimuat
// ("Cannot find module '$lib/auth/capabilities'"). Aturannya jadi terbukti
// sendiri — berkas yang butuh alias SvelteKit bukan berkas murni.
import { roleCan } from '../../auth/capabilities';

/** Bagian dari tiket yang keputusannya bergantung pada keadaan, bukan peran. */
export interface TicketViewInput {
  /** `open` | `closed` | `cancelled` — dari `service_tickets.status`. */
  status?: string | null;
}

export interface TicketSectionsView {
  /** Sandi/pola, keluhan, perkiraan konter — yang DIBAWA pelanggan, dicatat konter. */
  canEditCounterFields: boolean;
  /** Hasil diagnosa + lama pengerjaan — yang teknisi TEMUKAN. */
  canEditDiagnosis: boolean;
  /** Menugaskan teknisi LAIN. "Ambil Pekerjaan" (diri sendiri) bukan ini. */
  canAssignOthers: boolean;
  /** Tombol Batalkan Tiket — peran DAN status, keduanya harus benar. */
  canCancelTicket: boolean;
  /** Menambah/mengubah baris sparepart & jasa. */
  canEditCharges: boolean;
  /** Angka MODAL & MARGIN. Harga jual tidak termasuk — itu boleh dilihat semua. */
  canSeeCostAndMargin: boolean;
  /** Mencentang daftar periksa (QC). Membacanya tidak digerbangi. */
  canFillChecklist: boolean;
  /**
   * Membuat kuotasi / meminta persetujuan pelanggan.
   *
   * Terpisah dari `canEditCharges` karena backend memang memisahkannya:
   * MENCATAT biaya (`ticket.manage_charges`, teknisi punya) bukan hal yang sama
   * dengan MENGAJUKAN harganya ke pelanggan (`ticket.approve_quote`, teknisi
   * tidak punya). Sampai R2.2 keduanya digambar bersama, jadi teknisi melihat
   * tombol "Minta Persetujuan" yang pasti 403.
   */
  canRequestQuotation: boolean;
  /**
   * Dokumen yang tombol cetaknya ditawarkan.
   *
   * **Ini SATU-SATUNYA baris di berkas ini tanpa padanan izin di backend, dan
   * itu disengaja — bukan kelalaian.** `GET /v1/print/documents/...` hanya
   * `requireAuth` sejak 6A.4, dengan alasan tertulis: "mencetak penjualanmu
   * sendiri bukan tindakan admin-printer". Jadi teknisi yang memanggil API-nya
   * langsung TETAP bisa mencetak tanda terima.
   *
   * Yang dibeli baris ini karena itu **kerapian, bukan keamanan**: pemilik
   * memilih "teknisi boleh cetak label saja" (2026-08-06) supaya nota dan tanda
   * terima — dokumen konter — tidak muncul di layar orang yang tidak
   * mengurusnya. Tidak ada yang dirugikan bila teknisi mencetak tanda terima;
   * yang dihindari cuma tombol yang bukan urusannya.
   *
   * Kalau suatu hari ini perlu jadi batas sungguhan, yang benar adalah
   * menggerbangi endpoint-nya per jenis dokumen — bukan mengandalkan berkas ini.
   */
  printableDocuments: 'semua' | 'label-saja';
}

/**
 * Apa yang peran ini lihat di halaman tiket.
 *
 * Tabel keputusannya (pemilik menyetujui tiga baris bertanda ★ pada 2026-08-06,
 * setelah ditanya langsung dengan usul yang sudah jadi — pola yang berhasil di
 * R1.7 setelah bentuk tabel-kosong gagal empat kali):
 *
 * | Bagian                    | Kasir        | Teknisi   | Manager | Super Admin |
 * |---------------------------|--------------|-----------|---------|-------------|
 * | Sandi/keluhan/perkiraan   | **ubah**     | baca      | ubah    | ubah        |
 * | Hasil diagnosa            | baca         | **ubah**  | ubah    | ubah        |
 * | Tugaskan teknisi lain     | ✕            | ✕         | ✓       | ✓           |
 * | Batalkan tiket            | ✕            | ✕         | ✓       | ✓           |
 * | Sparepart & jasa          | baca ★       | **ubah**  | ubah    | ubah        |
 * | Modal & margin            | ✕ ★          | ✕         | ✓       | ✓           |
 * | Daftar periksa QC         | baca ★       | **isi**   | isi     | isi         |
 * | Dokumen cetak             | semua        | label ★   | semua   | semua       |
 *
 * ★ ditanyakan ke pemilik karena usul rencana induk berbeda: ia mengusulkan
 * kasir TIDAK melihat QC sama sekali (padahal kasir yang menyerahkan unit, dan
 * hasil QC justru bukti yang ditunjukkan ke pelanggan), teknisi TIDAK boleh
 * mencetak apa pun (padahal label menempel di unit yang ada di mejanya), dan
 * kasir hanya melihat TOTAL biaya (padahal ia yang ditanya "kok segini?").
 */
export function ticketSectionsFor(
  roleName: string | null | undefined,
  ticket: TicketViewInput = {}
): TicketSectionsView {
  const can = (permission: string) => roleCan(roleName, permission);

  return {
    canEditCounterFields: can('ticket.create'),
    canEditDiagnosis: can('ticket.diagnose'),
    canAssignOthers: can('ticket.assign_technician'),

    // DUA syarat, dan keduanya harus benar. Sampai R2.2 layar hanya memeriksa
    // yang kedua, jadi kasir & teknisi melihat tombol "Batalkan Tiket" yang
    // backend PASTI tolak (`ticket.cancel` cuma milik Manager & Super Admin) —
    // tombol-403 yang lolos dari Track F, R1.7-T3, dan R1.11-T2 berturut-turut.
    canCancelTicket: can('ticket.cancel') && ticket.status === 'open',

    canEditCharges: can('ticket.manage_charges'),
    canSeeCostAndMargin: can('finance.view_reports'),
    canFillChecklist: can('ticket.qc'),
    canRequestQuotation: can('ticket.approve_quote'),

    // Satu-satunya baris yang menyebut NAMA PERAN, dan itu justru bentuk yang
    // jujur: ia memang tak punya izin padanan di backend (lihat komentar pada
    // `printableDocuments` di atas), jadi berpura-pura menurunkannya dari izin
    // akan menyembunyikan kenyataan itu.
    //
    // Versi pertama berbunyi `can('ticket.diagnose') && !can('ticket.create')`
    // — benar untuk keempat peran hari ini, tapi rapuh dengan cara yang tak
    // bersuara: begitu Manager kehilangan `ticket.create` karena alasan lain,
    // ia ikut jadi label-saja tanpa satu pun tes menyinggungnya.
    printableDocuments: roleName === 'Technician' ? 'label-saja' : 'semua',
  };
}
