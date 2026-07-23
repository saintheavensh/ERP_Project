import type { PoStatus } from '../../db/schema/enums';

export type PurchaseOrderStatus = PoStatus;

export type ReceivableLine = { quantity: number; receivedQuantity: number };

/**
 * Pure decision — no database. Given the accumulated received quantities across
 * ALL of an order's lines (not just what arrived in the latest delivery), decides
 * what the order's status should become.
 *
 * If nothing has been received at all, the status is left as whatever it already
 * was (e.g. 'draft' or 'ordered') rather than invented — a purchase order never
 * starts in a generic "pending" state in this system.
 */
export function computeOrderStatus(
  lines: ReceivableLine[],
  currentStatus: PurchaseOrderStatus
): PurchaseOrderStatus {
  if (lines.length > 0 && lines.every(l => l.receivedQuantity >= l.quantity)) {
    return 'received';
  }
  if (lines.some(l => l.receivedQuantity > 0)) {
    return 'partial';
  }
  return currentStatus;
}

/**
 * F5 — pure decision: only a 'draft' PO (nothing has been received against it
 * yet, so there are no stock_batches / stock_movements to unwind) may be
 * deleted. 'partial'/'received'/'completed' all imply goods already moved
 * stock — deleting the PO row would either leave those batches orphaned or
 * require unwinding real inventory history, which is what the (future)
 * purchase-returns flow is for, not a delete.
 */
export function canDeletePurchaseOrder(status: PurchaseOrderStatus): boolean {
  return status === 'draft';
}
