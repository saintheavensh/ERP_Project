import { and, asc, eq, gt, sql } from 'drizzle-orm';
import { stockBatches, stockMovements, stockLevels, inventoryCategories } from '../../db/schema';
import { pickFifoBatches, calculateConsumedUnitCost } from '../../lib/fifo';
import { BusinessError } from '../../lib/errors';
import { resolveMarginConfig, evaluatePriceAgainstMargin, type MarginEvaluation, type MarginSource } from '../../lib/margin';

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
 *
 * H10: also enforces the *sellable* quantity (available − reserved), not just the
 * physical batch total — this is the check that stops POS from selling a part a
 * ticket already holds a reservation on. Callers that are consuming their OWN
 * reservation (H9's consumeCharge) must call releaseReservation() first, in the
 * same transaction, so this check sees their hold already released.
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

  // Master stock level cache — see PHASES.md Architecture Debt (H4) for why this
  // is a cache and not the source of truth, and why a missing row is a hard fail
  // rather than a silently invented negative-quantity row. Locked FOR UPDATE
  // (after the batch locks, matching returnStock's lock order below) so the
  // sellable check below can't race against a concurrent reserve/consume.
  const [stockLevel] = await tx
    .select()
    .from(stockLevels)
    .where(
      and(
        eq(stockLevels.tenantId, params.tenantId),
        eq(stockLevels.inventoryItemId, params.inventoryItemId),
        eq(stockLevels.branchId, params.branchId)
      )
    )
    .for('update');

  if (!stockLevel) {
    throw new BusinessError(
      'STOCK_LEVEL_MISSING',
      `No stock level record found for item ${params.inventoryItemId} at this branch — batches exist but the level cache does not`,
      422
    );
  }

  const sellable = computeSellable(stockLevel.quantityAvailable, stockLevel.quantityReserved);
  if (sellable < params.quantity) {
    throw new BusinessError(
      'INSUFFICIENT_SELLABLE',
      `Stok tersedia untuk dijual tidak cukup untuk item ${params.inventoryItemId}: ${sellable} sellable, ${params.quantity} diminta (sebagian sedang direservasi)`,
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

  await tx
    .update(stockLevels)
    .set({ quantityAvailable: stockLevel.quantityAvailable - params.quantity })
    .where(eq(stockLevels.id, stockLevel.id));

  return { deductions, unitCost, totalCost, movementIds };
}

// ============================================================================
// H10 — Stock reservation. A reservation is a claim on stock that is still
// physically present (quantityReserved), not a movement of stock itself — it
// never touches stock_batches and creates no 'out'/'in' movement, only a
// 'reserve'/'release' ledger row for audit. See plan/H10-stock-reservation.md.
// ============================================================================

/** Pure — no database. sellable is what POS (and reservation itself) must check. */
export function computeSellable(quantityAvailable: number, quantityReserved: number): number {
  return quantityAvailable - quantityReserved;
}

/** Pure — no database. Guards the invariant that quantityReserved can never go negative. */
export function clampReleasedReserved(currentReserved: number, releaseQuantity: number): number {
  return Math.max(0, currentReserved - releaseQuantity);
}

export interface ReserveStockParams {
  tenantId: string;
  branchId: string;
  inventoryItemId: string;
  quantity: number;
  referenceType: string;
  referenceId: string;
  serviceTicketId?: string;
}

export interface ReservationResult {
  quantityReserved: number;
  movementId: string;
}

/**
 * Claims `quantity` of an item against the ticket that just had it approved.
 * Fails 422 INSUFFICIENT_SELLABLE if what's left to sell (available − already
 * reserved) can't cover it. Locked FOR UPDATE so two concurrent approvals on the
 * last unit can't both succeed.
 */
export async function reserveStock(tx: any, params: ReserveStockParams): Promise<ReservationResult> {
  const [stockLevel] = await tx
    .select()
    .from(stockLevels)
    .where(
      and(
        eq(stockLevels.tenantId, params.tenantId),
        eq(stockLevels.inventoryItemId, params.inventoryItemId),
        eq(stockLevels.branchId, params.branchId)
      )
    )
    .for('update');

  if (!stockLevel) {
    throw new BusinessError(
      'STOCK_LEVEL_MISSING',
      `No stock level record found for item ${params.inventoryItemId} at this branch`,
      422
    );
  }

  const sellable = computeSellable(stockLevel.quantityAvailable, stockLevel.quantityReserved);
  if (sellable < params.quantity) {
    throw new BusinessError(
      'INSUFFICIENT_SELLABLE',
      `Tidak bisa mereservasi: hanya ${sellable} yang tersedia untuk dijual, ${params.quantity} diminta`,
      422
    );
  }

  const quantityReserved = stockLevel.quantityReserved + params.quantity;
  await tx.update(stockLevels).set({ quantityReserved }).where(eq(stockLevels.id, stockLevel.id));

  const [movement] = await tx
    .insert(stockMovements)
    .values({
      tenantId: params.tenantId,
      branchId: params.branchId,
      inventoryItemId: params.inventoryItemId,
      stockBatchId: null,
      movementType: 'reserve',
      quantity: params.quantity,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      serviceTicketId: params.serviceTicketId ?? null,
    })
    .returning();

  return { quantityReserved, movementId: movement.id };
}

/**
 * Releases a prior reservation — on consume (immediately followed by
 * consumeStock, in the same transaction) or on cancel. Never lets
 * quantityReserved go negative (clampReleasedReserved), so a double-release or a
 * release racing a concurrent change degrades to a no-op floor instead of
 * corrupting the counter.
 */
export async function releaseReservation(tx: any, params: ReserveStockParams): Promise<ReservationResult> {
  const [stockLevel] = await tx
    .select()
    .from(stockLevels)
    .where(
      and(
        eq(stockLevels.tenantId, params.tenantId),
        eq(stockLevels.inventoryItemId, params.inventoryItemId),
        eq(stockLevels.branchId, params.branchId)
      )
    )
    .for('update');

  if (!stockLevel) {
    throw new BusinessError(
      'STOCK_LEVEL_MISSING',
      `No stock level record found for item ${params.inventoryItemId} at this branch`,
      422
    );
  }

  const quantityReserved = clampReleasedReserved(stockLevel.quantityReserved, params.quantity);
  await tx.update(stockLevels).set({ quantityReserved }).where(eq(stockLevels.id, stockLevel.id));

  const [movement] = await tx
    .insert(stockMovements)
    .values({
      tenantId: params.tenantId,
      branchId: params.branchId,
      inventoryItemId: params.inventoryItemId,
      stockBatchId: null,
      movementType: 'release',
      quantity: params.quantity,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      serviceTicketId: params.serviceTicketId ?? null,
    })
    .returning();

  return { quantityReserved, movementId: movement.id };
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

/**
 * P1 (4C.2) — item→category margin-config resolution, the DB-touching half of
 * lib/margin.ts's pure `resolveMarginConfig`. Fetches the category only when the
 * item actually has one; a categoryless item just falls through to the item's own
 * override (or the system default), same as `resolveMarginConfig(item, null)`.
 */
export async function resolveItemMarginConfig(
  tx: any,
  tenantId: string,
  item: MarginSource & { categoryId?: string | null }
) {
  let category: MarginSource | undefined;
  if (item.categoryId) {
    [category] = await tx
      .select({ marginStrategy: inventoryCategories.marginStrategy, targetMargin: inventoryCategories.targetMargin })
      .from(inventoryCategories)
      .where(and(eq(inventoryCategories.id, item.categoryId), eq(inventoryCategories.tenantId, tenantId)));
  }
  return resolveMarginConfig(item, category);
}

/**
 * P1 (4C.2) — the one check every price-write route calls before storing a
 * `sellingPrice`. Resolves the item's effective margin config, evaluates `price`
 * against `cost` (the caller decides which cost — WAC for most routes, or a
 * freshly-recalculated WAC right after a goods receipt), and hard-blocks a
 * below-cost price with 422 PRICE_BELOW_COST unless `allowBelowCost` was set —
 * the one deliberate override for a genuine clearance price. A 'below_target' or
 * 'unknown_cost' result is never blocked, only ever returned for the caller to
 * surface as a warning.
 */
export async function assertPriceAllowed(
  tx: any,
  tenantId: string,
  item: MarginSource & { categoryId?: string | null },
  price: number,
  cost: number,
  allowBelowCost: boolean
): Promise<MarginEvaluation> {
  const config = await resolveItemMarginConfig(tx, tenantId, item);
  const evaluation = evaluatePriceAgainstMargin(price, cost, config);

  if (evaluation.status === 'below_cost' && !allowBelowCost) {
    throw new BusinessError(
      'PRICE_BELOW_COST',
      `Selling price ${price} is below cost ${cost}. Set allowBelowCost: true to confirm a deliberate clearance price.`,
      422
    );
  }

  return evaluation;
}
