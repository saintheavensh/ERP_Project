import { productSuppliers, supplierBrands, suppliers } from '../schema';
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

  // Merk sparepart yang dijual tiap supplier. Form "Pembelian Baru" memanggil
  // GET /v1/suppliers/:id lalu memfilter pilihan merk dari sini — tanpa baris
  // ini dropdown merk-nya selalu kosong begitu supplier dipilih.
  // Sengaja tumpang tindih di IncellPro: satu merk boleh dipasok dua supplier,
  // yang justru kasus yang bikin perbandingan harga per supplier ada gunanya.
  await tx.insert(supplierBrands).values([
    { id: IDS.supplierBrandCashIncell, tenantId: IDS.tenantMain, supplierId: IDS.supplierCash, partBrandId: IDS.partBrandIncell },
    { id: IDS.supplierBrandCashOem, tenantId: IDS.tenantMain, supplierId: IDS.supplierCash, partBrandId: IDS.partBrandOem },
    { id: IDS.supplierBrandTempoMega, tenantId: IDS.tenantMain, supplierId: IDS.supplierTempo, partBrandId: IDS.partBrandMegaScreen },
    { id: IDS.supplierBrandTempoIncell, tenantId: IDS.tenantMain, supplierId: IDS.supplierTempo, partBrandId: IDS.partBrandIncell },
  ]).onConflictDoNothing();

  // Item -> supplier. lastPrice mencerminkan harga batch terakhir dari supplier
  // itu di 05-inventory.ts/07-transactions.ts, jadi katalog & batch tidak saling
  // bertentangan.
  await tx.insert(productSuppliers).values([
    { id: IDS.productSupplierLcdCash, inventoryItemId: IDS.itemLcdMultiBatch, supplierId: IDS.supplierCash, isPrimary: true, lastPrice: '150000' },
    { id: IDS.productSupplierLcdTempo, inventoryItemId: IDS.itemLcdMultiBatch, supplierId: IDS.supplierTempo, isPrimary: false, lastPrice: '165000' },
    { id: IDS.productSupplierBatCash, inventoryItemId: IDS.itemStokSatu, supplierId: IDS.supplierCash, isPrimary: true, lastPrice: '200000' },
  ]).onConflictDoNothing();
}
