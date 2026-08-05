// ---------------------------------------------------------------------------
// R1.11-T3 — halaman menyusul keadaan terbaru tanpa ditekan F5.
//
// Pemilik (uji-R1.10 A6): "ketika teknisi sudah melakukan diagnosa di halaman
// detail kasir masih intake posisinya jadi tidak up to date".
//
// Benar, dan sampai R1.11 memang tidak ada mekanismenya sama sekali:
// `+page.server.ts` memuat tiket SEKALI saat halaman dibuka, dan
// `invalidateAll()` hanya dipanggil setelah pemakai halaman itu sendiri
// melakukan sesuatu. Jadi layar kasir menampilkan keadaan saat ia membukanya
// dan tetap begitu sampai F5 — sementara teknisi di layar sebelah sudah
// memajukan tiketnya.
//
// Keputusan pemilik 2026-08-05: menyegarkan saat layar kembali dipakai +
// berkala. BUKAN WebSocket — PLT-013 tetap belum dibangun dan tetap fase
// sendiri; ditulis di sini supaya tidak dikira sudah beres.
//
// SATU helper dipakai semua halaman, bukan disalin per halaman — aturan yang
// sudah menyelamatkan R1.5D (satu `autoPrint`), R1.6-T2 (satu `claimTicket`),
// dan R1.9-T5 (satu jalur cetak).
// ---------------------------------------------------------------------------

import { onMount } from 'svelte';
import { invalidateAll } from '$app/navigation';
import { shouldRefresh, DEFAULT_REFRESH_INTERVAL_MS } from './refresh-policy';

// Diteruskan supaya pemanggil cukup mengimpor satu berkas; keputusannya sendiri
// tinggal di `refresh-policy.ts` yang bisa diuji tanpa browser.
export { shouldRefresh, DEFAULT_REFRESH_INTERVAL_MS } from './refresh-policy';
export type { RefreshDecision } from './refresh-policy';

export interface AutoRefreshOptions {
  /** Default `DEFAULT_REFRESH_INTERVAL_MS`. */
  intervalMs?: number;
  /**
   * Dipanggil tiap kali hendak menyegarkan. Kembalikan `true` bila ada
   * pekerjaan pemakai yang belum tersimpan — mis. kotak Ubah terbuka, modal
   * terbuka, atau permintaan sedang berjalan.
   */
  busy?: () => boolean;
}

/**
 * Memasang penyegaran otomatis pada halaman yang memanggilnya.
 *
 * Dipanggil saat komponen diinisialisasi (memakai `onMount`), jadi ia hanya
 * hidup selama halamannya terbuka dan membersihkan dirinya sendiri saat
 * ditinggalkan.
 */
export function autoRefresh(options: AutoRefreshOptions = {}): void {
  const intervalMs = options.intervalMs ?? DEFAULT_REFRESH_INTERVAL_MS;
  const isBusy = options.busy ?? (() => false);

  onMount(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    let inFlight = false;

    async function refresh(): Promise<void> {
      const boleh = shouldRefresh({
        visible: document.visibilityState === 'visible',
        busy: isBusy(),
        inFlight,
      });
      if (!boleh) return;

      inFlight = true;
      try {
        await invalidateAll();
      } catch {
        // Jaringan putus sejenak bukan alasan menghentikan penyegaran
        // berikutnya, dan bukan alasan memunculkan galat di layar: pemakai
        // tidak meminta penyegaran ini, jadi kegagalannya tidak boleh
        // mengganggunya.
      } finally {
        inFlight = false;
      }
    }

    function start(): void {
      if (timer === null) timer = setInterval(() => void refresh(), intervalMs);
    }

    function stop(): void {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    }

    // Tab yang tersembunyi TIDAK memanggil apa pun. Halaman yang ditinggal
    // terbuka semalaman tidak boleh menghujani server sampai pagi.
    function onVisibilityChange(): void {
      if (document.visibilityState === 'visible') {
        void refresh();
        start();
      } else {
        stop();
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    // `focus` menangani kasus yang `visibilitychange` lewatkan: dua jendela
    // berdampingan di layar yang sama — keduanya "visible", tapi kasir baru
    // saja mengklik kembali ke yang ini.
    window.addEventListener('focus', refresh);

    if (document.visibilityState === 'visible') start();

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', refresh);
    };
  });
}
