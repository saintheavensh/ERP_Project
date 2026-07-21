import { and, asc, eq, gt, sql } from 'drizzle-orm';
import { stockBatches, stockMovements, stockLevels } from '../../db/schema';
import { pickFifoBatches, calculateConsumedUnitCost } from '../../lib/fifo';
import { BusinessError } from '../../lib/errors';

export interface BatchDeduction {
  batchId: string;
  quantity: number;
}

export interface ConsumeStockParams {
  tenantId: string;
  branchId: string;
  inventoryItemId: string;
  partBrandId?: string | null;
  quantity: number;
  referenceType: 'pos_sale' | 'ticket_consumption';
  referenceId: string;
  serviceTicketId?: string;
}

export interface ConsumeStockResult {
  deductions: BatchDeduction[];
  /** Weighted-average cost per unit across every batch this consumption drew from. */
  unitCost: string;
  totalCost: number;
  movementIds: string[];
}

/**
 * Deducts `quantity` of an item from FIFO batches inside an existing transaction.
 * Locks the batch rows FOR UPDATE — without it two concurrent consumers can both
 * read the same quantityRemaining and oversell the last unit.
 *
 * Shared by POS checkout (H6) and ticket part consumption (H9) so there is one
 * FIFO deduction path with one set of tests, instead of a second implementation
 * that drifts the way calculateWac did before H5.
 */
export async function consumeStock(tx: any, params: ConsumeStockParams): Promise<ConsumeStockResult> {
  const batchFilters = [
    eq(stockBatches.tenantId, params.tenantId),
    eq(stockBatches.branchId, params.branchId),
    eq(stockBatches.inventoryItemId, params.inventoryItemId),
    gt(stockBatches.quantityRemaining, 0),
  ];

  if (params.partBrandId) {
    batchFilters.push(eq(stockBatches.partBrandId, params.partBrandId));
  } else {
    batchFilters.push(sql`${stockBatches.partBrandId} IS NULL`);
  }

  const availableBatches = await tx
    .select()
    .from(stockBatches)
    .where(and(...batchFilters))
    .orderBy(asc(stockBatches.receivedAt))
    .for('update');

  const { deductions, remainingUnfulfilled } = pickFifoBatches(availableBatches, params.quantity);

  if (remainingUnfulfilled > 0) {
    throw new BusinessError(
      'INSUFFICIENT_STOCK',
      `Stok tidak cukup untuk item ${params.inventoryItemId}`,
      422
    );
  }

  const unitCost = calculateConsumedUnitCost(deductions, availableBatches);
  const totalCost = Math.round(Number(unitCost) * params.quantity * 100) / 100;

  const movementIds: string[] = [];
  for (const deduction of deductions) {
    const batch = availableBatches.find((b: { id: string }) => b.id === deduction.batchId)!;

    await tx
      .update(stockBatches)
      .set({ quantityRemaining: batch.quantityRemaining - deduction.quantity })
      .where(eq(stockBatches.id, batch.id));

    const [movement] = await tx
      .insert(stockMovements)
      .values({
        tenantId: params.tenantId,
        branchId: params.branchId,
        inventoryItemId: params.inventoryItemId,
        stockBatchId: batch.id,
        movementType: 'out',
        quantity: -deduction.quantity,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        serviceTicketId: params.serviceTicketId ?? null,
      })
      .returning();
    movementIds.push(movement.id);
  }

  // Master stock level cache — see PHASES.md Architecture Debt (H4) for why this
  // is a cache and not the source of truth, and why a missing row is a hard fail
  // rather than a silently invented negative-quantity row.
  const stockLevel = await tx.query.stockLevels.findFirst({
    where: and(
      eq(stockLevels.tenantId, params.tenantId),
      eq(stockLevels.inventoryItemId, params.inventoryItemId),
      eq(stockLevels.branchId, params.branchId)
    ),
  });

  if (!stockLevel) {
    throw new BusinessError(
      'STOCK_LEVEL_MISSING',
      `No stock level record found for item ${params.inventoryItemId} at this branch — batches exist but the level cache does not`,
      422
    );
  }

  await tx
    .update(stockLevels)
    .set({ quantityAvailable: stockLevel.quantityAvailable - params.quantity })
    .where(eq(stockLevels.id, stockLevel.id));

  return { deductions, unitCost, totalCost, movementIds };
}

