#!/usr/bin/env node
// H15 — test-database setup + runner for the e2e integration suite.
//
// Resets, pushes, and reseeds whatever DATABASE_URL_TEST points at (never the
// dev database — db:reset's own localhost guard is reused below), then runs
// only the e2e test file against it. The e2e test file itself re-checks that
// process.env.DATABASE_URL was actually overridden before touching anything,
// so running it directly (bypassing this script) fails loudly instead of
// silently hitting the dev database.
import { execSync } from 'node:child_process';
import dotenv from 'dotenv';

dotenv.config();

const testUrl = process.env.DATABASE_URL_TEST;

if (!testUrl) {
  console.error(
    'DATABASE_URL_TEST is not set. Refusing to run the e2e suite — it must never ' +
    'silently default to the dev database. Set it in flowserv-api/.env, e.g.\n' +
    '  DATABASE_URL_TEST=postgres://postgres:yourpassword@localhost:5432/flowserv_test'
  );
  process.exit(1);
}

if (!testUrl.includes('localhost')) {
  console.error('DATABASE_URL_TEST must point at localhost. Refusing to run against a non-local database.');
  process.exit(1);
}

const env = { ...process.env, DATABASE_URL: testUrl };
const run = (label, cmd) => {
  console.log(`\n[test-e2e] ${label}`);
  execSync(cmd, { stdio: 'inherit', env, shell: true });
};

try {
  run('Dropping + recreating the test schema...', 'npx tsx src/db/reset.ts');
  run('Pushing current schema to the test database...', 'npx drizzle-kit push');
  run('Seeding the test database...', 'npx tsx src/db/seed/index.ts');
  run('Running the e2e suite...', 'npx vitest run --config vitest.e2e.config.ts');
  console.log('\n[test-e2e] Done.');
} catch (error) {
  console.error('\n[test-e2e] Failed — see output above.');
  process.exit(1);
}
