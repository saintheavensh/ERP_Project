import {
  deviceBrands,
  deviceModels,
  inventoryCategories,
  inventoryItems,
  itemBrandPricing,
  partBrands,
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

  // Tahap A — katalog device (gambar/spesifikasi/saran servis). Cuma dua model
  // yang diisi sebagai contoh nyata untuk didemokan; sisanya sengaja dibiarkan
  // kosong (imageUrl/specs/suggestedServices semua nullable) — persis kondisi
  // "device belum dikatalogkan" yang harus tetap bisa dipakai di intake.
  await tx.insert(deviceModels).values([
    {
      id: IDS.deviceModelA10,
      deviceBrandId: IDS.deviceBrandSamsung,
      name: 'Galaxy A10',
      imageUrl: 'https://images.samsung.com/is/image/samsung/assets/id/galaxy-a10/gallery/galaxy-a10-black-front.jpg',
      specs: { RAM: '2 GB', Storage: '32 GB', Battery: '3400 mAh', Display: '6.2" HD+' },
    },
    { id: IDS.deviceModelAsusX, deviceBrandId: IDS.deviceBrandAsus, name: 'X441U' },
    { id: IDS.deviceModelRedmi9, deviceBrandId: IDS.deviceBrandXiaomi, name: 'Redmi 9' },
    { id: IDS.deviceModelA3s, deviceBrandId: IDS.deviceBrandOppo, name: 'A3s' },
    {
      id: IDS.deviceModelIphoneX,
      deviceBrandId: IDS.deviceBrandApple,
      name: 'iPhone X',
      imageUrl: 'https://www.apple.com/newsroom/images/product/iphone/standard/apple_iphonex_hero_09122017_big.jpg.large.jpg',
      specs: { RAM: '3 GB', Storage: '64/256 GB', Battery: '2716 mAh', Display: '5.8" OLED' },
    },
  ]).onConflictDoNothing();

  // Merk SPAREPART — beda konsep dari deviceBrands di atas: ini menentukan
  // KUALITAS/harga part, bukan kompatibilitas HP. Tiga grade supaya perbedaan
  // harga jual per merk (itemBrandPricing di bawah) punya arti.
  await tx.insert(partBrands).values([
    { id: IDS.partBrandIncell, tenantId: IDS.tenantMain, name: 'IncellPro', qualityGrade: 'Original' },
    { id: IDS.partBrandMegaScreen, tenantId: IDS.tenantMain, name: 'MegaScreen', qualityGrade: 'Grade A' },
    { id: IDS.partBrandOem, tenantId: IDS.tenantMain, name: 'OEM Standard', qualityGrade: 'OEM' },
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
      partBrandId: IDS.partBrandIncell,
      // WAC across ALL THREE seeded batches, including the 20 units received
      // against PO-SEED-0002 in 07-transactions.ts:
      // (5*150000 + 5*165000 + 20*165000) / 30 = 162500
      unitCostAvg: '162500',
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
      partBrandId: IDS.partBrandOem,
      unitCostAvg: '200000',
      sellingPrice: '300000',
      reorderPoint: 2,
      isStockInitialized: true,
      unitOfMeasure: 'pcs',
    },
  ]).onConflictDoNothing();

  // Harga jual per merk untuk SKU yang sama — merk yang lebih tinggi grade-nya
  // dijual lebih mahal. Ini yang dibaca kolom margin di halaman inventory.
  await tx.insert(itemBrandPricing).values([
    { id: IDS.itemBrandPriceLcdIncell, tenantId: IDS.tenantMain, inventoryItemId: IDS.itemLcdMultiBatch, partBrandId: IDS.partBrandIncell, sellingPrice: '220000' },
    { id: IDS.itemBrandPriceLcdMega, tenantId: IDS.tenantMain, inventoryItemId: IDS.itemLcdMultiBatch, partBrandId: IDS.partBrandMegaScreen, sellingPrice: '195000' },
    { id: IDS.itemBrandPriceBatOem, tenantId: IDS.tenantMain, inventoryItemId: IDS.itemStokSatu, partBrandId: IDS.partBrandOem, sellingPrice: '300000' },
  ]).onConflictDoNothing();
}
