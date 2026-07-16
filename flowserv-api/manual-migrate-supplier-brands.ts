import { db } from './src/db/connection.js';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Running supplier_brands migration...');
  
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "supplier_brands" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id"),
        "supplier_id" uuid NOT NULL REFERENCES "suppliers"("id"),
        "part_brand_id" uuid NOT NULL REFERENCES "part_brands"("id")
      );
    `);
    console.log('Created supplier_brands table.');
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "supplier_brands_tenant_idx" ON "supplier_brands" ("tenant_id");
    `);
    
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS "supplier_brands_unique_idx" ON "supplier_brands" ("supplier_id", "part_brand_id");
    `);
    console.log('Created indexes.');
    
    console.log('Migration successful!');
  } catch (err) {
    console.error('Migration failed:', err);
  }
  
  process.exit(0);
}

main();
