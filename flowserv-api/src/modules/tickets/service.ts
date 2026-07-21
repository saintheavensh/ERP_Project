import { db } from '../../db/connection';
import { serviceTickets, ticketCharges, inventoryItems, approvalRequests } from '../../db/schema';
import type { ChargeStatus } from '../../db/schema/enums';
import { eq, and, asc } from 'drizzle-orm';
import { BusinessError } from '../../lib/errors';
import { roundMoney, toMoneyString } from '../../lib/money';
import type { CreateChargeInput, UpdateChargeInput } from './types';

// ============================================================================
// Pure functions — no database, no HTTP. These are what the unit tests exercise.
// ============================================================================

export interface ChargeCalcRow {
  status: ChargeStatus;
  quantity: number;
  unitPrice: number;      // already parsed from the decimal string
  unitCost: number | null; // null for labor/fee and for un-consumed parts
}

/** Totals grouped by lifecycle bucket. 'cancelled' charges count toward nothing. */
export function calculateTicketTotals(rows: ChargeCalcRow[]): {
  estimated: number;
  approved: number;
  consumed: number;
} {
  const bucket = (status: ChargeStatus) =>
    roundMoney(
      rows
        .filter((r) => r.status === status)
        .reduce((sum, r) => sum + r.quantity * r.unitPrice, 0)
    );
  return {
    estimated: bucket('estimated'),
    approved: bucket('approved'),
    consumed: bucket('consumed'),
  };
}

/** Only an 'estimated' charge may be edited or deleted — once quoted it is frozen. */
export function canModifyCharge(charge: { status: ChargeStatus }): boolean {
  return charge.status === 'estimated';
}

/**
 * Revenue − cost over every non-cancelled charge — the question the app exists to
 * answer. A labor line has a null unitCost (no COGS) so it adds to revenue but not
 * cost, which is exactly why margin on a labor-heavy repair looks healthy.
 */
export function calculateTicketMargin(rows: ChargeCalcRow[]): {
  revenue: number;
  cost: number;
  margin: number;
} {
  const active = rows.filter((r) => r.status !== 'cancelled');
  const revenue = roundMoney(active.reduce((s, r) => s + r.quantity * r.unitPrice, 0));
  const cost = roundMoney(active.reduce((s, r) => s + r.quantity * (r.unitCost ?? 0), 0));
  return { revenue, cost, margin: roundMoney(revenue - cost) };
}

// ============================================================================
// Database functions — tenant-scoped, transactional.
// ============================================================================

// Postgres decimal columns come back as strings. Parse once, here, so the rest of the
// module works in numbers and never string-compares money.
function toCalcRow(r: { status: ChargeStatus; quantity: number; unitPrice: string; unitCost: string | null }): ChargeCalcRow {
  return {
    status: r.status,
    quantity: r.quantity,
    unitPrice: parseFloat(r.unitPrice),
    unitCost: r.unitCost === null ? null : parseFloat(r.unitCost),
  };
}

/**
 * Recompute the ticket's denormalized totals from its charge rows and persist them, in
 * the caller's transaction. Every charge mutation MUST call this or the cached
 * estimated_total silently drifts from SUM(charges). We re-read and re-sum rather than
 * adjust by a delta so a bug can only ever be a stale value, never a compounding error.
 */
async function recomputeAndPersistTotals(tx: any, tenantId: string, ticketId: string): Promise<void> {
  const rows = await tx
    .select({
      status: ticketCharges.status,
      quantity: ticketCharges.quantity,
      unitPrice: ticketCharges.unitPrice,
      unitCost: ticketCharges.unitCost,
    })
    .from(ticketCharges)
    .where(and(eq(ticketCharges.ticketId, ticketId), eq(ticketCharges.tenantId, tenantId)));

  const totals = calculateTicketTotals(rows.map(toCalcRow));
  await tx
    .update(serviceTickets)
    .set({ estimatedTotal: toMoneyString(totals.estimated) })
    .where(and(eq(serviceTickets.id, ticketId), eq(serviceTickets.tenantId, tenantId)));
}

