import { db } from '../../db/connection';
import { serviceTickets, ticketCharges, inventoryItems, approvalRequests, ticketStageHistory, users } from '../../db/schema';
import type { ChargeStatus } from '../../db/schema/enums';
import { eq, and, asc } from 'drizzle-orm';
import { BusinessError } from '../../lib/errors';
import { roundMoney, toMoneyString } from '../../lib/money';
import { consumeStock, returnStock } from '../inventory/service';
import type { CreateChargeInput, UpdateChargeInput, AssignTechnicianInput } from './types';

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

/**
 * H8 — pure decision behind the assignment audit note: is this a first
 * assignment or a reassignment away from a different technician, and what
 * should the ticket_stage_history note say. No database — this is what the
 * unit tests exercise.
 */
export function describeAssignment(
  previousTechnicianId: string | null,
  previousTechnicianName: string | null,
  newTechnicianId: string,
  newTechnicianName: string
): { isReassignment: boolean; note: string } {
  const isReassignment = !!previousTechnicianId && previousTechnicianId !== newTechnicianId;
  const note = isReassignment
    ? `Dialihkan dari ${previousTechnicianName ?? 'teknisi sebelumnya'} ke ${newTechnicianName}`
    : `Ditugaskan ke ${newTechnicianName}`;
  return { isReassignment, note };
}

/**
 * H8 — manual technician assignment. A technician is a user with a role, not a
 * separate identity, so technicianId is validated against `users` scoped to the
 * same tenant. Reassignment (a technician was already set) and first assignment
 * both record a ticket_stage_history note at the ticket's current node — TECH-015
 * wants a reason eventually; a note is enough for now.
 */
export async function assignTechnician(
  tenantId: string,
  ticketId: string,
  input: AssignTechnicianInput,
  actorUserId: string
) {
  return db.transaction(async (tx) => {
    const [ticket] = await tx
      .select()
      .from(serviceTickets)
      .where(and(eq(serviceTickets.id, ticketId), eq(serviceTickets.tenantId, tenantId)));
    if (!ticket) {
      throw new BusinessError('NOT_FOUND', 'Ticket not found', 404);
    }
    if (!ticket.currentNodeId) {
      throw new BusinessError('INVALID_STATE', 'Ticket has no current stage', 409);
    }

    const [technician] = await tx
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(and(eq(users.id, input.technicianId), eq(users.tenantId, tenantId)));
    if (!technician) {
      throw new BusinessError('TECHNICIAN_NOT_FOUND', 'Technician not found', 404);
    }

    let previousName: string | null = null;
    if (ticket.assignedTechnicianId && ticket.assignedTechnicianId !== technician.id) {
      const [previous] = await tx
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, ticket.assignedTechnicianId));
      previousName = previous?.name ?? null;
    }

    const { note } = describeAssignment(
      ticket.assignedTechnicianId,
      previousName,
      technician.id,
      technician.name
    );

    const [updated] = await tx
      .update(serviceTickets)
      .set({ assignedTechnicianId: technician.id, assignedAt: new Date() })
      .where(and(eq(serviceTickets.id, ticketId), eq(serviceTickets.tenantId, tenantId)))
      .returning();

    await tx.insert(ticketStageHistory).values({
      ticketId,
      nodeId: ticket.currentNodeId,
      actorId: actorUserId,
      notes: note,
    });

    return { ...updated, assignedTechnicianName: technician.name };
  });
}

/**
 * H9 — physically deduct a part charge from FIFO stock. Only an 'approved' charge
 * may be consumed (you cannot take stock for something the customer hasn't accepted
 * yet). The charge row is locked FOR UPDATE for the whole transaction, and the
 * status check happens after the lock is acquired — so two concurrent "Use part"
 * taps serialize, and whichever one runs second sees status='consumed' and is
 * rejected with 409 before it can call consumeStock a second time.
 */
export async function consumeCharge(tenantId: string, ticketId: string, chargeId: string) {
  return db.transaction(async (tx) => {
    const [ticket] = await tx
      .select({ branchId: serviceTickets.branchId })
      .from(serviceTickets)
      .where(and(eq(serviceTickets.id, ticketId), eq(serviceTickets.tenantId, tenantId)));
    if (!ticket) {
      throw new BusinessError('NOT_FOUND', 'Ticket not found', 404);
    }

    const [charge] = await tx
      .select()
      .from(ticketCharges)
      .where(
        and(
          eq(ticketCharges.id, chargeId),
          eq(ticketCharges.ticketId, ticketId),
          eq(ticketCharges.tenantId, tenantId)
        )
      )
      .for('update');
    if (!charge) {
      throw new BusinessError('NOT_FOUND', 'Charge not found', 404);
    }
    if (charge.sourceType !== 'part') {
      throw new BusinessError('NOT_A_PART_CHARGE', 'Only a part charge can be consumed from stock', 409);
    }
    if (charge.status === 'consumed') {
      throw new BusinessError('ALREADY_CONSUMED', 'This charge has already been consumed', 409);
    }
    if (charge.status !== 'approved') {
      throw new BusinessError('CHARGE_NOT_APPROVED', 'Only an approved charge can be consumed', 409);
    }

    const result = await consumeStock(tx, {
      tenantId,
      branchId: ticket.branchId,
      inventoryItemId: charge.inventoryItemId!,
      partBrandId: charge.partBrandId,
      quantity: charge.quantity,
      referenceType: 'ticket_consumption',
      referenceId: charge.id,
      serviceTicketId: ticketId,
    });

    const [updated] = await tx
      .update(ticketCharges)
      .set({
        status: 'consumed',
        unitCost: toMoneyString(Number(result.unitCost)),
        stockMovementId: result.movementIds[0] ?? null,
      })
      .where(eq(ticketCharges.id, chargeId))
      .returning();

    return updated;
  });
}

/**
 * H9 — undo a consumption: a part that was fitted then removed. Restores the
 * exact batches it came from (via the stock_movements trail left by consumeStock,
 * not a fresh FIFO pick) and flips the charge back to 'approved'. Mirrors the POS
 * void guard (3.5B.5): restored quantity may never exceed a batch's
 * quantityReceived, and a charge can only be returned once.
 */
export async function returnCharge(tenantId: string, ticketId: string, chargeId: string) {
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
      )
      .for('update');
    if (!charge) {
      throw new BusinessError('NOT_FOUND', 'Charge not found', 404);
    }
    if (charge.status !== 'consumed') {
      throw new BusinessError('NOT_CONSUMED', 'Only a consumed charge can be returned', 409);
    }

    await returnStock(tx, {
      tenantId,
      consumedReferenceType: 'ticket_consumption',
      consumedReferenceId: charge.id,
      returnReferenceType: 'ticket_return',
      serviceTicketId: ticketId,
    });

    const [updated] = await tx
      .update(ticketCharges)
      .set({ status: 'approved', unitCost: null, stockMovementId: null })
      .where(eq(ticketCharges.id, chargeId))
      .returning();

    return updated;
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
