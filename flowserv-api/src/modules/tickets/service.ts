import { db } from '../../db/connection';
import { serviceTickets, ticketCharges, inventoryItems, approvalRequests, ticketStageHistory, users, customers, posInvoices, posInvoiceLines } from '../../db/schema';
import type { ChargeStatus, LineSource, TicketStatus } from '../../db/schema/enums';
import { eq, and, asc, ne } from 'drizzle-orm';
import { BusinessError } from '../../lib/errors';
import { roundMoney, toMoneyString } from '../../lib/money';
import { consumeStock, returnStock, reserveStock, releaseReservation } from '../inventory/service';
import { emitEvent, AppEvent } from '../../services/event-bus';
import { buildSuccessEnvelope } from '../../lib/response';
import { recordIdempotentResponse, type IdempotencyRef } from '../../lib/idempotency';
import { allocateInvoiceNumber } from '../../lib/invoice-number';
import { evaluateCashTender } from '../../lib/cash';

// H10 — every reserve/release movement for a ticket charge shares this
// referenceType, distinguished by movementType; referenceId is always the charge id.
const RESERVATION_REFERENCE_TYPE = 'ticket_charge_reservation';
import type { CreateChargeInput, UpdateChargeInput, AssignTechnicianInput, GenerateTicketInvoiceInput, UpdateIntakeDetailsInput } from './types';

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
 * F3 — SVC-013: only an 'open' ticket can be cancelled. A 'closed' ticket is
 * already done; a 'cancelled' ticket cancelling again would double-release
 * reservations that no longer exist.
 */
export function canCancelTicket(status: TicketStatus): boolean {
  return status === 'open';
}

/**
 * H17 — which charges become invoice lines. A part is billable only once
 * 'consumed' (its stock was physically deducted at consumption, H9); labor/fee
 * are billable once 'approved' (they carry no stock and are never 'consumed').
 * Everything else — estimated, an approved-but-unconsumed part (reserved, not yet
 * fitted), or cancelled — is not billed. Pure, so it is unit-testable without a DB.
 */
