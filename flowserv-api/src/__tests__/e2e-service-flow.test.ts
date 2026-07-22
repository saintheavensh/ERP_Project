/**
 * H15 — End-to-end verification (the original Phase 3E).
 *
 * Walks one repair from intake to close through the real HTTP routes (via
 * Hono's app.request(), no listening socket needed) against a real Postgres
 * database — not mocked, not a pure-function unit test like every other test
 * in this repo. This is the first test that proves H6–H14 actually compose,
 * not just that each one works in isolation.
 *
 * Run via `npm run test:e2e` (flowserv-api/scripts/test-e2e.mjs), which resets,
 * pushes, and reseeds DATABASE_URL_TEST before invoking vitest — never run this
 * file directly against the dev database.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { eq, and, inArray } from 'drizzle-orm';

// Independent safety net: even if this file is somehow run without going
// through scripts/test-e2e.mjs, refuse to touch anything that isn't
// obviously the dedicated test database. scripts/test-e2e.mjs is what
// actually points DATABASE_URL at DATABASE_URL_TEST (as an env var on this
// process, set before vitest even starts) — this just double-checks it.
const dbUrl = process.env.DATABASE_URL ?? '';
if (!dbUrl.includes('flowserv_test')) {
  throw new Error(
    'e2e-service-flow.test.ts must run against the dedicated e2e test database ' +
    '(a DATABASE_URL containing "flowserv_test"). Run it via `npm run test:e2e`, ' +
    'not `vitest run` directly — refusing to risk touching the dev database.'
  );
}

import { app } from '../app';
import { db } from '../db/connection';
import {
  serviceTickets,
  stockBatches,
  stockLevels,
  stockMovements,
  ticketCharges,
  financeLedgerEntries,
  posInvoices,
} from '../db/schema';
import { IDS } from '../db/seed/ids';

type ApiResult<T = any> = { status: number; body: { data: T; error: { code: string; message: string } | null } };

async function api<T = any>(
  method: string,
  path: string,
  opts: { token?: string; body?: unknown; idempotencyKey?: string } = {}
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;
  const res = await app.request(`http://localhost${path}`, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

/** Ledger entries are posted via a fire-and-forget event emit (H11) — poll
 * briefly rather than assuming the write has landed by the time the HTTP
 * response comes back. */
async function waitFor<T>(fn: () => Promise<T | null>, timeoutMs = 3000, intervalMs = 50): Promise<T> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const result = await fn();
    if (result) return result;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error('waitFor: condition never became true within timeout');
}

const roundMoney = (n: number) => Math.round(n * 100) / 100;

