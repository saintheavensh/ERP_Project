import { db } from './src/db/connection.js';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Running manual migration...');
  
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "inventory_categories" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id"),
        "name" text NOT NULL,
        "description" text,
        "created_at" timestamp NOT NULL DEFAULT now()
      );
    `);
    console.log('Created inventory_categories table.');
    
    await db.execute(sql`
      ALTER TABLE "inventory_items" DROP COLUMN IF EXISTS "category";
    `);
    console.log('Dropped old category column.');
    
    await db.execute(sql`
      ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "category_id" uuid REFERENCES "inventory_categories"("id");
    `);
    console.log('Added category_id column.');
    
    console.log('Migration successful!');
  } catch (err) {
    console.error('Migration failed:', err);
  }
  
  process.exit(0);
}

main();
