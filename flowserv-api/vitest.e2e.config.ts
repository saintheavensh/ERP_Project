import { defineConfig } from 'vitest/config';

// H15 — separate config for the e2e suite: it needs its own database
// (DATABASE_URL_TEST) and a fresh reset/push/seed cycle, so it is excluded
// from the default vitest.config.ts and only ever run via
// `npm run test:e2e` (scripts/test-e2e.mjs), which does that reset first.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/__tests__/e2e-*.test.ts'],
    // These are individually large, sequential, real-HTTP-and-DB scenarios —
    // give them more room than the default 5s unit-test timeout.
    testTimeout: 20000,
  },
});
