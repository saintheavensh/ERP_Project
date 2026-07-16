import { db } from './src/db/connection.js';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Running supplier migration...');
  
  try {
    await db.execute(sql`
      ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "email" text;
    `);
    console.log('Added email column.');
    
    await db.execute(sql`
      ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "photo_url" text;
    `);
    console.log('Added photo_url column.');
    
    console.log('Migration successful!');
  } catch (err) {
    console.error('Migration failed:', err);
  }
  
  process.exit(0);
}

main();
