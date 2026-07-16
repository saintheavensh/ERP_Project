import { db } from './src/db/connection.js';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Running PO migration...');
  
  try {
    await db.execute(sql`
      ALTER TABLE "purchase_orders" 
      ADD COLUMN IF NOT EXISTS "po_number" varchar(50) NOT NULL DEFAULT 'PO-' || substr(gen_random_uuid()::text, 1, 8),
      ADD COLUMN IF NOT EXISTS "expected_delivery_date" timestamp,
      ADD COLUMN IF NOT EXISTS "invoice_number" varchar(100),
      ADD COLUMN IF NOT EXISTS "invoice_date" timestamp,
      ADD COLUMN IF NOT EXISTS "invoice_due_date" timestamp,
      ADD COLUMN IF NOT EXISTS "estimated_total" numeric(14, 2) NOT NULL DEFAULT '0',
      ADD COLUMN IF NOT EXISTS "actual_total" numeric(14, 2);
    `);
    console.log('Updated purchase_orders table.');
    
    await db.execute(sql`
      ALTER TABLE "purchase_order_lines" 
      ADD COLUMN IF NOT EXISTS "received_quantity" integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "actual_unit_price" numeric(14, 2);
    `);
    console.log('Updated purchase_order_lines table.');
    
    console.log('Migration successful!');
  } catch (err) {
    console.error('Migration failed:', err);
  }
  
  process.exit(0);
}

main();
