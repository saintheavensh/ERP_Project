import { db } from './connection';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

// Refuses to run against anything but a local database. This one line is what
// stops this script from wiping a production database after Phase 11 — do not
// remove it, even temporarily, without reading plan/H0-seed-and-reset.md first.
if (!process.env.DATABASE_URL?.includes('localhost')) {
  throw new Error('db:reset is for local databases only. Aborting.');
}

async function resetDatabase(): Promise<void> {
  console.log('🗑️  Dropping schema...');
  await db.execute(sql`DROP SCHEMA public CASCADE;`);
  await db.execute(sql`CREATE SCHEMA public;`);
  console.log('✅ Schema dropped and recreated.');
}

resetDatabase()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('❌ Reset failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
