// ---------------------------------------------------------------------------
// R1.11-T3 — keputusan murni "boleh menyegarkan halaman sekarang?".
//
// Sengaja DIPISAH dari `auto-refresh.ts`, dan bukan demi kerapian: konfigurasi
// vitest frontend (`flowserv-web/vitest.config.ts`, dibuat di R1.9) sengaja
// TIDAK memuat plugin SvelteKit, dengan aturan "begitu sebuah fungsi butuh
// `$app` atau rune, ia bukan logika murni lagi". `auto-refresh.ts` mengimpor
// `$app/navigation` dan `svelte`, jadi ia memang tak bisa diuji di sana — yang
// benar adalah memindahkan keputusannya ke berkas yang tak mengimpor apa pun,
// bukan menambal konfigurasinya supaya berkas tak murni ikut lolos.
//
// Idiom yang sama dengan `evaluateRbac` / `evaluateTransition` di backend:
// keputusan bisa diuji, pengambilan data & efek samping jadi pembungkus tipis.
// ---------------------------------------------------------------------------

/**
 * Jeda antar penyegaran, dalam milidetik.
 *
 * 20 detik: cukup cepat supaya kasir yang menoleh ke layar melihat tiket yang
 * sudah didiagnosa, cukup lambat supaya satu toko dengan beberapa layar tidak
 * membebani API. Angka ini tidak kritis karena pemicu utamanya bukan interval
 * melainkan "tab kembali dipakai" — interval hanya menangani layar yang
 * dipandangi terus-menerus tanpa disentuh.
 */
export const DEFAULT_REFRESH_INTERVAL_MS = 20_000;

export interface RefreshDecision {
  /** `document.visibilityState === 'visible'` */
  visible: boolean;
  /** Ada pekerjaan pemakai yang belum tersimpan, atau permintaan sedang jalan. */
  busy: boolean;
  /** Penyegaran sebelumnya belum selesai. */
  inFlight: boolean;
}

/**
 * Boleh menyegarkan sekarang?
 *
 * Soal `busy` — dan ini ditulis apa adanya karena hipotesis pertamanya SALAH
 * dan sempat masuk ke komentar berkas ini sebelum diuji:
 *
 * Dugaan awal adalah "menyegarkan saat orang mengetik akan menghapus
 * tulisannya, karena `invalidateAll()` menukar `data`". **Dibuktikan tidak
 * benar** dengan mencabut penjaga ini lalu menjalankan tesnya: draf kotak Ubah
 * (`complaintDraft`, `checklistDraft`, `chargeForm`) hidup sebagai `$state`
 * TERPISAH dari `data`, jadi penyegaran memang tak menyentuhnya sama sekali.
 *
 * Yang benar-benar dijaga `busy`, dan ketiganya nyata:
 *
 * 1. **Penyegaran di tengah penyimpanan.** Pembacaan yang berangkat sebelum
 *    sebuah `PATCH` selesai bisa mendarat SESUDAHNYA, dan layar menampilkan
 *    keadaan sebelum tindakan yang baru saja berhasil.
 * 2. **Pekerjaan sia-sia** selagi modal/popup terbuka — pemakai sedang tidak
 *    melihat data yang disegarkan.
 * 3. **Pagar untuk nanti.** Begitu sebuah kotak Ubah diubah menjadi membaca
 *    `data` (mis. saat R2 memecah `TicketWorkspace`), bahaya penghapusan draf
 *    jadi NYATA. Penjaga ini beserta tesnya yang membuat perubahan itu aman.
 */
export function shouldRefresh(state: RefreshDecision): boolean {
  if (!state.visible) return false;
  if (state.busy) return false;
  if (state.inFlight) return false;
  return true;
}
