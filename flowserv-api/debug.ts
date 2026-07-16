import { db } from './src/db/connection.js';
import { inventoryItems } from './src/db/schema.js';

async function main() {
  const items = await db.query.inventoryItems.findMany({
    with: {
      stockLevels: true
    }
  });
  console.log('ITEMS:', JSON.stringify(items, null, 2));
  process.exit(0);
}

main();
