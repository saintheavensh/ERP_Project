import { defineConfig } from '@playwright/test';

// H15 gap (b) / H-track: a real in-browser click-through of the ticket lifecycle,
// the piece every task since H7 substituted with an SSR-with-cookie check because
// Playwright was not installed. Before `npm run test:e2e:ui` (which runs
// `playwright test`), both servers must be up against a freshly-seeded dev DB:
//   flowserv-api$  npm run db:reset && npm run dev     # API on :3001
//   flowserv-web$  npm run dev                          # web on :5173
// Screenshots land in test-results/intake-to-close/.
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    // Default = 5188, port yang dipakai `start-flowserv.ps1` (`--strictPort`),
    // BUKAN 5173 bawaan Vite.
    //
    // R1.6 — sebelumnya default-nya 5173 dan itu memakan waktu nyata: di mesin
    // ini port 5173 dipegang proyek lain (`pos_sederhana`), jadi seluruh suite
    // menguji APLIKASI YANG SALAH dan gagal dengan pesan yang menyesatkan
    // ("locator #email tidak ditemukan") — bukan karena kodenya rusak.
    // Peringatan soal ini sudah tertulis di sini sejak dulu; yang salah adalah
    // default-nya sendiri, karena peluncur resmi proyek ini tidak pernah
    // memakai 5173. Override tetap bisa lewat PLAYWRIGHT_BASE_URL.
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5188',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
