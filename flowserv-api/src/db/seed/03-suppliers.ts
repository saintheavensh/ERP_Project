import { suppliers } from '../schema';
import { IDS } from './ids';
import type { SeedTx } from './types';

export async function seedSuppliers(tx: SeedTx): Promise<void> {
  // Two payment terms — cash/COD and 30-day tempo — needed for supplier debt
  // and due-date calculation (H4B.3/4B.4 already implement the calculation;
  // this is the data that exercises it).
  await tx.insert(suppliers).values([
    {
      id: IDS.supplierCash,
      tenantId: IDS.tenantMain,
      name: 'Supplier A (Tunai)',
      email: 'suppliera@example.com',
      contactInfo: '0812-1000-0001',
      type: 'wholesale',
      paymentTermDays: 0,
      returnPolicyDays: 7,
      warrantyPolicyDays: 90,
    },
    {
      id: IDS.supplierTempo,
      tenantId: IDS.tenantMain,
      name: 'Supplier B (Tempo 30 Hari)',
      email: 'supplierb@example.com',
      contactInfo: '0812-1000-0002',
      type: 'wholesale',
      paymentTermDays: 30,
      returnPolicyDays: 14,
      warrantyPolicyDays: 180,
    },
  ]).onConflictDoNothing();
}
