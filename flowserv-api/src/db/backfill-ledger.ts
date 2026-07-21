import { db } from './connection';
import { posInvoices, stockMovements, stockBatches, financeLedgerEntries } from './schema';
import { eq, and } from 'drizzle-orm';
import { roundMoney, toMoneyString } from '../lib/money';

// H11 — reconstructs ledger entries for POS invoices that predate live event
// posting. Idempotent (skip on referenceType='pos_sale' + referenceId match),
// safe to re-run.
//
// COGS is computed by joining stock_movements -> stock_batches.unit_cost for
// THIS invoice's own consumption, not read from posInvoiceLines.unitCost —
// historical lines may predate H6's per-line unitCost capture. unit_cost is
// never mutated after a batch is created (only quantity_remaining changes),
// so this reconstruction is exact, not an average.
async function main() {
  const invoices = await db.select().from(posInvoices);
  console.log(`Backfilling ledger for ${invoices.length} pos_invoices...`);

  let posted = 0;
  let skipped = 0;

  for (const invoice of invoices) {
    const existing = await db
      .select({ id: financeLedgerEntries.id })
      .from(financeLedgerEntries)
      .where(
        and(
          eq(financeLedgerEntries.referenceType, 'pos_sale'),
          eq(financeLedgerEntries.referenceId, invoice.id),
          eq(financeLedgerEntries.entryType, 'revenue')
        )
      );

    if (existing.length > 0) {
      skipped++;
      continue;
    }

    const revenueAmount = roundMoney(Number(invoice.grandTotal));

    await db.insert(financeLedgerEntries).values({
      tenantId: invoice.tenantId,
      branchId: invoice.branchId,
      entryType: 'revenue',
      amount: toMoneyString(revenueAmount),
      referenceType: 'pos_sale',
      referenceId: invoice.id,
    });

    const movements = await db
      .select({ quantity: stockMovements.quantity, unitCost: stockBatches.unitCost })
      .from(stockMovements)
      .innerJoin(stockBatches, eq(stockMovements.stockBatchId, stockBatches.id))
      .where(and(eq(stockMovements.referenceType, 'pos_sale'), eq(stockMovements.referenceId, invoice.id)));

    const cogsAmount = roundMoney(
      movements.reduce((sum, m) => sum + Math.abs(m.quantity) * Number(m.unitCost), 0)
    );

    if (cogsAmount > 0) {
      await db.insert(financeLedgerEntries).values({
        tenantId: invoice.tenantId,
        branchId: invoice.branchId,
        entryType: 'cogs',
        amount: toMoneyString(cogsAmount),
        referenceType: 'pos_sale',
        referenceId: invoice.id,
      });
    }

    // Voided invoices net to zero — same referenceId, negative amount,
    // exactly like the live void path (buildVoidReversalEntries).
    if (invoice.status === 'voided') {
      await db.insert(financeLedgerEntries).values({
        tenantId: invoice.tenantId,
        branchId: invoice.branchId,
        entryType: 'revenue',
        amount: toMoneyString(-revenueAmount),
        referenceType: 'pos_sale',
        referenceId: invoice.id,
      });

      if (cogsAmount > 0) {
        await db.insert(financeLedgerEntries).values({
          tenantId: invoice.tenantId,
          branchId: invoice.branchId,
          entryType: 'cogs',
          amount: toMoneyString(-cogsAmount),
          referenceType: 'pos_sale',
          referenceId: invoice.id,
        });
      }
    }

    posted++;
  }

  console.log(`Backfill complete: ${posted} invoices posted, ${skipped} already had entries (idempotent skip).`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
  });
