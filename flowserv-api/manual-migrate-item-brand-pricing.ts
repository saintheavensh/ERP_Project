import { db } from './src/db/connection';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('Running manual migration for item_brand_pricing...');
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS item_brand_pricing (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id),
        inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
        part_brand_id UUID NOT NULL REFERENCES part_brands(id),
        selling_price NUMERIC(14, 2) NOT NULL DEFAULT '0',
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS item_brand_pricing_unique 
      ON item_brand_pricing (inventory_item_id, part_brand_id);
    `);
    
    console.log('Migration successful: item_brand_pricing created.');
    
  } catch (err) {
    console.error('Migration failed:', err);
  }
  process.exit(0);
}

migrate();
