import {
  purchaseOrders,
  purchaseOrderLines,
  supplierInvoices,
  serviceTickets,
  ticketStageHistory,
} from '../schema';
import { IDS } from './ids';
import type { SeedTx } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;

export async function seedTransactions(tx: SeedTx): Promise<void> {
  const now = Date.now();
  const twoDaysAgo = new Date(now - 2 * DAY_MS);
  const yesterday = new Date(now - 1 * DAY_MS);
  // Due date anchored to the invoice date (yesterday) + Supplier B's 30-day
  // term, not to "now" — otherwise it drifts a day off what the payment-term
  // calculation (4B.3) would itself produce.
  const dueDate = new Date(yesterday.getTime() + 30 * DAY_MS);

  // PO #1 — still 'ordered', not yet received. Exercises the goods-receiving
  // page (H track receiving flow) against a fresh order.
  await tx.insert(purchaseOrders).values({
    id: IDS.poOrdered,
    tenantId: IDS.tenantMain,
    branchId: IDS.branchPusat,
    supplierId: IDS.supplierCash,
    poNumber: 'PO-SEED-0001',
    status: 'ordered',
    estimatedTotal: '2000000',
  }).onConflictDoNothing();

  await tx.insert(purchaseOrderLines).values({
    id: IDS.poOrderedLine,
    purchaseOrderId: IDS.poOrdered,
    inventoryItemId: IDS.itemStokSatu,
    quantity: 10,
    receivedQuantity: 0,
    unitPrice: '200000',
  }).onConflictDoNothing();

  // PO #2 — fully 'completed' and invoiced on tempo terms, so the payables
  // page has something to show unpaid.
  await tx.insert(purchaseOrders).values({
    id: IDS.poCompleted,
    tenantId: IDS.tenantMain,
    branchId: IDS.branchPusat,
    supplierId: IDS.supplierTempo,
    poNumber: 'PO-SEED-0002',
    status: 'completed',
    estimatedTotal: '3200000',
    actualTotal: '3300000',
    invoiceNumber: 'INV-SUP-0001',
    invoiceDate: yesterday,
    invoiceDueDate: dueDate,
  }).onConflictDoNothing();

  await tx.insert(purchaseOrderLines).values({
    id: IDS.poCompletedLine,
    purchaseOrderId: IDS.poCompleted,
    inventoryItemId: IDS.itemLcdMultiBatch,
    quantity: 20,
    receivedQuantity: 20,
    unitPrice: '160000',
    actualUnitPrice: '165000',
  }).onConflictDoNothing();

  await tx.insert(supplierInvoices).values({
    id: IDS.supplierInvoiceUnpaid,
    tenantId: IDS.tenantMain,
    branchId: IDS.branchPusat,
    supplierId: IDS.supplierTempo,
    purchaseOrderId: IDS.poCompleted,
    invoiceNumber: 'INV-SUP-0001',
    status: 'unpaid',
    totalAmount: '3300000',
    amountPaid: '0',
    paymentMethod: 'tempo',
    invoiceDate: yesterday,
    dueDate: dueDate,
  }).onConflictDoNothing();

  // One ticket mid-flow (sitting at Diagnosis) — lets intake/transition/detail
  // pages be exercised immediately without creating a ticket by hand first.
  await tx.insert(serviceTickets).values({
    id: IDS.ticketInProgress,
    tenantId: IDS.tenantMain,
    branchId: IDS.branchPusat,
    customerId: IDS.customerAndi,
    customerAssetId: IDS.assetAndiHp,
    flowTemplateId: IDS.flowTemplate,
    currentNodeId: IDS.nodeDiagnosis,
    status: 'open',
    createdAt: twoDaysAgo,
  }).onConflictDoNothing();

  await tx.insert(ticketStageHistory).values([
    { id: IDS.ticketStageIntake, ticketId: IDS.ticketInProgress, nodeId: IDS.nodeIntake, actorId: IDS.userTechnician, notes: 'Tiket masuk dari seed', enteredAt: twoDaysAgo },
    { id: IDS.ticketStageDiagnosis, ticketId: IDS.ticketInProgress, nodeId: IDS.nodeDiagnosis, actorId: IDS.userTechnician, notes: 'Mulai diagnosis', enteredAt: yesterday },
  ]).onConflictDoNothing();
}
