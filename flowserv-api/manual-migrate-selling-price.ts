import { db } from './src/db/connection';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('Running manual migration to add selling_price...');
  try {
    await db.execute(sql`
      ALTER TABLE inventory_items 
      ADD COLUMN IF NOT EXISTS selling_price NUMERIC(14, 2) NOT NULL DEFAULT 0;
    `);
    console.log('Migration successful: selling_price added to inventory_items');
  } catch (err) {
    console.error('Migration failed:', err);
  }
  process.exit(0);
}

migrate();
