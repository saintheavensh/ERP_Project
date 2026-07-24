import { paymentMethods } from '../schema';
import { IDS } from './ids';
import type { SeedTx } from './types';

// Tahap A (go-live plan, tier 1 item 4). This table existed since Phase 1
// but had never been seeded — GET /v1/settings/payment-methods returned an
// empty array on a fresh reset, and the POS checkout radio group silently
// rendered zero options as a result (checkout still "worked" only because
// the client's paymentMethod state defaults to 'cash' regardless of what
// the list contains). Dana/OVO/GoPay are bucketed under type 'qris' — no
// business logic anywhere differentiates payment methods beyond the
// cash/transfer/qris/tempo split already in `paymentMethodEnum` (the only
// special case is 'tempo' -> unpaid status), so a named e-wallet method
// sharing the 'qris' type is exactly what (name, type) was already shaped
// for, not a new column or enum value.
export async function seedPaymentMethods(tx: SeedTx): Promise<void> {
  await tx.insert(paymentMethods).values([
    { id: IDS.paymentMethodCash, tenantId: IDS.tenantMain, name: 'Tunai', type: 'cash', isActive: true },
    { id: IDS.paymentMethodTransfer, tenantId: IDS.tenantMain, name: 'Transfer Bank', type: 'transfer', isActive: true },
    { id: IDS.paymentMethodQris, tenantId: IDS.tenantMain, name: 'QRIS', type: 'qris', isActive: true },
    { id: IDS.paymentMethodDana, tenantId: IDS.tenantMain, name: 'Dana', type: 'qris', isActive: true },
    { id: IDS.paymentMethodOvo, tenantId: IDS.tenantMain, name: 'OVO', type: 'qris', isActive: true },
    { id: IDS.paymentMethodGopay, tenantId: IDS.tenantMain, name: 'GoPay', type: 'qris', isActive: true },
    { id: IDS.paymentMethodTempo, tenantId: IDS.tenantMain, name: 'Tempo', type: 'tempo', isActive: true },
  ]).onConflictDoNothing();
}
