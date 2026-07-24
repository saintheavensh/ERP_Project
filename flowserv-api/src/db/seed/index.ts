import * as dotenv from 'dotenv';
import { db } from '../connection';
import { seedCore } from './01-core';
import { seedCatalog } from './02-catalog';
import { seedSuppliers } from './03-suppliers';
import { seedFlows } from './04-flows';
import { seedInventory } from './05-inventory';
import { seedCustomers } from './06-customers';
import { seedTransactions } from './07-transactions';
import { seedPrinter } from './08-printer';
import { seedPaymentMethods } from './09-payment-methods';
import { IDS } from './ids';

dotenv.config();

// Re-exported so tests can reference seeded rows directly (SEED_IDS.tenantMain,
// SEED_IDS.itemLcdMultiBatch, ...) instead of querying for them first.
export const SEED_IDS = IDS;

async function runSeed(): Promise<void> {
  console.log('🌱 Seeding database...');

  // One transaction for the whole run: foreign keys require these modules to
  // run in this exact order (core -> catalog -> suppliers -> flows ->
  // inventory -> customers -> transactions -> printer -> payment-methods),
  // and a failure partway through should leave nothing behind rather than a
  // half-seeded database.
  await db.transaction(async (tx) => {
    await seedCore(tx);
    await seedCatalog(tx);
    await seedSuppliers(tx);
    await seedFlows(tx);
    await seedInventory(tx);
    await seedCustomers(tx);
    await seedTransactions(tx);
    await seedPrinter(tx);
    await seedPaymentMethods(tx);
  });

  console.log('✅ Seed complete.');
}

runSeed()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('❌ Seeding failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
