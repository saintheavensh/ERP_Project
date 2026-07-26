import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  timestamp,
  boolean,
  jsonb,
  unique,
  index,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import { tenants } from './core';
import { inventoryItems, suppliers } from './inventory';
import { money } from './columns';

// PENTING — dua konsep "merk" yang berbeda, jangan tertukar:
// - deviceBrands/deviceModels = merk & tipe HP (Oppo A3s, Realme 3, dst) → menentukan KOMPATIBILITAS
// - partBrands = merk sparepart milik supplier (mis. "IncellPro", "MegaScreen") → menentukan KUALITAS,
//   melekat langsung ke inventoryItems.partBrandId (1 SKU = 1 merk sparepart tetap)
// ==========================================================

export const deviceBrands = pgTable('device_brands', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(), // "Oppo", "Realme", dst
}, (table) => ({
  tenantIdx: index('device_brands_tenant_idx').on(table.tenantId),
}));

export const deviceModels = pgTable('device_models', {
  id: uuid('id').primaryKey().defaultRandom(),
  deviceBrandId: uuid('device_brand_id').notNull().references(() => deviceBrands.id),
  name: text('name').notNull(), // "A3s", "A5s", dst
  // Tahap A — katalog device untuk intake (gambar/spesifikasi/saran servis).
  // Input manual per tenant (bukan scraping eksternal, bukan tabel baru — lihat
  // plan/tahap-a-device-catalog-invoice-mode.md untuk alasannya). Semua nullable:
  // model yang cuma dipakai untuk kompatibilitas sparepart (fungsi asli tabel ini)
  // tidak wajib punya data ini.
  imageUrl: text('image_url'),
  specs: jsonb('specs').$type<Record<string, string>>(),
}, (table) => ({
  brandIdx: index('device_models_brand_idx').on(table.deviceBrandId),
}));

// Many-to-many: 1 SKU part bisa kompatibel ke banyak device model.
// Baterai (kompatibel luas) dan LCD (kompatibel sempit) pakai struktur SAMA — beda cuma jumlah baris datanya.
export const productCompatibility = pgTable('product_compatibility', {
  inventoryItemId: uuid('inventory_item_id').notNull().references(() => inventoryItems.id),
  deviceModelId: uuid('device_model_id').notNull().references(() => deviceModels.id),
}, (table) => ({
  pk: primaryKey({ columns: [table.inventoryItemId, table.deviceModelId] }),
}));

export const partBrands = pgTable('part_brands', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(), // merk sparepart: "IncellPro", "MegaScreen", "OEM", "KW Super", dst
  // Tingkat kualitas ("Original", "OEM", "Grade A", "Incell", dst). Kolom ini
  // sempat hilang dari schema padahal POST /v1/brands mewajibkannya dan 4 layar
  // menampilkannya — akibatnya setiap merk yang dibuat lewat UI kehilangan
  // grade-nya diam-diam dan semua tampilan tercetak "undefined".
  qualityGrade: varchar('quality_grade', { length: 30 }).notNull().default('OEM'),
}, (table) => ({
  tenantIdx: index('part_brands_tenant_idx').on(table.tenantId),
}));

// Many-to-many: 1 SKU part (dengan merk sparepart yang sudah tetap) bisa dibeli dari banyak supplier.
// is_primary menandai supplier utama — TIDAK mengunci, supplier lain tetap tercatat sebagai alternatif
// (mis. toko online / retailer) kalau supplier utama kosong stok.
export const productSuppliers = pgTable('product_suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  inventoryItemId: uuid('inventory_item_id').notNull().references(() => inventoryItems.id),
  supplierId: uuid('supplier_id').notNull().references(() => suppliers.id),
  isPrimary: boolean('is_primary').notNull().default(false),
  lastPrice: money('last_price'),
}, (table) => ({
  itemSupplierUnique: unique('product_suppliers_item_supplier_unique').on(table.inventoryItemId, table.supplierId),
}));
