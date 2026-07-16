import { db } from './src/db/connection';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('Running manual migration for mass initialization features...');
  try {
    await db.execute(sql`
      ALTER TABLE inventory_items 
      ADD COLUMN IF NOT EXISTS is_stock_initialized BOOLEAN NOT NULL DEFAULT false;
    `);
    console.log('Migration successful: is_stock_initialized added to inventory_items');
    
    await db.execute(sql`
      ALTER TABLE stock_batches 
      ADD COLUMN IF NOT EXISTS part_brand_id UUID REFERENCES part_brands(id);
    `);
    console.log('Migration successful: part_brand_id added to stock_batches');
    
  } catch (err) {
    console.error('Migration failed:', err);
  }
  process.exit(0);
}

migrate();