async function assertTicketExists(tx: any, tenantId: string, ticketId: string) {
  const [ticket] = await tx
    .select({ id: serviceTickets.id })
    .from(serviceTickets)
    .where(and(eq(serviceTickets.id, ticketId), eq(serviceTickets.tenantId, tenantId)));
  if (!ticket) {
    throw new BusinessError('NOT_FOUND', 'Ticket not found', 404);
  }
}

/** Add an estimated charge. Never touches stock — that is H9. */
export async function addCharge(
  tenantId: string,
  ticketId: string,
  input: CreateChargeInput,
  userId: string
) {
  return db.transaction(async (tx) => {
    await assertTicketExists(tx, tenantId, ticketId);

    let description = input.description;
    let unitPrice = input.unitPrice;
    let inventoryItemId: string | null = null;
    let partBrandId: string | null = null;

    if (input.sourceType === 'part') {
      const [item] = await tx
        .select({ name: inventoryItems.name, sellingPrice: inventoryItems.sellingPrice })
        .from(inventoryItems)
        .where(and(eq(inventoryItems.id, input.inventoryItemId), eq(inventoryItems.tenantId, tenantId)));
      if (!item) {
        throw new BusinessError('ITEM_NOT_FOUND', 'Inventory item not found', 404);
      }
      // Default from the item but stay editable — technicians negotiate the price.
      if (unitPrice === undefined) unitPrice = parseFloat(item.sellingPrice);
      if (!description) description = item.name;
      inventoryItemId = input.inventoryItemId;
      partBrandId = input.partBrandId ?? null;
    }

    // labor/fee always carry their own description + unitPrice (enforced by the schema);
    // for part, both are now resolved above.
    const [charge] = await tx
      .insert(ticketCharges)
      .values({
        tenantId,
        ticketId,
        sourceType: input.sourceType,
        description: description!,
        inventoryItemId,
        partBrandId,
        quantity: input.quantity,
        unitPrice: toMoneyString(unitPrice!),
        status: 'estimated',
        createdBy: userId,
      })
      .returning();

    await recomputeAndPersistTotals(tx, tenantId, ticketId);
    return charge;
  });
}

/** Edit a charge — only while 'estimated'. */
export async function updateCharge(
  tenantId: string,
  ticketId: string,
  chargeId: string,
  input: UpdateChargeInput
) {
  return db.transaction(async (tx) => {
    const [charge] = await tx
      .select()
      .from(ticketCharges)
      .where(
        and(
          eq(ticketCharges.id, chargeId),
          eq(ticketCharges.ticketId, ticketId),
          eq(ticketCharges.tenantId, tenantId)
        )
      );
    if (!charge) {
      throw new BusinessError('NOT_FOUND', 'Charge not found', 404);
    }
    if (!canModifyCharge(charge)) {
      throw new BusinessError('CHARGE_LOCKED', 'Only an estimated charge can be edited', 409);
    }

    const patch: Record<string, unknown> = {};
    if (input.description !== undefined) patch.description = input.description;
    if (input.quantity !== undefined) patch.quantity = input.quantity;
    if (input.unitPrice !== undefined) patch.unitPrice = toMoneyString(input.unitPrice);

    let updated = charge;
    if (Object.keys(patch).length > 0) {
      [updated] = await tx
        .update(ticketCharges)
        .set(patch)
        .where(eq(ticketCharges.id, chargeId))
        .returning();
      await recomputeAndPersistTotals(tx, tenantId, ticketId);
    }
    return updated;
  });
}