export interface ReturnStockParams {
  tenantId: string;
  /** referenceType stamped on the original consumeStock() movements, e.g. 'ticket_consumption'. */
  consumedReferenceType: string;
  /** referenceId stamped on the original consumeStock() movements, e.g. the charge id. */
  consumedReferenceId: string;
  /** referenceType to stamp on the reversal movements, e.g. 'ticket_return'. */
  returnReferenceType: string;
  serviceTicketId?: string;
}

export interface ReturnStockResult {
  restoredQuantity: number;
}

/**
 * Reverses a prior consumeStock() call by replaying its own movement rows backwards
 * (not a fresh FIFO pick — a return goes back to the exact batch it came from).
 * Mirrors the POS void guard (3.5B.5): a batch can never hold more than it
 * originally received, so a restore that would exceed quantityReceived fails
 * loudly rather than inventing stock. A second independent guard rejects a
 * second return of the same consumption outright.
 */
export async function returnStock(tx: any, params: ReturnStockParams): Promise<ReturnStockResult> {
  const alreadyReturned = await tx
    .select({ id: stockMovements.id })
    .from(stockMovements)
    .where(
      and(
        eq(stockMovements.tenantId, params.tenantId),
        eq(stockMovements.referenceType, params.returnReferenceType),
        eq(stockMovements.referenceId, params.consumedReferenceId)
      )
    );
  if (alreadyReturned.length > 0) {
    throw new BusinessError('ALREADY_RETURNED', 'This consumption has already been returned', 409);
  }

  const movements = await tx
    .select()
    .from(stockMovements)
    .where(
      and(
        eq(stockMovements.tenantId, params.tenantId),
        eq(stockMovements.referenceType, params.consumedReferenceType),
        eq(stockMovements.referenceId, params.consumedReferenceId)
      )
    );

  if (movements.length === 0) {
    throw new BusinessError('NOT_FOUND', 'No stock consumption found to return', 404);
  }

  let restoredQuantity = 0;
  const itemId = movements[0].inventoryItemId;
  const branchId = movements[0].branchId;

  for (const mov of movements) {
    // Locked FOR UPDATE — the same batch could be concurrently consumed by
    // another sale or ticket between this read and write.
    const [batch] = await tx.select().from(stockBatches).where(eq(stockBatches.id, mov.stockBatchId)).for('update');
    if (!batch) continue;

    const restored = batch.quantityRemaining + Math.abs(mov.quantity);
    if (restored > batch.quantityReceived) {
      throw new BusinessError(
        'RETURN_CONFLICT',
        `Cannot return: batch ${batch.id} would exceed its received quantity`,
        409
      );
    }

    await tx.update(stockBatches).set({ quantityRemaining: restored }).where(eq(stockBatches.id, batch.id));

    await tx.insert(stockMovements).values({
      tenantId: params.tenantId,
      branchId: mov.branchId,
      inventoryItemId: mov.inventoryItemId,
      stockBatchId: mov.stockBatchId,
      movementType: 'in',
      quantity: Math.abs(mov.quantity),
      referenceType: params.returnReferenceType,
      referenceId: params.consumedReferenceId,
      serviceTicketId: params.serviceTicketId ?? null,
    });

    restoredQuantity += Math.abs(mov.quantity);
  }

  const [stockLevel] = await tx
    .select()
    .from(stockLevels)
    .where(
      and(eq(stockLevels.tenantId, params.tenantId), eq(stockLevels.inventoryItemId, itemId), eq(stockLevels.branchId, branchId))
    )
    .for('update');

  if (stockLevel) {
    await tx
      .update(stockLevels)
      .set({ quantityAvailable: stockLevel.quantityAvailable + restoredQuantity })
      .where(eq(stockLevels.id, stockLevel.id));
  }

  return { restoredQuantity };
}
