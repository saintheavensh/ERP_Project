import { env } from '$env/dynamic/private';

// ---------------------------------------------------------------------------
// Alamat API untuk panggilan dari SISI SERVER (`+page.server.ts`, `hooks.server.ts`).
//
// Ini SENGAJA terpisah dari `config.ts`, dan bukan demi kerapian — keduanya
// memang bernilai BEDA begitu aplikasi ini dideploy:
//
//   browser  → https://toko-anda.com/api   (lewat Nginx, keluar ke internet)
//   server   → http://api:3001             (nama service Docker, jaringan internal)
//
// Server SSR berjalan di dalam jaringan Docker dan bisa memanggil kontainer API
// secara langsung; browser pelanggan jelas tidak bisa. Menyamakan keduanya berarti
// salah satunya pasti salah: kalau server memakai domain publik, tiap render
// halaman berputar keluar-masuk internet tanpa alasan (dan gagal total kalau DNS
// belum jadi); kalau browser memakai `http://api:3001`, ia memanggil nama host
// yang tidak ada di komputer pemakai.
//
// `$env/dynamic/private` TIDAK PERNAH sampai ke browser — SvelteKit menolak
// mengimpornya dari kode klien. Itu yang membuat berkas ini aman menyimpan
// alamat internal.
//
// Sampai 2026-08-05, alamat ini ditulis `http://localhost:3001` secara harfiah di
// **34 berkas** (65 kemunculan). Itu utang yang sudah dicatat sejak 3.5E.1 dengan
// alasan tertulis "sisi server dibiarkan sampai Phase 11" — dan Phase 11 adalah
// sekarang: `localhost` di dalam kontainer berarti kontainer ITU SENDIRI, jadi
// tanpa perubahan ini tidak ada satu halaman pun yang berhasil dirender.
// ---------------------------------------------------------------------------

/**
 * Akar alamat API dari sisi server.
 *
 * `API_URL` (bukan `PUBLIC_API_URL`) — variabel privat, hanya dibaca server.
 * Nilai bawaannya tetap `localhost:3001` supaya `npm run dev` tanpa `.env`
 * berjalan persis seperti sebelumnya.
 */
export const API_URL = env.API_URL ?? 'http://localhost:3001';

/** Kenyamanan: hampir semua panggilan memakai awalan `/v1`. */
export const API_BASE = `${API_URL}/v1`;
