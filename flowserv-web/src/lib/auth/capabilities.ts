// R1.9-T1b — kontrol per-PERAN yang bukan soal "boleh membuka halaman apa"
// (itu tugas route-access.ts), melainkan "boleh menekan tombol apa DI DALAM
// halaman yang memang boleh dibuka".
//
// ⚠️ ATURANNYA SAMA PERSIS dengan route-access.ts, dan ini yang paling penting:
// **berkas ini bukan batas keamanan.** Gerbang sesungguhnya ada di backend
// (`enforcePermission`). Yang di sini hanya supaya kontrol yang PASTI ditolak
// tidak dipampangkan sebagai kontrol yang hidup — anti-pattern Track F, dan
// persis temuan pemilik di R1.7-T3 (teknisi melihat pemilih teknisi lain yang
// selalu gagal). Sembunyikan SETELAH backend menolak, bukan sebagai gantinya.

/** Peta izin → peran yang memilikinya, disalin dari `db/seed/01-core.ts`. */
const ROLES_WITH: Record<string, readonly string[]> = {
  // Memberi/mencabut hak bayar tempo (utang) seorang pelanggan.
  // Kasir sengaja TIDAK ada: T1 memberinya jalan ke halaman pelanggan, dan
  // tanpa pemisahan ini satu baris menu diam-diam menyerahkan wewenang memberi
  // utang ke konter — menabrak keputusan D1.
  'customer.allow_tempo': ['Super Admin', 'Manager'],
  // R1.10-T4 — mengubah kategori pelanggan (Servis/Sparepart). Pemilik
  // (uji-R1.9 A1): "kategorinya readonly hanya bisa di edit oleh manager".
  // Kasir tetap MELIHAT kategorinya — ia perlu tahu — hanya tidak bisa
  // mengubahnya, persis perlakuan tempo yang pemilik sudah setujui di B1/B2.
  'customer.set_category': ['Super Admin', 'Manager'],
  // R1.11-T2 — kolom halaman tiket punya DUA pemilik, dan sampai R1.11 layar
  // tidak membedakannya sama sekali: teknisi melihat tombol Ubah pada Keluhan
  // dan Sandi/Pola yang backend PASTI tolak. Pemilik menemukannya di uji R1.10
  // A6: "teknisi masih bisa edit keluhan Pola dan lainnya di halaman detail
  // seharusnya tidak bisa".
  //
  // Padanannya di backend nyata dan per-kolom sejak R1.11-T1
  // (`intakePermissionsNeeded` di flowserv-api/src/lib/intake-fields.ts) —
  // jadi kedua baris ini menyembunyikan tepat apa yang backend tolak, tidak
  // lebih dan tidak kurang.
  //
  // Kasir mencatat apa yang DIBAWA pelanggan; teknisi mencatat apa yang ia
  // TEMUKAN.
  'ticket.create': ['Super Admin', 'Manager', 'Cashier'],
  'ticket.diagnose': ['Super Admin', 'Manager', 'Technician'],

  // ---------------------------------------------------------------------------
  // R2.2 (2026-08-06) — lima baris di bawah ini disalin dari
  // `db/seed/01-core.ts` baris 95–141, DIBACA saat itu juga, bukan dari ingatan.
  // Semuanya sudah lama ditegakkan backend; yang belum ada cuma padanannya di
  // layar, dan itulah kenapa halaman tiket masih memampangkan tombol yang pasti
  // ditolak (lihat `ticket-view.ts`).
  // ---------------------------------------------------------------------------

  // Menugaskan teknisi LAIN. Mengambil pekerjaan untuk DIRI SENDIRI bukan ini —
  // itu `ticket.diagnose` lewat POST /claim, dan teknisi memang punya.
  'ticket.assign_technician': ['Super Admin', 'Manager'],
  // Membatalkan tiket + melepas sparepart yang sudah dipesan.
  'ticket.cancel': ['Super Admin', 'Manager'],
  // Menambah/mengubah baris sparepart & jasa. Kasir sengaja TIDAK punya —
  // seed baris 136: "Kasir menerima unit; ia tidak mendiagnosis dan tidak
  // memberi harga".
  'ticket.manage_charges': ['Super Admin', 'Manager', 'Technician'],
  // Mengisi daftar periksa (QC).
  'ticket.qc': ['Super Admin', 'Manager', 'Technician'],
  // Membuat kuotasi/minta persetujuan pelanggan (`POST /:id/quotation`).
  //
  // ⚠️ Tabel per-peran di `plan/tahap-b-peran-dan-qc.md` menulis baris ini
  // "Kasir ✓, Teknisi ✕" — dan seed membantah KEDUANYA: kasir juga tidak
  // punya. Yang dipakai di sini kenyataan backend (seed baris 94), bukan
  // tabelnya. Inilah gunanya aturan "tiap baris harus bisa ditunjuk ke izin
  // backend": tanpa memeriksa, tabel itu akan menghasilkan tombol yang pasti
  // gagal untuk kasir DAN menyembunyikannya dari teknisi tanpa alasan.
  'ticket.approve_quote': ['Super Admin', 'Manager'],
  // Melihat angka MODAL dan MARGIN — bukan harga jual. Aturan pemilik sejak
  // R1.5A: "teknisi hanya bisa melihat harga jual". Sejak R2.2 backend
  // benar-benar menahan `cost`/`margin` di GET /v1/tickets/:id/charges untuk
  // peran tanpa izin ini, jadi baris ini menyembunyikan tepat apa yang memang
  // tidak dikirim — bukan menutupi data yang tetap sampai ke browser.
  'finance.view_reports': ['Super Admin', 'Manager'],
};

/**
 * True bila `roleName` boleh melakukan `permission`.
 *
 * Peran tak dikenal (termasuk `'no-role'`) mendapat pandangan tersempit —
 * aturan yang sama dengan `canAccessRoute`.
 */
export function roleCan(roleName: string | null | undefined, permission: string): boolean {
  if (!roleName) return false;
  // Super Admin melewati semua pemeriksaan izin, sama seperti `evaluateRbac`
  // di backend — tanpa ini, satu kesalahan peta di atas membuat admin sendiri
  // kehilangan tombol untuk memperbaikinya.
  if (roleName === 'Super Admin') return true;
  return ROLES_WITH[permission]?.includes(roleName) ?? false;
}
