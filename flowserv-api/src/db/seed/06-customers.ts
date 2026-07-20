import { customers, customerAssets } from '../schema';
import { IDS } from './ids';
import type { SeedTx } from './types';

export async function seedCustomers(tx: SeedTx): Promise<void> {
  await tx.insert(customers).values([
    { id: IDS.customerBudi, tenantId: IDS.tenantMain, name: 'Budi Santoso', phone: '0812-3456-7001', email: 'budi@example.com' },
    { id: IDS.customerSiti, tenantId: IDS.tenantMain, name: 'Siti Aminah', phone: '0812-3456-7002', email: 'siti@example.com' },
    { id: IDS.customerAndi, tenantId: IDS.tenantMain, name: 'Andi Wijaya', phone: '0812-3456-7003', email: 'andi@example.com' },
    { id: IDS.customerDewi, tenantId: IDS.tenantMain, name: 'Dewi Lestari', phone: '0812-3456-7004', email: 'dewi@example.com' },
  ]).onConflictDoNothing();

  await tx.insert(customerAssets).values([
    { id: IDS.assetBudiHp, customerId: IDS.customerBudi, assetType: 'HP', brand: 'Samsung', model: 'Galaxy A10', serialNumber: 'SN-A10-0001' },
    { id: IDS.assetSitiLaptop, customerId: IDS.customerSiti, assetType: 'Laptop', brand: 'Asus', model: 'X441U', serialNumber: 'SN-ASUS-0001' },
    { id: IDS.assetAndiHp, customerId: IDS.customerAndi, assetType: 'HP', brand: 'Xiaomi', model: 'Redmi 9', serialNumber: 'SN-REDMI9-0001' },
    { id: IDS.assetDewiHp, customerId: IDS.customerDewi, assetType: 'HP', brand: 'Oppo', model: 'A3s', serialNumber: 'SN-A3S-0001' },
  ]).onConflictDoNothing();
}