/** Delete a charge — only while 'estimated'. */
export async function deleteCharge(tenantId: string, ticketId: string, chargeId: string) {
  return db.transaction(async (tx) => {
    const [charge] = await tx
      .select()
      .from(ticketCharges)
      .where(
        and(
          eq(ticketCharges.id, chargeId),
          eq(ticketCharges.ticketId, ticketId),
          eq(ticketCharges.tenantId, tenantId)
        )
      );
    if (!charge) {
      throw new BusinessError('NOT_FOUND', 'Charge not found', 404);
    }
    if (!canModifyCharge(charge)) {
      throw new BusinessError('CHARGE_LOCKED', 'Only an estimated charge can be deleted', 409);
    }

    await tx.delete(ticketCharges).where(eq(ticketCharges.id, chargeId));
    await recomputeAndPersistTotals(tx, tenantId, ticketId);
    return { id: chargeId, deleted: true };
  });
}

/**
 * Freeze the current estimate into a quote: flip every 'estimated' charge to 'approved',
 * update the ticket's totals, and write an approval_requests row whose `amount` is the
 * sum being quoted — the number that column has always waited for and nothing produced.
 */
export async function generateQuotation(tenantId: string, ticketId: string) {
  return db.transaction(async (tx) => {
    await assertTicketExists(tx, tenantId, ticketId);

    const estimated = await tx
      .select({ quantity: ticketCharges.quantity, unitPrice: ticketCharges.unitPrice })
      .from(ticketCharges)
      .where(
        and(
          eq(ticketCharges.ticketId, ticketId),
          eq(ticketCharges.tenantId, tenantId),
          eq(ticketCharges.status, 'estimated')
        )
      );

    if (estimated.length === 0) {
      throw new BusinessError('NO_CHARGES_TO_QUOTE', 'There are no estimated charges to quote', 422);
    }

    const quotedAmount = roundMoney(
      estimated.reduce((s, r) => s + r.quantity * parseFloat(r.unitPrice), 0)
    );

    // estimated → approved (the customer is being asked to accept this set)
    await tx
      .update(ticketCharges)
      .set({ status: 'approved' })
      .where(
        and(
          eq(ticketCharges.ticketId, ticketId),
          eq(ticketCharges.tenantId, tenantId),
          eq(ticketCharges.status, 'estimated')
        )
      );

    // Recompute both totals from the post-flip rows: estimated drops (usually to 0),
    // approved rises to the cumulative approved sum.
    const rows = await tx
      .select({
        status: ticketCharges.status,
        quantity: ticketCharges.quantity,
        unitPrice: ticketCharges.unitPrice,
        unitCost: ticketCharges.unitCost,
      })
      .from(ticketCharges)
      .where(and(eq(ticketCharges.ticketId, ticketId), eq(ticketCharges.tenantId, tenantId)));
    const totals = calculateTicketTotals(rows.map(toCalcRow));

    await tx
      .update(serviceTickets)
      .set({
        estimatedTotal: toMoneyString(totals.estimated),
        approvedTotal: toMoneyString(totals.approved),
      })
      .where(and(eq(serviceTickets.id, ticketId), eq(serviceTickets.tenantId, tenantId)));

    const [approvalRequest] = await tx
      .insert(approvalRequests)
      .values({
        ticketId,
        amount: toMoneyString(quotedAmount),
        status: 'pending',
      })
      .returning();

    return { approvalRequest, quotedAmount, approvedTotal: totals.approved };
  });
}

/** List a ticket's charges with computed totals and margin. */
export async function listCharges(tenantId: string, ticketId: string) {
  await assertTicketExists(db, tenantId, ticketId);

  const charges = await db
    .select()
    .from(ticketCharges)
    .where(and(eq(ticketCharges.ticketId, ticketId), eq(ticketCharges.tenantId, tenantId)))
    .orderBy(asc(ticketCharges.createdAt));

  const calcRows = charges.map(toCalcRow);
  return {
    charges,
    totals: calculateTicketTotals(calcRows),
    margin: calculateTicketMargin(calcRows),
  };
}