export function isBillableCharge(charge: { sourceType: LineSource; status: ChargeStatus }): boolean {
  if (charge.sourceType === 'part') return charge.status === 'consumed';
  if (charge.sourceType === 'labor' || charge.sourceType === 'fee') return charge.status === 'approved';
  return false; // 'discount' as a ticket charge is not implemented
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
 * reserve stock for every part among them (H10 — this is the moment a part becomes
 * "promised" and must stop being sellable elsewhere), update the ticket's totals, and
 * write an approval_requests row whose `amount` is the sum being quoted — the number
 * that column has always waited for and nothing produced.
 *
 * If any part can't be reserved (INSUFFICIENT_SELLABLE), the whole transaction rolls
 * back — no charge flips to 'approved' and no partial reservation is left behind.
 */
export async function generateQuotation(tenantId: string, ticketId: string) {
  return db.transaction(async (tx) => {
    const [ticket] = await tx
      .select({ id: serviceTickets.id, branchId: serviceTickets.branchId })
      .from(serviceTickets)
      .where(and(eq(serviceTickets.id, ticketId), eq(serviceTickets.tenantId, tenantId)));
    if (!ticket) {
      throw new BusinessError('NOT_FOUND', 'Ticket not found', 404);
    }

    const estimated = await tx
      .select({
        id: ticketCharges.id,
        sourceType: ticketCharges.sourceType,
        inventoryItemId: ticketCharges.inventoryItemId,
        quantity: ticketCharges.quantity,
        unitPrice: ticketCharges.unitPrice,
      })
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

    // H10 — reserve every part charge just approved. Labor/fee never touch stock.
    for (const charge of estimated) {
      if (charge.sourceType !== 'part') continue;
      await reserveStock(tx, {
        tenantId,
        branchId: ticket.branchId,
        inventoryItemId: charge.inventoryItemId!,
        quantity: charge.quantity,
        referenceType: RESERVATION_REFERENCE_TYPE,
        referenceId: charge.id,
        serviceTicketId: ticketId,
      });
    }

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
 * H17 — SBL-003: turn a ticket's billable charges into a customer invoice.
 *
 * Bills consumed parts + approved labor/fee (see isBillableCharge) as a normal
 * pos_invoices row linked to the ticket. Crucially it does NOT re-run FIFO: the
 * parts' stock was already deducted at consumption (H9), so re-deducting here is
 * exactly the double-deduct bug H15 found. Each part line copies its already-known
 * unitCost from the charge (record only).
 *
 * Ledger: emits TICKET_INVOICE_CREATED (revenue only) AFTER commit — the COGS for
 * these parts was already posted at consumption time, so a matched pair here would
 * double-count cost. See modules/finance/ledger.ts buildTicketInvoiceRevenueEntry.
 *
 * One invoice per ticket: a second attempt while a non-voided invoice already
 * references this ticket is rejected (409). Incremental invoicing is future work.
 */
export async function generateTicketInvoice(
  tenantId: string,
  ticketId: string,
  input: GenerateTicketInvoiceInput,
  userId: string,
  idempotency?: IdempotencyRef,
  requestId?: string
) {
  const result = await db.transaction(async (tx) => {
    const [ticket] = await tx
      .select({ id: serviceTickets.id, branchId: serviceTickets.branchId, customerId: serviceTickets.customerId })
      .from(serviceTickets)
      .where(and(eq(serviceTickets.id, ticketId), eq(serviceTickets.tenantId, tenantId)));
    if (!ticket) {
      throw new BusinessError('NOT_FOUND', 'Ticket not found', 404);
    }

    // One invoice per ticket (MVP): a non-voided pos_invoices row for this ticket blocks a second.
    const [existing] = await tx
      .select({ id: posInvoices.id })
      .from(posInvoices)
      .where(and(
        eq(posInvoices.tenantId, tenantId),
        eq(posInvoices.serviceTicketId, ticketId),
        ne(posInvoices.status, 'voided')
      ));
    if (existing) {
      throw new BusinessError('TICKET_ALREADY_INVOICED', 'This ticket already has an invoice', 409);
    }

    // The customer snapshot: a service invoice is always for the ticket's customer,
    // so 'tempo' always has a real customer link (satisfies the tempo_requires_customer CHECK).
    const [customer] = await tx
      .select({ name: customers.name })
      .from(customers)
      .where(and(eq(customers.id, ticket.customerId), eq(customers.tenantId, tenantId)));

    // Select every charge, then keep only the billable ones (pure decision).
    const charges = await tx
      .select({
        id: ticketCharges.id,
        sourceType: ticketCharges.sourceType,
        status: ticketCharges.status,
        description: ticketCharges.description,
        inventoryItemId: ticketCharges.inventoryItemId,
        partBrandId: ticketCharges.partBrandId,
        quantity: ticketCharges.quantity,
        unitPrice: ticketCharges.unitPrice,
        unitCost: ticketCharges.unitCost,
      })
      .from(ticketCharges)
      .where(and(eq(ticketCharges.ticketId, ticketId), eq(ticketCharges.tenantId, tenantId)));

    const billable = charges.filter(isBillableCharge);
    if (billable.length === 0) {
      throw new BusinessError('NOTHING_TO_INVOICE', 'Ticket has no consumed parts or approved labor to invoice', 422);
    }

    const subtotal = roundMoney(
      billable.reduce((sum, c) => sum + c.quantity * parseFloat(c.unitPrice), 0)
    );
    const grandTotal = roundMoney(subtotal - input.discountAmount);
    const paymentStatus = input.paymentMethod === 'tempo' ? 'unpaid' : 'paid';

    // Tahap B — aturan uang tunai yang sama persis dengan checkout POS, lewat
    // helper murni yang sama (lib/cash.ts) supaya kedua jalur penagihan tidak
    // berselisih soal "kembalian" dan "uang kurang".
    const tender = evaluateCashTender({
      paymentMethod: input.paymentMethod,
      amountTendered: input.amountTendered,
      grandTotal,
    });
    if (!tender.ok) {
      throw new BusinessError(tender.code!, tender.message!, 422);
    }

    const invoiceNumber = await allocateInvoiceNumber(tx, tenantId);

    const [invoice] = await tx
      .insert(posInvoices)
      .values({
        tenantId,
        branchId: ticket.branchId,
        invoiceNumber,
        customerName: customer?.name ?? 'Pelanggan',
        customerId: ticket.customerId,
        serviceTicketId: ticketId,
        subtotal: toMoneyString(subtotal),
        discountAmount: toMoneyString(input.discountAmount),
        taxAmount: '0',
        grandTotal: toMoneyString(grandTotal),
        paymentStatus,
        amountPaid: paymentStatus === 'paid' ? toMoneyString(grandTotal) : '0',
        amountTendered: tender.amountTendered === null ? null : toMoneyString(tender.amountTendered),
        paymentMethod: input.paymentMethod,
        createdBy: userId,
      })
      .returning();

    // Insert lines. NO stock is touched — parts were already deducted at consumption.
    for (const c of billable) {
      const lineSubtotal = roundMoney(c.quantity * parseFloat(c.unitPrice));
      await tx.insert(posInvoiceLines).values({
        tenantId,
        posInvoiceId: invoice.id,
        sourceType: c.sourceType,
        description: c.description,
        inventoryItemId: c.sourceType === 'part' ? c.inventoryItemId : null,
        partBrandId: c.sourceType === 'part' ? c.partBrandId : null,
        quantity: c.quantity,
        unitPrice: c.unitPrice,
        subtotal: toMoneyString(lineSubtotal),
        // Record the already-known cost on part lines (historical fact); it does NOT
        // drive COGS here — that was posted at consumption. Labor/fee carry no cost.
        unitCost: c.sourceType === 'part' ? c.unitCost : null,
      });
    }

    // H13 — record the response as the last write inside this transaction.
    const responseEnvelope = buildSuccessEnvelope(invoice, undefined, requestId);
    await recordIdempotentResponse(tx, tenantId, idempotency, 201, responseEnvelope);

    return { invoice, branchId: ticket.branchId, grandTotal };
  });

  // H17/H11 — post-commit, best-effort, REVENUE ONLY (COGS already on the
  // consumption entries). A ledger failure must never roll back an issued invoice.
  emitEvent(AppEvent.TICKET_INVOICE_CREATED, {
    tenantId,
    branchId: result.branchId,
    invoiceId: result.invoice.id,
    grandTotal: result.grandTotal,
  });

  return result.invoice;
}

/**
 * F3 — SVC-013: cancel a ticket. Every 'estimated' or 'approved' charge is
 * marked 'cancelled' (job abandoned, per the chargeStatusEnum comment); any
 * 'approved' *part* charge additionally releases its H10 stock reservation
 * first, exactly like cancelCharge — this is what stops an abandoned ticket
 * from leaking a reservation forever. A 'consumed' part is NOT auto-returned
 * (that's a physical parts-return decision, not implied by cancelling the
 * job) — the caller gets a count so the UI can warn instead of staying silent.
 * No ledger event: no money moved by cancelling.
 */
export async function cancelTicket(
  tenantId: string,
  ticketId: string,
  reason: string,
  actorUserId: string
) {
  return db.transaction(async (tx) => {
    const [ticket] = await tx
      .select()
      .from(serviceTickets)
      .where(and(eq(serviceTickets.id, ticketId), eq(serviceTickets.tenantId, tenantId)))
      .for('update');
    if (!ticket) {
      throw new BusinessError('NOT_FOUND', 'Ticket not found', 404);
    }
    if (!canCancelTicket(ticket.status)) {
      throw new BusinessError(
        'TICKET_NOT_CANCELLABLE',
        `A ${ticket.status} ticket cannot be cancelled`,
        409
      );
    }

    const charges = await tx
      .select()
      .from(ticketCharges)
      .where(and(eq(ticketCharges.ticketId, ticketId), eq(ticketCharges.tenantId, tenantId)));

    let releasedPartsCount = 0;
    let consumedPartsLeftBehind = 0;

    for (const charge of charges) {
      if (charge.status === 'approved') {
        if (charge.sourceType === 'part') {
          await releaseReservation(tx, {
            tenantId,
            branchId: ticket.branchId,
            inventoryItemId: charge.inventoryItemId!,
            quantity: charge.quantity,
            referenceType: RESERVATION_REFERENCE_TYPE,
            referenceId: charge.id,
            serviceTicketId: ticketId,
          });
          releasedPartsCount++;
        }
        await tx.update(ticketCharges).set({ status: 'cancelled' }).where(eq(ticketCharges.id, charge.id));
      } else if (charge.status === 'estimated') {
        await tx.update(ticketCharges).set({ status: 'cancelled' }).where(eq(ticketCharges.id, charge.id));
      } else if (charge.status === 'consumed' && charge.sourceType === 'part') {
        consumedPartsLeftBehind++;
      }
    }

    const [updated] = await tx
      .update(serviceTickets)
      .set({ status: 'cancelled', closedAt: new Date() })
      .where(and(eq(serviceTickets.id, ticketId), eq(serviceTickets.tenantId, tenantId)))
      .returning();

    if (ticket.currentNodeId) {
      await tx.insert(ticketStageHistory).values({
        ticketId,
        nodeId: ticket.currentNodeId,
        actorId: actorUserId,
        notes: `Dibatalkan: ${reason}`,
      });
    }

    return { ...updated, releasedPartsCount, consumedPartsLeftBehind };
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
export async function consumeCharge(
  tenantId: string,
  ticketId: string,
  chargeId: string,
  idempotency?: IdempotencyRef,
  requestId?: string
) {
  const result = await db.transaction(async (tx) => {
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

    // H10 — release this charge's own hold before deducting. Must happen first:
    // consumeStock's sellable check would otherwise see this charge's own
    // reservation counted against itself.
    await releaseReservation(tx, {
      tenantId,
      branchId: ticket.branchId,
      inventoryItemId: charge.inventoryItemId!,
      quantity: charge.quantity,
      referenceType: RESERVATION_REFERENCE_TYPE,
      referenceId: charge.id,
      serviceTicketId: ticketId,
    });

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

    // H13 — recorded as the last write inside this same transaction, so a
    // rollback anywhere above discards the key too.
    await recordIdempotentResponse(tx, tenantId, idempotency, 200, buildSuccessEnvelope(updated, undefined, requestId));

    return { updated, branchId: ticket.branchId };
  });

  // H11 — post-commit, best-effort. See ledger.ts subscribeLedger for why a
  // posting failure here can never surface back to the caller.
  emitEvent(AppEvent.TICKET_PART_CONSUMED, {
    tenantId,
    branchId: result.branchId,
    chargeId: result.updated.id,
    unitCost: result.updated.unitCost ?? 0,
    quantity: result.updated.quantity,
  });

  return result.updated;
}

/**
 * H9 — undo a consumption: a part that was fitted then removed. Restores the
 * exact batches it came from (via the stock_movements trail left by consumeStock,
 * not a fresh FIFO pick) and flips the charge back to 'approved'. Mirrors the POS
 * void guard (3.5B.5): restored quantity may never exceed a batch's
 * quantityReceived, and a charge can only be returned once.
 *
 * H10 — 'approved' is a reserved state (see generateQuotation), so a return must
 * re-establish the reservation it released on consume, or the part sits back on
 * the shelf "approved" for this ticket but sellable to a walk-in.
 */
export async function returnCharge(tenantId: string, ticketId: string, chargeId: string) {
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

    await reserveStock(tx, {
      tenantId,
      branchId: ticket.branchId,
      inventoryItemId: charge.inventoryItemId!,
      quantity: charge.quantity,
      referenceType: RESERVATION_REFERENCE_TYPE,
      referenceId: charge.id,
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

/**
 * H10 — cancel an approved charge: the job no longer needs this part/labor/fee
 * before it was consumed. Releases the reservation (part charges only — labor/fee
 * never held one). Deliberately scoped to 'approved' only: an 'estimated' charge
 * is removed via DELETE (never reserved, nothing to release), and a 'consumed'
 * charge must go through returnCharge first (physical stock has to come back
 * before the charge can be cancelled).
 */
export async function cancelCharge(tenantId: string, ticketId: string, chargeId: string) {
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
    if (charge.status === 'consumed') {
      throw new BusinessError('CHARGE_CONSUMED', 'A consumed charge must be returned before it can be cancelled', 409);
    }
    if (charge.status !== 'approved') {
      throw new BusinessError(
        'CANNOT_CANCEL',
        'Only an approved charge can be cancelled (an estimated charge can be deleted)',
        409
      );
    }

    if (charge.sourceType === 'part') {
      await releaseReservation(tx, {
        tenantId,
        branchId: ticket.branchId,
        inventoryItemId: charge.inventoryItemId!,
        quantity: charge.quantity,
        referenceType: RESERVATION_REFERENCE_TYPE,
        referenceId: charge.id,
        serviceTicketId: ticketId,
      });
    }

    const [updated] = await tx
      .update(ticketCharges)
      .set({ status: 'cancelled' })
      .where(eq(ticketCharges.id, chargeId))
      .returning();

    // Safe to recompute approvedTotal here (unlike addCharge/updateCharge/deleteCharge,
    // which must never write it — see recomputeAndPersistTotals): a charge can only
    // reach 'approved' via generateQuotation, which already made approvedTotal
    // non-null, so isQuoted's `approvedTotal != null` check on the frontend can't
    // regress from this write.
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
      .set({ approvedTotal: toMoneyString(totals.approved) })
      .where(and(eq(serviceTickets.id, ticketId), eq(serviceTickets.tenantId, tenantId)));

    return updated;
  });
}

/**
 * Tahap A — go-live gap Tier-1 #2/#3. Set/clear sandi-pola and/or the
 * reported complaint. Both are captured at intake but editable at any time
 * afterward (correcting a typo; clearing sandi/pola once it's been handed
 * back at QC Akhir). Only keys actually present in `input` are written —
 * `updateIntakeDetailsInput`'s `.optional()` makes "not sent" different from
 * "sent as null".
 */
export async function updateIntakeDetails(
  tenantId: string,
  ticketId: string,
  input: UpdateIntakeDetailsInput
) {
  const patch: Record<string, unknown> = {};
  if ('devicePasscode' in input) patch.devicePasscode = input.devicePasscode;
  if ('reportedComplaint' in input) patch.reportedComplaint = input.reportedComplaint;
  // Tahap B — hasil diagnosa teknisi + estimasi lama pengerjaan.
  if ('diagnosis' in input) patch.diagnosis = input.diagnosis;
  if ('estimatedDurationMinutes' in input) patch.estimatedDurationMinutes = input.estimatedDurationMinutes;

  // Drizzle melempar pada `.set({})`. Body tanpa satu pun field yang dikenali
  // adalah no-op, bukan error 500 — kembalikan keadaan tiket apa adanya.
  if (Object.keys(patch).length === 0) {
    const [current] = await db
      .select({
        id: serviceTickets.id,
        devicePasscode: serviceTickets.devicePasscode,
        reportedComplaint: serviceTickets.reportedComplaint,
        diagnosis: serviceTickets.diagnosis,
        estimatedDurationMinutes: serviceTickets.estimatedDurationMinutes,
      })
      .from(serviceTickets)
      .where(and(eq(serviceTickets.id, ticketId), eq(serviceTickets.tenantId, tenantId)));
    if (!current) throw new BusinessError('NOT_FOUND', 'Ticket not found', 404);
    return current;
  }

  const [updated] = await db
    .update(serviceTickets)
    .set(patch)
    .where(and(eq(serviceTickets.id, ticketId), eq(serviceTickets.tenantId, tenantId)))
    .returning({
      id: serviceTickets.id,
      devicePasscode: serviceTickets.devicePasscode,
      reportedComplaint: serviceTickets.reportedComplaint,
      diagnosis: serviceTickets.diagnosis,
      estimatedDurationMinutes: serviceTickets.estimatedDurationMinutes,
    });
  if (!updated) {
    throw new BusinessError('NOT_FOUND', 'Ticket not found', 404);
  }
  return updated;
}

/**
 * Tahap A — go-live gap Tier-1 #3 ("nota selesai"). The one non-voided
 * pos_invoice already linked to this ticket (H17's generateTicketInvoice
 * creates exactly this link), if any — lets the ticket detail page surface a
 * "Cetak Nota" button once an invoice exists, without the frontend having to
 * remember the id from the moment it was created (which doesn't survive a
 * page reload).
 */
export async function findActiveInvoiceForTicket(tenantId: string, ticketId: string) {
  const [invoice] = await db
    .select({
      id: posInvoices.id,
      invoiceNumber: posInvoices.invoiceNumber,
      paymentStatus: posInvoices.paymentStatus,
    })
    .from(posInvoices)
    .where(and(
      eq(posInvoices.tenantId, tenantId),
      eq(posInvoices.serviceTicketId, ticketId),
      ne(posInvoices.status, 'voided')
    ));
  return invoice ?? null;
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
