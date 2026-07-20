import { stockBatches, stockMovements, stockLevels } from '../schema';
import { IDS } from './ids';
import type { SeedTx } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;

export async function seedInventory(tx: SeedTx): Promise<void> {
  const now = Date.now();
  const threeDaysAgo = new Date(now - 3 * DAY_MS);
  const yesterday = new Date(now - 1 * DAY_MS);

  // Two batches of the same item at two different costs, from two different
  // suppliers, received on two different days — the single case that actually
  // exercises FIFO. A "buy 8" checkout must cut 5 from the old batch and 3
  // from the new one, producing two stock_movements rows and mixed COGS.
  await tx.insert(stockBatches).values([
    {
      id: IDS.batchLcdOld,
      tenantId: IDS.tenantMain,
      branchId: IDS.branchPusat,
      inventoryItemId: IDS.itemLcdMultiBatch,
      supplierId: IDS.supplierCash,
      unitCost: '150000',
      quantityReceived: 5,
      quantityRemaining: 5,
      receivedAt: threeDaysAgo,
    },
    {
      id: IDS.batchLcdNew,
      tenantId: IDS.tenantMain,
      branchId: IDS.branchPusat,
      inventoryItemId: IDS.itemLcdMultiBatch,
      supplierId: IDS.supplierTempo,
      unitCost: '165000',
      quantityReceived: 5,
      quantityRemaining: 5,
      receivedAt: yesterday,
    },
    // Single-unit item — H10 (stock reservation) needs exactly one unit so a
    // reservation can be proven to block the second sale.
    {
      id: IDS.batchStokSatu,
      tenantId: IDS.tenantMain,
      branchId: IDS.branchPusat,
      inventoryItemId: IDS.itemStokSatu,
      supplierId: IDS.supplierCash,
      unitCost: '200000',
      quantityReceived: 1,
      quantityRemaining: 1,
      receivedAt: yesterday,
    },
  ]).onConflictDoNothing();

  await tx.insert(stockMovements).values([
    {
      id: IDS.movementLcdOld,
      tenantId: IDS.tenantMain,
      branchId: IDS.branchPusat,
      inventoryItemId: IDS.itemLcdMultiBatch,
      stockBatchId: IDS.batchLcdOld,
      movementType: 'in',
      quantity: 5,
      referenceType: 'initial_stock',
      createdAt: threeDaysAgo,
    },
    {
      id: IDS.movementLcdNew,
      tenantId: IDS.tenantMain,
      branchId: IDS.branchPusat,
      inventoryItemId: IDS.itemLcdMultiBatch,
      stockBatchId: IDS.batchLcdNew,
      movementType: 'in',
      quantity: 5,
      referenceType: 'initial_stock',
      createdAt: yesterday,
    },
    {
      id: IDS.movementStokSatu,
      tenantId: IDS.tenantMain,
      branchId: IDS.branchPusat,
      inventoryItemId: IDS.itemStokSatu,
      stockBatchId: IDS.batchStokSatu,
      movementType: 'in',
      quantity: 1,
      referenceType: 'initial_stock',
      createdAt: yesterday,
    },
  ]).onConflictDoNothing();

  // Master stock level cache — must equal SUM(quantity_remaining) across the
  // batches above, since POS/purchasing read this, not the batches directly.
  await tx.insert(stockLevels).values([
    { id: IDS.levelLcd, inventoryItemId: IDS.itemLcdMultiBatch, branchId: IDS.branchPusat, quantityAvailable: 10, quantityReserved: 0 },
    { id: IDS.levelStokSatu, inventoryItemId: IDS.itemStokSatu, branchId: IDS.branchPusat, quantityAvailable: 1, quantityReserved: 0 },
  ]).onConflictDoNothing();
}
