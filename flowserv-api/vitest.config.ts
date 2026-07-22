import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // H15 — the e2e suite needs its own database (DATABASE_URL_TEST) and its
    // own reset/push/seed cycle before it can run at all; it is deliberately
    // excluded from the plain unit run and only invoked via
    // `npm run test:e2e` (scripts/test-e2e.mjs), which `npm test` also calls.
    exclude: ['**/node_modules/**', 'src/__tests__/e2e-*.test.ts'],
  },
});
