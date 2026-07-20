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
