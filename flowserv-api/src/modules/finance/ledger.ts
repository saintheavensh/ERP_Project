import { db } from '../../db/connection';
import { financeLedgerEntries } from '../../db/schema';
import { onEvent, AppEvent } from '../../services/event-bus';
import { toMoneyString, roundMoney } from '../../lib/money';

export type LedgerEntryType = 'cogs' | 'revenue' | 'adjustment' | 'loss';

export interface LedgerEntryInput {
  tenantId: string;
  branchId: string;
  entryType: LedgerEntryType;
  /** Signed — a reversal is the negative of the entry it reverses. */
  amount: number;
  referenceType: string;
  referenceId: string;
}

export interface SaleInvoiceForLedger {
  id: string;
  tenantId: string;
  branchId: string;
  grandTotal: string | number;
}

export interface SaleLineForLedger {
  sourceType: 'part' | 'labor' | 'fee' | 'discount';
  quantity: number;
  unitCost: string | number | null;
}

/**
 * Pure — no database. Builds the matched revenue/COGS pair for a completed
 * sale (H11 Design: "Each sale posts a matched pair, which is what makes the
 * ledger checkable"). COGS only ever covers 'part' lines — labor/fee lines
 * are pure revenue with no cost behind them, which is where the shop's
 * margin actually shows up.
 */
export function buildSaleEntries(invoice: SaleInvoiceForLedger, lines: SaleLineForLedger[]): LedgerEntryInput[] {
  const entries: LedgerEntryInput[] = [
    {
      tenantId: invoice.tenantId,
      branchId: invoice.branchId,
      entryType: 'revenue',
      amount: roundMoney(Number(invoice.grandTotal)),
      referenceType: 'pos_sale',
      referenceId: invoice.id,
    },
  ];

  const cogs = roundMoney(
    lines
      .filter((line) => line.sourceType === 'part' && line.unitCost != null)
      .reduce((sum, line) => sum + Number(line.unitCost) * line.quantity, 0)
  );

  if (cogs > 0) {
    entries.push({
      tenantId: invoice.tenantId,
      branchId: invoice.branchId,
      entryType: 'cogs',
      amount: cogs,
      referenceType: 'pos_sale',
      referenceId: invoice.id,
    });
  }

  return entries;
}

/**
 * Pure — no database. Reversal entries that net a voided sale's original
 * entries to zero. Kept on the SAME referenceType/referenceId as the
 * original (not a distinct 'void_pos' reference) so summing by referenceId
 * alone proves the invoice nets to zero — that sum is exactly what
 * /reconcile checks.
 */
export function buildVoidReversalEntries(invoice: SaleInvoiceForLedger, lines: SaleLineForLedger[]): LedgerEntryInput[] {
  return buildSaleEntries(invoice, lines).map((entry) => ({ ...entry, amount: -entry.amount }));
}

export interface TicketConsumptionForLedger {
  tenantId: string;
  branchId: string;
  chargeId: string;
  unitCost: string | number;
  quantity: number;
}

/**
 * Pure — no database. A part consumed straight off a ticket (H9) posts COGS
 * with no matching revenue entry here — revenue for that ticket, if any, is
 * recognized separately when a POS invoice is issued (buildSaleEntries).
 * This is cost tracking against the ticket's margin, not a sale event.
 */
export function buildTicketCogsEntry(params: TicketConsumptionForLedger): LedgerEntryInput[] {
  const amount = roundMoney(Number(params.unitCost) * params.quantity);
  if (amount <= 0) return [];
  return [
    {
      tenantId: params.tenantId,
      branchId: params.branchId,
      entryType: 'cogs',
      amount,
      referenceType: 'ticket_consumption',
      referenceId: params.chargeId,
    },
  ];
}

export interface SupplierInvoiceForLedger {
  tenantId: string;
  branchId: string;
  invoiceId: string;
  totalAmount: string | number;
}

/**
 * Pure — no database. A supplier invoice increases what the shop owes.
 * Posted as 'adjustment', not a new entryType: this ledger is deliberately a
 * simple typed ledger, not a chart-of-accounts liability account (see
 * PHASES.md Architecture Debt and this task's "Watch out" — resist scope
 * creep). `supplierInvoices`/`supplierPayments` remain the source of truth
 * for AP balance; this entry only makes the movement visible in one ledger view.
 */
export function buildApInvoiceEntry(params: SupplierInvoiceForLedger): LedgerEntryInput[] {
  const amount = roundMoney(Number(params.totalAmount));
  if (amount <= 0) return [];
  return [
    {
      tenantId: params.tenantId,
      branchId: params.branchId,
      entryType: 'adjustment',
      amount,
      referenceType: 'supplier_invoice',
      referenceId: params.invoiceId,
    },
  ];
}

