import { defineConfig } from 'vitest/config';

// R1.9 — tempat pertama untuk menguji LOGIKA MURNI di frontend.
//
// Sampai sekarang frontend hanya punya Playwright, dan itu meninggalkan lubang
// yang nyata: `lib/auth/route-access.ts` — tabel yang memutuskan peran mana
// boleh membuka halaman mana — tidak pernah punya satu pun tes unit, padahal ia
// fungsi murni. Kasus seperti "dua pelanggan berbeda yang kebetulan bernama
// sama" (T2) praktis tak terjangkau lewat browser: menyiapkan datanya di seed
// jauh lebih mahal daripada nilai tesnya.
//
// SENGAJA TIDAK memuat plugin SvelteKit. Yang diuji di sini hanya berkas `.ts`
// biasa tanpa `$lib` alias maupun rune — begitu sebuah fungsi butuh keduanya,
// ia bukan lagi logika murni dan tempatnya memang di Playwright.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/__tests__/*.test.ts'],
    exclude: ['**/node_modules/**', 'e2e/**'],
  },
});
