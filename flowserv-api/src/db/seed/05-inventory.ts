import { stockBatches, stockMovements, stockLevels } from '../schema';
import { IDS } from './ids';
import type { SeedTx } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;

export async function seedInventory(tx: SeedTx): Promise<void> {
  const now = Date.now();
  const threeDaysAgo = new Date(now - 3 * DAY_MS);
  const twoDaysAgo = new Date(now - 2 * DAY_MS);
  const yesterday = new Date(now - 1 * DAY_MS);

  // Two batches of the same item at two different costs, from two different
  // suppliers, received on two different days — the single case that actually
  // exercises FIFO. A "buy 8" checkout must cut 5 from the old batch and 3
  // from the new one, producing two stock_movements rows and mixed COGS.
  //
  // Setiap batch punya receivedAt hari yang berbeda (3 hari lalu / 2 hari lalu /
  // 1 hari lalu untuk batch PO di 07-transactions.ts) supaya urutan FIFO tidak
  // pernah seri — kalau seri, urutan konsumsinya jadi tidak deterministik dan
  // test COGS bisa lulus/gagal berganti-ganti tanpa ada yang berubah.
  await tx.insert(stockBatches).values([
    {
      id: IDS.batchLcdOld,
      tenantId: IDS.tenantMain,
      branchId: IDS.branchPusat,
      inventoryItemId: IDS.itemLcdMultiBatch,
      partBrandId: IDS.partBrandIncell,
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
      partBrandId: IDS.partBrandIncell,
      supplierId: IDS.supplierTempo,
      unitCost: '165000',
      quantityReceived: 5,
      quantityRemaining: 5,
      receivedAt: twoDaysAgo,
    },
    // Single-unit item — H10 (stock reservation) needs exactly one unit so a
    // reservation can be proven to block the second sale.
    {
      id: IDS.batchStokSatu,
      tenantId: IDS.tenantMain,
      branchId: IDS.branchPusat,
      inventoryItemId: IDS.itemStokSatu,
      partBrandId: IDS.partBrandOem,
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
      createdAt: twoDaysAgo,
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

  // Master stock level cache — must equal SUM(quantity_remaining) across ALL
  // batches of the item, since POS/purchasing read this, not the batches
  // directly.
  //
  // LCD = 30, bukan 10: 5 + 5 dari dua batch stok awal di atas, DITAMBAH 20 unit
  // yang diterima lewat PO-SEED-0002 (batchLcdPo, dibuat di 07-transactions.ts
  // karena batch-nya menunjuk ke purchase_order_lines yang baru ada di sana).
  // Sebelum ini PO tersebut berstatus 'completed' dengan receivedQuantity 20
  // tapi tidak pernah menambah stok sama sekali — angkanya bohong.
  await tx.insert(stockLevels).values([
    { id: IDS.levelLcd, inventoryItemId: IDS.itemLcdMultiBatch, branchId: IDS.branchPusat, quantityAvailable: 30, quantityReserved: 0 },
    { id: IDS.levelStokSatu, inventoryItemId: IDS.itemStokSatu, branchId: IDS.branchPusat, quantityAvailable: 1, quantityReserved: 0 },
  ]).onConflictDoNothing();
}
