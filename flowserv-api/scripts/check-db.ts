import { db } from '../src/db/connection';
import { supplierInvoices } from '../src/db/schema';
async function main() {
  try {
    const res = await db.select().from(supplierInvoices);
    console.log("Invoices:", res.length);
    console.dir(res, { depth: null });
  } catch (err) {
    console.error(err.message);
  }
  process.exit(0);
}
main();
