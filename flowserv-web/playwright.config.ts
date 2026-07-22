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
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
