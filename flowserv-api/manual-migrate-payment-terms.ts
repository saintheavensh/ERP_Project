import { db } from './src/db/connection.js';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Running supplier payment terms migration...');
  
  try {
    await db.execute(sql`
      ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "payment_term_days" integer NOT NULL DEFAULT 0;
    `);
    console.log('Added payment_term_days column.');
    
    console.log('Migration successful!');
  } catch (err) {
    console.error('Migration failed:', err);
  }
  
  process.exit(0);
}

main();
