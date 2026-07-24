import { paymentMethods } from '../schema';
import { IDS } from './ids';
import type { SeedTx } from './types';

// Tahap A (go-live gap Tier-1 #4). The POS CheckoutModal already reads this
// table (value=id, label=name) but nothing ever seeded it — so the app showed
// "Tidak ada metode pembayaran aktif" and only the store's hidden 'cash'
// default worked. Seed the real tender types the owner named.
//
// `type` is the finite category the backend keys off (cash/transfer/qris/
// ewallet/tempo -> e.g. 'tempo' means the invoice is unpaid); `name` is the
// specific brand shown to the cashier. Dana/OVO/GoPay deliberately share
// type 'ewallet' — the POS radio binds on id, not type, so all three are
// selectable without collision.
export async function seedPaymentMethods(tx: SeedTx): Promise<void> {
  await tx.insert(paymentMethods).values([
    { id: IDS.paymentTunai, tenantId: IDS.tenantMain, name: 'Tunai', type: 'cash', isActive: true },
    { id: IDS.paymentTransfer, tenantId: IDS.tenantMain, name: 'Transfer Bank', type: 'transfer', isActive: true },
    { id: IDS.paymentQris, tenantId: IDS.tenantMain, name: 'QRIS', type: 'qris', isActive: true },
    { id: IDS.paymentDana, tenantId: IDS.tenantMain, name: 'Dana', type: 'ewallet', isActive: true },
    { id: IDS.paymentOvo, tenantId: IDS.tenantMain, name: 'OVO', type: 'ewallet', isActive: true },
    { id: IDS.paymentGopay, tenantId: IDS.tenantMain, name: 'GoPay', type: 'ewallet', isActive: true },
    { id: IDS.paymentTempo, tenantId: IDS.tenantMain, name: 'Tempo (Kredit)', type: 'tempo', isActive: true },
    // Second tenant — minimal set so its POS isn't empty either.
    { id: IDS.paymentSecondTunai, tenantId: IDS.tenantSecond, name: 'Tunai', type: 'cash', isActive: true },
    { id: IDS.paymentSecondQris, tenantId: IDS.tenantSecond, name: 'QRIS', type: 'qris', isActive: true },
  ]).onConflictDoNothing();
}