export interface SupplierPaymentForLedger {
  tenantId: string;
  branchId: string;
  invoiceId: string;
  amount: string | number;
}

/**
 * Pure — no database. Settling AP is the inverse movement of
 * buildApInvoiceEntry, kept on the same referenceId so summing nets to the
 * remaining balance.
 */
export function buildApSettlementEntry(params: SupplierPaymentForLedger): LedgerEntryInput[] {
  const amount = roundMoney(Number(params.amount));
  if (amount <= 0) return [];
  return [
    {
      tenantId: params.tenantId,
      branchId: params.branchId,
      entryType: 'adjustment',
      amount: -amount,
      referenceType: 'supplier_invoice',
      referenceId: params.invoiceId,
    },
  ];
}

// ============================================================================
// Event subscriptions — DB writes. Registered once at startup (index.ts).
// Every emit site fires AFTER its owning transaction has already committed —
// a ledger failure here must never be able to roll back a completed sale,
// consumption, or payment. That gap is exactly why the backfill script and
// /reconcile exist: a crash between commit and post is recoverable, not silent.
// ============================================================================

async function insertEntries(entries: LedgerEntryInput[]) {
  if (entries.length === 0) return;
  await db.insert(financeLedgerEntries).values(
    entries.map((entry) => ({
      tenantId: entry.tenantId,
      branchId: entry.branchId,
      entryType: entry.entryType,
      amount: toMoneyString(entry.amount),
      referenceType: entry.referenceType,
      referenceId: entry.referenceId,
    }))
  );
}

export interface PosSaleCompletedPayload {
  invoice: SaleInvoiceForLedger;
  lines: SaleLineForLedger[];
}

export type PosSaleVoidedPayload = PosSaleCompletedPayload;
export type TicketPartConsumedPayload = TicketConsumptionForLedger;
export type SupplierInvoiceCreatedPayload = SupplierInvoiceForLedger;
export type SupplierPaymentRecordedPayload = SupplierPaymentForLedger;

async function postSaleEntries(payload: PosSaleCompletedPayload) {
  try {
    await insertEntries(buildSaleEntries(payload.invoice, payload.lines));
  } catch (error) {
    console.error('Failed to post ledger entries for pos sale', payload.invoice.id, error);
  }
}

async function postVoidReversal(payload: PosSaleVoidedPayload) {
  try {
    await insertEntries(buildVoidReversalEntries(payload.invoice, payload.lines));
  } catch (error) {
    console.error('Failed to post void reversal ledger entries for pos sale', payload.invoice.id, error);
  }
}

async function postTicketCogs(payload: TicketPartConsumedPayload) {
  try {
    await insertEntries(buildTicketCogsEntry(payload));
  } catch (error) {
    console.error('Failed to post ticket COGS ledger entry for charge', payload.chargeId, error);
  }
}

async function postAccountsPayable(payload: SupplierInvoiceCreatedPayload) {
  try {
    await insertEntries(buildApInvoiceEntry(payload));
  } catch (error) {
    console.error('Failed to post AP ledger entry for supplier invoice', payload.invoiceId, error);
  }
}

async function postApSettlement(payload: SupplierPaymentRecordedPayload) {
  try {
    await insertEntries(buildApSettlementEntry(payload));
  } catch (error) {
    console.error('Failed to post AP settlement ledger entry for supplier invoice', payload.invoiceId, error);
  }
}

/**
 * Wires the ledger up to the event bus. Call once at startup (index.ts).
 * A handler throwing must never propagate back into the route that emitted
 * the event — each handler above catches and logs instead, so a ledger bug
 * degrades to a reconcile gap, not a 500 on an otherwise-successful sale.
 */
export function subscribeLedger() {
  onEvent<PosSaleCompletedPayload>(AppEvent.POS_SALE_COMPLETED, postSaleEntries);
  onEvent<PosSaleVoidedPayload>(AppEvent.POS_SALE_VOIDED, postVoidReversal);
  onEvent<TicketPartConsumedPayload>(AppEvent.TICKET_PART_CONSUMED, postTicketCogs);
  onEvent<SupplierInvoiceCreatedPayload>(AppEvent.SUPPLIER_INVOICE_CREATED, postAccountsPayable);
  onEvent<SupplierPaymentRecordedPayload>(AppEvent.SUPPLIER_PAYMENT_RECORDED, postApSettlement);
}