describe('H15 — end-to-end service flow: intake to close', () => {
  let token: string;
  let ticketId: string;

  // Chosen so quantity 7 forces the exact FIFO split H9 already proved
  // (5 @ Rp150.000 from batchLcdOld + 2 @ Rp165.000 from batchLcdNew):
  // the one case that actually exercises FIFO across two batches.
  const LCD_QTY = 7;
  const LCD_UNIT_PRICE = 220000;
  const STOKSATU_QTY = 1;
  const STOKSATU_UNIT_PRICE = 350000;
  const LABOR_UNIT_PRICE = 150000;

  let lcdChargeId: string;
  let stokSatuChargeId: string;
  let laborChargeId: string;

  beforeAll(async () => {
    const login = await api('POST', '/v1/auth/login', {
      body: { email: 'admin@demo.com', password: 'admin123' },
    });
    expect(login.status).toBe(200);
    token = login.body.data.token;
  });

  it('creates a ticket via intake — flow engine start node', async () => {
    const res = await api('POST', '/v1/tickets/intake', {
      token,
      body: {
        customerId: IDS.customerBudi,
        assetId: IDS.assetBudiHp,
        flowTemplateId: IDS.flowTemplate,
        branchId: IDS.branchPusat,
      },
    });
    expect(res.status).toBe(201);
    expect(res.body.data.currentNodeId).toBe(IDS.nodeIntake);
    expect(res.body.data.status).toBe('open');
    ticketId = res.body.data.id;
  });

  // Negative path 1/4: a transition the flow template forbids.
  it('NEGATIVE: rejects a transition the flow template does not allow (409)', async () => {
    const res = await api('POST', `/v1/tickets/${ticketId}/transition`, {
      token,
      body: { targetNodeId: IDS.nodeRepair }, // Intake -> Repair has no transition row
    });
    expect(res.status).toBe(409);
    expect(res.body.error?.code).toBe('TRANSITION_NOT_ALLOWED');
  });

  it('transitions Intake -> Diagnosis', async () => {
    const res = await api('POST', `/v1/tickets/${ticketId}/transition`, {
      token,
      body: { targetNodeId: IDS.nodeDiagnosis },
    });
    expect(res.status).toBe(200);

    const detail = await api('GET', `/v1/tickets/${ticketId}`, { token });
    expect(detail.body.data.ticket.currentNodeId).toBe(IDS.nodeDiagnosis);
    expect(detail.body.data.history.map((h: any) => h.nodeName)).toEqual(
      expect.arrayContaining(['Intake', 'Diagnosis'])
    );
  });

  it('assigns a technician', async () => {
    const res = await api('POST', `/v1/tickets/${ticketId}/assign`, {
      token,
      body: { technicianId: IDS.userTechnician },
    });
    expect(res.status).toBe(200);
    expect(res.body.data.assignedTechnicianId).toBe(IDS.userTechnician);
  });

  it('adds two part charges and one labor charge (diagnosis + estimation)', async () => {
    const lcd = await api('POST', `/v1/tickets/${ticketId}/charges`, {
      token,
      body: {
        sourceType: 'part',
        inventoryItemId: IDS.itemLcdMultiBatch,
        partBrandId: IDS.partBrandIncell, // must match the seeded batches' brand
        quantity: LCD_QTY,
        unitPrice: LCD_UNIT_PRICE,
      },
    });
    expect(lcd.status).toBe(201);
    lcdChargeId = lcd.body.data.id;

    const stokSatu = await api('POST', `/v1/tickets/${ticketId}/charges`, {
      token,
      body: {
        sourceType: 'part',
        inventoryItemId: IDS.itemStokSatu,
        partBrandId: IDS.partBrandOem,
        quantity: STOKSATU_QTY,
        unitPrice: STOKSATU_UNIT_PRICE,
      },
    });
    expect(stokSatu.status).toBe(201);
    stokSatuChargeId = stokSatu.body.data.id;

    const labor = await api('POST', `/v1/tickets/${ticketId}/charges`, {
      token,
      body: { sourceType: 'labor', description: 'Jasa Servis Umum', quantity: 1, unitPrice: LABOR_UNIT_PRICE },
    });
    expect(labor.status).toBe(201);
    laborChargeId = labor.body.data.id;

    const detail = await api('GET', `/v1/tickets/${ticketId}`, { token });
    const expectedEstimated = roundMoney(
      LCD_QTY * LCD_UNIT_PRICE + STOKSATU_QTY * STOKSATU_UNIT_PRICE + LABOR_UNIT_PRICE
    );
    expect(Number(detail.body.data.ticket.estimatedTotal)).toBe(expectedEstimated);
  });

  // Negative path 2/4: consuming before the customer has approved the quote.
  it('NEGATIVE: rejects consuming a part before it is approved (409)', async () => {
    const res = await api('POST', `/v1/tickets/${ticketId}/charges/${lcdChargeId}/consume`, { token });
    expect(res.status).toBe(409);
    expect(res.body.error?.code).toBe('CHARGE_NOT_APPROVED');
  });

  it('transitions Diagnosis -> Waiting Approval', async () => {
    const res = await api('POST', `/v1/tickets/${ticketId}/transition`, {
      token,
      body: { targetNodeId: IDS.nodeApproval },
    });
    expect(res.status).toBe(200);
  });

  it('generates the quotation: estimated charges -> approved, parts reserved (H10)', async () => {
    const before = await db
      .select({ quantityAvailable: stockLevels.quantityAvailable, quantityReserved: stockLevels.quantityReserved })
      .from(stockLevels)
      .where(and(eq(stockLevels.tenantId, IDS.tenantMain), eq(stockLevels.inventoryItemId, IDS.itemStokSatu)));
    expect(before[0].quantityReserved).toBe(0);

    const res = await api('POST', `/v1/tickets/${ticketId}/quotation`, { token });
    expect(res.status).toBe(201);
    const expectedApproved = roundMoney(
      LCD_QTY * LCD_UNIT_PRICE + STOKSATU_QTY * STOKSATU_UNIT_PRICE + LABOR_UNIT_PRICE
    );
    expect(Number(res.body.data.approvalRequest.amount)).toBe(expectedApproved);
    expect(Number(res.body.data.approvedTotal)).toBe(expectedApproved);

    const after = await db
      .select({ quantityAvailable: stockLevels.quantityAvailable, quantityReserved: stockLevels.quantityReserved })
      .from(stockLevels)
      .where(and(eq(stockLevels.tenantId, IDS.tenantMain), eq(stockLevels.inventoryItemId, IDS.itemStokSatu)));
    // Invariant: reservation claims stock without moving it — available stays put.
    expect(after[0].quantityAvailable).toBe(1);
    expect(after[0].quantityReserved).toBe(1);

    const lcdLevel = await db
      .select({ quantityReserved: stockLevels.quantityReserved })
      .from(stockLevels)
      .where(and(eq(stockLevels.tenantId, IDS.tenantMain), eq(stockLevels.inventoryItemId, IDS.itemLcdMultiBatch)));
    expect(lcdLevel[0].quantityReserved).toBe(LCD_QTY);
  });

  // Negative path 3/4 — the key cross-check named in the task file: a part
  // reserved for this ticket must not be sellable to a walk-in POS customer.
  it('NEGATIVE: rejects a POS sale of the now-reserved single-unit part (422)', async () => {
    const res = await api('POST', '/v1/pos/invoices', {
      token,
      body: {
        branchId: IDS.branchPusat,
        paymentMethod: 'cash',
        items: [
          { sourceType: 'part', inventoryItemId: IDS.itemStokSatu, partBrandId: IDS.partBrandOem, quantity: 1, unitPrice: STOKSATU_UNIT_PRICE },
        ],
      },
    });
    expect(res.status).toBe(422);
    expect(res.body.error?.code).toBe('INSUFFICIENT_SELLABLE');
  });

  it('transitions Waiting Approval -> Repair', async () => {
    const res = await api('POST', `/v1/tickets/${ticketId}/transition`, {
      token,
      body: { targetNodeId: IDS.nodeRepair },
    });
    expect(res.status).toBe(200);
  });

  it('consumes both part charges: FIFO deduction with true cost, stock and reservation move together', async () => {
    const batchesBefore = await db
      .select({ id: stockBatches.id, quantityRemaining: stockBatches.quantityRemaining })
      .from(stockBatches)
      .where(eq(stockBatches.inventoryItemId, IDS.itemLcdMultiBatch));
    const totalRemainingBefore = batchesBefore.reduce((s, b) => s + b.quantityRemaining, 0);
    expect(totalRemainingBefore).toBe(30); // 5 + 5 + 20, per seed

    // --- LCD part: exercises the FIFO split across two batches ---
    const lcdConsume = await api('POST', `/v1/tickets/${ticketId}/charges/${lcdChargeId}/consume`, { token });
    expect(lcdConsume.status).toBe(200);
    expect(lcdConsume.body.data.status).toBe('consumed');
    const lcdUnitCost = Number(lcdConsume.body.data.unitCost);
    // 5@150.000 + 2@165.000 = 1.080.000 / 7 — the exact split H9 proved.
    expect(lcdUnitCost).toBeCloseTo(154285.71, 2);

    const [batchOld] = await db.select({ quantityRemaining: stockBatches.quantityRemaining }).from(stockBatches).where(eq(stockBatches.id, IDS.batchLcdOld));
    const [batchNew] = await db.select({ quantityRemaining: stockBatches.quantityRemaining }).from(stockBatches).where(eq(stockBatches.id, IDS.batchLcdNew));
    const [batchPo] = await db.select({ quantityRemaining: stockBatches.quantityRemaining }).from(stockBatches).where(eq(stockBatches.id, IDS.batchLcdPo));
    expect(batchOld.quantityRemaining).toBe(0); // fully consumed (was 5)
    expect(batchNew.quantityRemaining).toBe(3); // 5 - 2
    expect(batchPo.quantityRemaining).toBe(20); // untouched — FIFO order held

    // --- StokSatu part: the single unit that was blocked from sale above ---
    const stokSatuConsume = await api('POST', `/v1/tickets/${ticketId}/charges/${stokSatuChargeId}/consume`, { token });
    expect(stokSatuConsume.status).toBe(200);
    expect(Number(stokSatuConsume.body.data.unitCost)).toBe(200000);

    // Invariant: stock decreased by EXACTLY the consumed quantity (7 + 1 = 8).
    const batchesAfter = await db
      .select({ quantityRemaining: stockBatches.quantityRemaining })
      .from(stockBatches)
      .where(eq(stockBatches.inventoryItemId, IDS.itemLcdMultiBatch));
    const totalRemainingAfter = batchesAfter.reduce((s, b) => s + b.quantityRemaining, 0);
    expect(totalRemainingBefore - totalRemainingAfter).toBe(LCD_QTY);

    const [stokSatuBatch] = await db.select({ quantityRemaining: stockBatches.quantityRemaining }).from(stockBatches).where(eq(stockBatches.id, IDS.batchStokSatu));
    expect(stokSatuBatch.quantityRemaining).toBe(0);

    // Invariant: quantityReserved returns to 0 after consumption, for both items.
    const [lcdLevel] = await db.select({ quantityReserved: stockLevels.quantityReserved, quantityAvailable: stockLevels.quantityAvailable }).from(stockLevels).where(and(eq(stockLevels.tenantId, IDS.tenantMain), eq(stockLevels.inventoryItemId, IDS.itemLcdMultiBatch)));
    expect(lcdLevel.quantityReserved).toBe(0);
    expect(lcdLevel.quantityAvailable).toBe(23); // 30 - 7

    const [stokSatuLevel] = await db.select({ quantityReserved: stockLevels.quantityReserved, quantityAvailable: stockLevels.quantityAvailable }).from(stockLevels).where(and(eq(stockLevels.tenantId, IDS.tenantMain), eq(stockLevels.inventoryItemId, IDS.itemStokSatu)));
    expect(stokSatuLevel.quantityReserved).toBe(0);
    expect(stokSatuLevel.quantityAvailable).toBe(0);
  });

  it('COGS ledger entries match the actual batch costs consumed (independent cross-check)', async () => {
    const entries = await waitFor(async () => {
      const rows = await db
        .select()
        .from(financeLedgerEntries)
        .where(
          and(
            eq(financeLedgerEntries.entryType, 'cogs'),
            eq(financeLedgerEntries.referenceType, 'ticket_consumption'),
            inArray(financeLedgerEntries.referenceId, [lcdChargeId, stokSatuChargeId])
          )
        );
      return rows.length === 2 ? rows : null;
    });

    const postedCogs = entries.reduce((s, e) => s + Number(e.amount), 0);

    // Independently recompute "true" cost by joining stock_movements -> stock_batches
    // for this ticket's own consumption — the same method H11's backfill script
    // uses, deliberately NOT the same code path that produced the ledger entry.
    const movements = await db
      .select({ quantity: stockMovements.quantity, batchId: stockMovements.stockBatchId })
      .from(stockMovements)
      .where(eq(stockMovements.referenceType, 'ticket_consumption'));
    let independentCost = 0;
    for (const mov of movements) {
      const [batch] = await db.select({ unitCost: stockBatches.unitCost }).from(stockBatches).where(eq(stockBatches.id, mov.batchId!));
      independentCost += Math.abs(mov.quantity) * Number(batch.unitCost);
    }

    // True cost, computed from batch unit costs directly (no per-unit rounding):
    // LCD: 5*150.000 + 2*165.000 = 1.080.000. StokSatu: 1*200.000 = 200.000.
    expect(independentCost).toBe(1_080_000 + 200_000);
    // The ledger's posted amount goes through a rounded per-unit unitCost first
    // (154285.71 * 7 = 1.079.999,97), so it is a few cents off the true batch
    // sum — expected float/rounding noise (lib/money.ts), not a bug. Still
    // within a few cents of the independently-computed true cost.
    expect(postedCogs).toBeCloseTo(independentCost, 0);
  });

  it('transitions Repair -> Completion: terminal node closes the ticket', async () => {
    const res = await api('POST', `/v1/tickets/${ticketId}/transition`, {
      token,
      body: { targetNodeId: IDS.nodeCompletion },
    });
    expect(res.status).toBe(200);

    const [ticket] = await db.select().from(serviceTickets).where(eq(serviceTickets.id, ticketId));
    expect(ticket.status).toBe('closed');
    expect(ticket.closedAt).not.toBeNull();
    expect(ticket.currentNodeId).toBe(IDS.nodeCompletion);
  });

  it('ticket margin = revenue - COGS, and it is positive (the question the app exists to answer)', async () => {
    const res = await api('GET', `/v1/tickets/${ticketId}/charges`, { token });
    const { margin } = res.body.data;
    const expectedRevenue = roundMoney(LCD_QTY * LCD_UNIT_PRICE + STOKSATU_QTY * STOKSATU_UNIT_PRICE + LABOR_UNIT_PRICE);
    expect(margin.revenue).toBe(expectedRevenue);
    expect(margin.cost).toBeGreaterThan(0);
    expect(margin.margin).toBe(roundMoney(margin.revenue - margin.cost));
    expect(margin.margin).toBeGreaterThan(0);
  });

  // ==========================================================================
  // Invoice + payment — via the H17 service-invoice-from-ticket path (SBL-003).
  //
  // H15 discovered that there was no way to bill an already-consumed ticket
  // part: POS checkout's only 'part'-line mechanism is consumeStock() (FIFO
  // deduction), so billing the ticket's parts through checkout DOUBLE-deducts
  // stock. H17 fixed it with POST /v1/tickets/:id/invoice, which bills the
  // consumed parts + approved labor WITHOUT re-running FIFO. This section
  // proves the whole repair (parts + labor) now invoices correctly — closing
  // H15 gap (a): ledger revenue = full-repair invoice grandTotal.
  // ==========================================================================

  let invoiceId: string;
  const EXPECTED_REPAIR_TOTAL = roundMoney(
    LCD_QTY * LCD_UNIT_PRICE + STOKSATU_QTY * STOKSATU_UNIT_PRICE + LABOR_UNIT_PRICE
  );

  it('H17: invoices the full repair (2 consumed parts + labor) with NO stock re-deduction', async () => {
    // Stock is already gone (consumed above); invoicing must not touch it again.
    const lcdBefore = await db.select({ quantityAvailable: stockLevels.quantityAvailable }).from(stockLevels).where(and(eq(stockLevels.tenantId, IDS.tenantMain), eq(stockLevels.inventoryItemId, IDS.itemLcdMultiBatch)));
    const stokSatuBefore = await db.select({ quantityAvailable: stockLevels.quantityAvailable }).from(stockLevels).where(and(eq(stockLevels.tenantId, IDS.tenantMain), eq(stockLevels.inventoryItemId, IDS.itemStokSatu)));
    expect(lcdBefore[0].quantityAvailable).toBe(23);
    expect(stokSatuBefore[0].quantityAvailable).toBe(0);

    const res = await api('POST', `/v1/tickets/${ticketId}/invoice`, {
      token,
      body: { paymentMethod: 'tempo' },
    });
    expect(res.status).toBe(201);
    expect(res.body.data.serviceTicketId).toBe(ticketId);
    expect(res.body.data.paymentStatus).toBe('unpaid');
    // The whole repair: both consumed parts AND the labor line.
    expect(Number(res.body.data.grandTotal)).toBe(EXPECTED_REPAIR_TOTAL);
    invoiceId = res.body.data.id;

    // The core H17 invariant: NO second deduction — both items unchanged.
    const lcdAfter = await db.select({ quantityAvailable: stockLevels.quantityAvailable }).from(stockLevels).where(and(eq(stockLevels.tenantId, IDS.tenantMain), eq(stockLevels.inventoryItemId, IDS.itemLcdMultiBatch)));
    const stokSatuAfter = await db.select({ quantityAvailable: stockLevels.quantityAvailable }).from(stockLevels).where(and(eq(stockLevels.tenantId, IDS.tenantMain), eq(stockLevels.inventoryItemId, IDS.itemStokSatu)));
    expect(lcdAfter[0].quantityAvailable).toBe(23);
    expect(stokSatuAfter[0].quantityAvailable).toBe(0);

    const recon = await api('GET', '/v1/inventory/reconciliation', { token });
    expect(recon.body.data.isClean).toBe(true);
  });

  it('H17 guard: a second invoice for the same ticket is rejected (409)', async () => {
    const res = await api('POST', `/v1/tickets/${ticketId}/invoice`, {
      token,
      body: { paymentMethod: 'cash' },
    });
    expect(res.status).toBe(409);
    expect(res.body.error?.code).toBe('TICKET_ALREADY_INVOICED');
  });

  // Negative path 4/4: overpayment against the repair invoice.
  it('NEGATIVE: rejects an overpayment against the repair invoice (422)', async () => {
    const res = await api('POST', `/v1/pos/invoices/${invoiceId}/payments`, {
      token,
      body: { amount: EXPECTED_REPAIR_TOTAL + 1, method: 'cash' },
    });
    expect(res.status).toBe(422);
    expect(res.body.error?.code).toBe('OVERPAYMENT');
  });

  it('settles the repair invoice in full', async () => {
    const res = await api('POST', `/v1/pos/invoices/${invoiceId}/payments`, {
      token,
      body: { amount: EXPECTED_REPAIR_TOTAL, method: 'cash' },
    });
    expect(res.status).toBe(201);
    expect(res.body.data.invoice.paymentStatus).toBe('paid');
  });

  it('H15 gap (a) CLOSED: ledger revenue = full-repair invoice grandTotal, COGS not double-counted', async () => {
    await waitFor(async () => {
      const rows = await db.select().from(financeLedgerEntries).where(
        and(eq(financeLedgerEntries.entryType, 'revenue'), eq(financeLedgerEntries.referenceId, invoiceId))
      );
      return rows.length > 0 ? rows : null;
    });

    // Revenue for the invoice = its grand total (the whole repair, not just labor).
    const revenueEntries = await db.select().from(financeLedgerEntries).where(
      and(eq(financeLedgerEntries.entryType, 'revenue'), eq(financeLedgerEntries.referenceId, invoiceId))
    );
    const totalRevenue = revenueEntries.reduce((s, e) => s + Number(e.amount), 0);
    expect(totalRevenue).toBe(EXPECTED_REPAIR_TOTAL);

    // COGS was posted ONCE, at consumption (referenceType 'ticket_consumption'),
    // and the invoice added none — exactly 2 consumption COGS entries (one per
    // consumed part), zero COGS on the invoice's referenceId.
    const consumptionCogs = await db.select().from(financeLedgerEntries).where(
      and(eq(financeLedgerEntries.entryType, 'cogs'), eq(financeLedgerEntries.referenceType, 'ticket_consumption'))
    );
    expect(consumptionCogs).toHaveLength(2);
    const invoiceCogs = await db.select().from(financeLedgerEntries).where(
      and(eq(financeLedgerEntries.entryType, 'cogs'), eq(financeLedgerEntries.referenceId, invoiceId))
    );
    expect(invoiceCogs).toHaveLength(0);

    // The full-repair margin the app exists to answer: revenue − COGS, positive.
    const totalCogs = consumptionCogs.reduce((s, e) => s + Number(e.amount), 0);
    expect(totalRevenue - totalCogs).toBeGreaterThan(0);

    const reconcile = await api('GET', '/v1/finance/ledger/reconcile', { token });
    expect(reconcile.status).toBe(200);
    expect(reconcile.body.data.isClean).toBe(true);
    expect(reconcile.body.data.gaps).toEqual([]);
  });

  it('stock reconciliation reports zero drift after the full flow', async () => {
    const res = await api('GET', '/v1/inventory/reconciliation', { token });
    expect(res.status).toBe(200);
    expect(res.body.data.isClean).toBe(true);
    expect(res.body.data.drift).toEqual([]);
  });
});
