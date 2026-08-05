import { describe, it, expect } from 'vitest';
// Diimpor dari `refresh-policy` (berkas murni), BUKAN dari `auto-refresh` yang
// mengimpor `$app/navigation` — vitest frontend sengaja tak memuat plugin
// SvelteKit, dan itu justru aturannya: kalau sebuah keputusan tak bisa diuji di
// sini, ia belum dipisahkan dari efek sampingnya.
import { shouldRefresh, DEFAULT_REFRESH_INTERVAL_MS } from '../refresh-policy';

// ---------------------------------------------------------------------------
// R1.11-T3. Keputusan "boleh menyegarkan sekarang?" diuji di sini, bukan di
// browser, karena kasus terpentingnya — menolak menyegarkan saat pemakai
// sedang mengetik — adalah kelas bug yang TIDAK memunculkan error apa pun.
// Yang terjadi hanya tulisan orang hilang, dan hilangnya diam-diam.
// ---------------------------------------------------------------------------

describe('shouldRefresh', () => {
  const tenang = { visible: true, busy: false, inFlight: false };

  it('menyegarkan saat halaman terlihat dan tidak ada pekerjaan tertunda', () => {
    expect(shouldRefresh(tenang)).toBe(true);
  });

  it('TIDAK menyegarkan saat tab tersembunyi', () => {
    // Halaman yang ditinggal terbuka semalaman tidak boleh menghujani server.
    expect(shouldRefresh({ ...tenang, visible: false })).toBe(false);
  });

  it('TIDAK menyegarkan saat pemakai punya pekerjaan belum tersimpan', () => {
    // Alasan `busy` ada — dan bukan yang pertama kali diduga. Dugaan "kotak
    // Ubah kehilangan tulisannya" sudah diuji dan ternyata salah (draf hidup
    // di `$state` terpisah dari `data`). Yang nyata: penyegaran di tengah
    // penyimpanan bisa mendarat setelah PATCH selesai dan menampilkan keadaan
    // sebelum tindakan yang baru saja berhasil. Lihat refresh-policy.ts.
    expect(shouldRefresh({ ...tenang, busy: true })).toBe(false);
  });

  it('TIDAK menumpuk permintaan bila penyegaran sebelumnya belum selesai', () => {
    expect(shouldRefresh({ ...tenang, inFlight: true })).toBe(false);
  });

  it('satu alasan saja sudah cukup untuk menolak', () => {
    expect(shouldRefresh({ visible: false, busy: true, inFlight: true })).toBe(false);
    expect(shouldRefresh({ visible: true, busy: true, inFlight: false })).toBe(false);
    expect(shouldRefresh({ visible: true, busy: false, inFlight: true })).toBe(false);
  });

  it('jeda bawaannya masuk akal untuk dipandangi terus-menerus', () => {
    // Bukan angka keramat, tapi ia harus tetap di kisaran detik: terlalu cepat
    // membebani API satu toko, terlalu lambat mengembalikan keluhan aslinya.
    expect(DEFAULT_REFRESH_INTERVAL_MS).toBeGreaterThanOrEqual(5_000);
    expect(DEFAULT_REFRESH_INTERVAL_MS).toBeLessThanOrEqual(60_000);
  });
});
