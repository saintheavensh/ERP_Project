import { db } from './src/db/connection.js';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Running Universal Code migration...');
  
  try {
    await db.execute(sql`
      ALTER TABLE "inventory_items" 
      ADD COLUMN IF NOT EXISTS "universal_code" varchar(50);
    `);
    console.log('Updated inventory_items table.');
    
    console.log('Migration successful!');
  } catch (err) {
    console.error('Migration failed:', err);
  }
  
  process.exit(0);
}

main();
