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
