import {
  deviceBrands,
  deviceModels,
  inventoryCategories,
  inventoryItems,
} from '../schema';
import { IDS } from './ids';
import type { SeedTx } from './types';

export async function seedCatalog(tx: SeedTx): Promise<void> {
  // Device brands/models — used for customer assets and to keep item names
  // meaningful ("LCD Samsung A10" actually refers to a real seeded model).
  await tx.insert(deviceBrands).values([
    { id: IDS.deviceBrandSamsung, tenantId: IDS.tenantMain, name: 'Samsung' },
    { id: IDS.deviceBrandAsus, tenantId: IDS.tenantMain, name: 'Asus' },
    { id: IDS.deviceBrandXiaomi, tenantId: IDS.tenantMain, name: 'Xiaomi' },
    { id: IDS.deviceBrandOppo, tenantId: IDS.tenantMain, name: 'Oppo' },
    { id: IDS.deviceBrandApple, tenantId: IDS.tenantMain, name: 'Apple' },
  ]).onConflictDoNothing();

  await tx.insert(deviceModels).values([
    { id: IDS.deviceModelA10, deviceBrandId: IDS.deviceBrandSamsung, name: 'Galaxy A10' },
    { id: IDS.deviceModelAsusX, deviceBrandId: IDS.deviceBrandAsus, name: 'X441U' },
    { id: IDS.deviceModelRedmi9, deviceBrandId: IDS.deviceBrandXiaomi, name: 'Redmi 9' },
    { id: IDS.deviceModelA3s, deviceBrandId: IDS.deviceBrandOppo, name: 'A3s' },
    { id: IDS.deviceModelIphoneX, deviceBrandId: IDS.deviceBrandApple, name: 'iPhone X' },
  ]).onConflictDoNothing();

  // Categories
  await tx.insert(inventoryCategories).values([
    { id: IDS.categoryLcd, tenantId: IDS.tenantMain, name: 'LCD & Touchscreen', description: 'Layar dan digitizer' },
    { id: IDS.categoryBattery, tenantId: IDS.tenantMain, name: 'Baterai', description: 'Baterai internal HP' },
  ]).onConflictDoNothing();

  // Items — itemLcdMultiBatch gets its two priced batches in 05-inventory.ts;
  // itemStokSatu is the single-unit item H10 (stock reservation) needs.
  await tx.insert(inventoryItems).values([
    {
      id: IDS.itemLcdMultiBatch,
      tenantId: IDS.tenantMain,
      sku: 'LCD-SAM-A10',
      universalCode: 'SAM-A10-LCD',
      name: 'LCD Samsung A10',
      categoryId: IDS.categoryLcd,
      unitCostAvg: '157500', // WAC of the two seeded batches: (5*150000 + 5*165000) / 10
      sellingPrice: '220000',
      reorderPoint: 2,
      isStockInitialized: true,
      unitOfMeasure: 'pcs',
    },
    {
      id: IDS.itemStokSatu,
      tenantId: IDS.tenantMain,
      sku: 'BAT-IPH-X',
      universalCode: 'APL-IPX-BAT',
      name: 'Baterai iPhone X',
      categoryId: IDS.categoryBattery,
      unitCostAvg: '200000',
      sellingPrice: '300000',
      reorderPoint: 2,
      isStockInitialized: true,
      unitOfMeasure: 'pcs',
    },
  ]).onConflictDoNothing();
}
