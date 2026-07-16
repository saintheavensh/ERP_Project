import { db } from './src/db/connection';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('Running manual migration for PO tracking...');
  try {
    await db.execute(sql`
      ALTER TABLE purchase_orders 
      ADD COLUMN IF NOT EXISTS created_by UUID,
      ADD COLUMN IF NOT EXISTS approved_by UUID;
    `);
    console.log('Migration successful: tracking columns added to purchase_orders');
    
  } catch (err) {
    console.error('Migration failed:', err);
  }
  process.exit(0);
}

migrate();
