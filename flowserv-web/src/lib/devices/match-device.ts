// R1.10-T5 — pencocokan pencarian katalog device.
//
// Pemilik (uji-R1.9 D2): "pencariannya harus lengkap ya misalnya saya cari
// samsung a20 tidak di temukan harus samsung galaxy a20 baru bisa di temukan".
//
// Sebabnya spesifik, dan bukan "pencariannya lemah" secara umum: kata kunci
// dicocokkan sebagai SATU TULISAN UTUH ke `"<merek> <model>"`, jadi
// "samsung a20" tidak pernah cocok dengan "Samsung Galaxy A20" — kata "Galaxy"
// yang dilompati sudah cukup menggagalkannya. Yang diketik orang adalah
// potongan yang ia INGAT, bukan nama resmi lengkap dengan urutan yang benar.
//
// Ditulis sebagai fungsi murni + tes unit, bukan diuji lewat browser: salahnya
// TIDAK memunculkan error apa pun — cuma hasil pencarian yang keliru — dan itu
// justru kelas bug yang paling mahal ditemukan lewat mata. Infrastruktur vitest
// frontend baru ada sejak R1.9, dan ini pemakaian keduanya.

/** Pecah kata kunci jadi kata-kata, buang spasi berlebih. */
function kataKunci(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

/**
 * True bila SEMUA kata di `query` muncul di `haystack`, dengan urutan bebas.
 *
 * Tiap kata dicocokkan sebagai AWALAN kata (bukan kata utuh), supaya mengetik
 * separuh tetap berguna: "sam a2" menemukan "Samsung Galaxy A20". Itu perilaku
 * yang orang harapkan dari kotak cari sambil mengetik.
 *
 * Kata kunci kosong -> false. Pemanggil yang ingin "tampilkan semua saat kotak
 * cari kosong" harus menyatakannya sendiri; mengembalikan true di sini akan
 * membuat kotak kosong tampak seperti pencarian yang cocok dengan segalanya.
 */
export function cocokSemuaKata(haystack: string, query: string): boolean {
  const kata = kataKunci(query);
  if (kata.length === 0) return false;

  const target = haystack.toLowerCase();
  // Dipecah jadi kata supaya "a20" tidak cocok dengan "…za20…" di tengah kata.
  const kataTarget = target.split(/\s+/).filter(Boolean);

  return kata.every((k) => kataTarget.some((t) => t.startsWith(k)));
}

/** Bentuk minimal yang dibutuhkan pencocokan — sengaja bukan tipe DB penuh. */
export interface BarisKatalog {
  brandName: string;
  modelName: string;
}

/**
 * Saring daftar (merek, model) memakai aturan di atas.
 *
 * Dicocokkan ke `"<merek> <model>"` supaya kata kunci boleh menyeberang
 * keduanya ("samsung a20"), dan urutannya bebas ("a20 samsung").
 */
export function cariKatalog<T extends BarisKatalog>(baris: readonly T[], query: string): T[] {
  if (query.trim() === '') return [];
  return baris.filter((b) => cocokSemuaKata(`${b.brandName} ${b.modelName}`, query));
}
