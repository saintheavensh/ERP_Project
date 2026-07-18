import { db } from '../src/db/connection';
import { supplierInvoices } from '../src/db/schema';
import { eq, ne, and, desc } from 'drizzle-orm';

async function main() {
  try {
    const payables = await db.query.supplierInvoices.findMany({
      where: ne(supplierInvoices.status, 'paid'),
      orderBy: [desc(supplierInvoices.dueDate), desc(supplierInvoices.createdAt)],
      with: {
        supplier: true,
        purchaseOrder: true
      }
    });
    console.log("Payables:", payables.length);
    console.dir(payables, { depth: null });
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
main();
