import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  decimal,
  timestamp,
  boolean,
  jsonb,
  unique,
  index,
  uniqueIndex,
  primaryKey,
  numeric,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import { tenants, branches, users } from './core';
import { serviceTickets } from './tickets';
import { partBrands } from './product_catalog';
import { movementTypeEnum, paymentStatusEnum, poStatusEnum, supplierPayMethodEnum } from './enums';


export const inventoryCategories = pgTable('inventory_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  description: text('description'),
  marginStrategy: varchar('margin_strategy', { length: 20 }), // 'markup' or 'gross_margin'
  targetMargin: decimal('target_margin', { precision: 5, scale: 2 }), // e.g. 30.00 for 30%
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('inventory_categories_tenant_idx').on(table.tenantId),
}));

export const inventoryItems = pgTable('inventory_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  sku: text('sku').notNull(),
  universalCode: varchar('universal_code', { length: 50 }), // Part Number / Factory Code (e.g. BLP673)
  name: text('name').notNull(),
  categoryId: uuid('category_id').references(() => inventoryCategories.id),
  partBrandId: uuid('part_brand_id').references(() => partBrands.id), // merk sparepart (bukan merk HP) — lihat PRODUCT CATALOG di bawah
  unitCostAvg: decimal('unit_cost_avg', { precision: 14, scale: 2 }).notNull().default('0'), // nilai referensi/cache untuk tampilan cepat — COGS aktual dihitung dari stock_batches (FIFO)
  sellingPrice: decimal('selling_price', { precision: 14, scale: 2 }).notNull().default('0'), // Harga jual dasar produk (jika tidak ada merk spesifik)
  reorderPoint: integer('reorder_point').notNull().default(0),
  marginStrategy: varchar('margin_strategy', { length: 20 }), // overrides category setting
  targetMargin: decimal('target_margin', { precision: 5, scale: 2 }), // overrides category setting
  isStockInitialized: boolean('is_stock_initialized').notNull().default(false),
  unresolvedCompatibility: jsonb('unresolved_compatibility').default('[]'), // array of strings for unparsed models
  unitOfMeasure: varchar('unit_of_measure', { length: 20 }).notNull().default('pcs'),
}, (table) => ({
  tenantSkuUnique: unique('inventory_items_tenant_sku_unique').on(table.tenantId, table.sku),
  tenantIdx: index('inventory_items_tenant_idx').on(table.tenantId),
}));

export const itemBrandPricing = pgTable('item_brand_pricing', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  inventoryItemId: uuid('inventory_item_id').notNull().references(() => inventoryItems.id),
  partBrandId: uuid('part_brand_id').notNull().references(() => partBrands.id),
  sellingPrice: decimal('selling_price', { precision: 14, scale: 2 }).notNull().default('0'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  itemBrandUnique: unique('item_brand_pricing_unique').on(table.inventoryItemId, table.partBrandId),
}));


export const stockLevels = pgTable('stock_levels', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  inventoryItemId: uuid('inventory_item_id').notNull().references(() => inventoryItems.id),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  quantityAvailable: integer('quantity_available').notNull().default(0),
  quantityReserved: integer('quantity_reserved').notNull().default(0),
}, (table) => ({
  tenantItemBranchUnique: unique('stock_levels_tenant_item_branch_unique').on(table.tenantId, table.inventoryItemId, table.branchId),
  tenantIdx: index('stock_levels_tenant_idx').on(table.tenantId),
}));

export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  inventoryItemId: uuid('inventory_item_id').notNull().references(() => inventoryItems.id),
  stockBatchId: uuid('stock_batch_id').references(() => stockBatches.id), // batch FIFO spesifik yang kepakai — jejak balik ke supplier
  movementType: movementTypeEnum('movement_type').notNull(),
  quantity: integer('quantity').notNull(),
  referenceType: varchar('reference_type', { length: 30 }),
  referenceId: uuid('reference_id'),
  serviceTicketId: uuid('service_ticket_id').references(() => serviceTickets.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantBranchIdx: index('stock_movements_tenant_branch_idx').on(table.tenantId, table.branchId),
  itemIdx: index('stock_movements_item_idx').on(table.inventoryItemId),
}));

// FIFO batch tracking: setiap kali stok masuk, dibuatkan 1 baris di sini.
// Konsumsi HARUS ambil dari batch dengan receivedAt paling lama & quantityRemaining > 0 (FIFO).
// supplierId di tiap batch = kunci utama kenapa ini disebut "FIFO per supplier": urutan konsumsi tetap
// berdasar waktu (FIFO asli), tapi tiap batch selalu bisa ditelusuri balik ke supplier & harga aslinya —
// penting untuk retur/klaim garansi yang kebijakannya beda-beda per supplier.
export const stockBatches = pgTable('stock_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  inventoryItemId: uuid('inventory_item_id').notNull().references(() => inventoryItems.id),
  partBrandId: uuid('part_brand_id').references(() => partBrands.id),
  supplierId: uuid('supplier_id').notNull().references(() => suppliers.id),
  purchaseOrderLineId: uuid('purchase_order_line_id').references(() => purchaseOrderLines.id),
  unitCost: decimal('unit_cost', { precision: 14, scale: 2 }).notNull(), // harga beli asli batch ini, bukan rata-rata
  quantityReceived: integer('quantity_received').notNull(),
  quantityRemaining: integer('quantity_remaining').notNull(),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  fifoOrderIdx: index('stock_batches_fifo_idx').on(table.inventoryItemId, table.receivedAt),
}));

export const suppliers = pgTable('suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  email: text('email'),
  contactInfo: text('contact_info'), // phone or other contact
  photoUrl: text('photo_url'),
  type: varchar('type', { length: 20 }).notNull().default('wholesale'), // 'wholesale' | 'retailer' — tag, bukan pengunci
  paymentTermDays: integer('payment_term_days').notNull().default(0), // 0 = Cash/COD, > 0 = Tempo (e.g., 7, 14, 30 days)
  returnPolicyDays: integer('return_policy_days'), // batas hari retur ke supplier ini
  warrantyPolicyDays: integer('warranty_policy_days'), // garansi dari supplier ini untuk part yang dibeli
  returnWarrantyNotes: text('return_warranty_notes'), // catatan bebas kalau kebijakannya tidak sesederhana angka hari
}, (table) => ({
  tenantIdx: index('suppliers_tenant_idx').on(table.tenantId),
}));

export const supplierBrands = pgTable('supplier_brands', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  supplierId: uuid('supplier_id').notNull().references(() => suppliers.id),
  partBrandId: uuid('part_brand_id').notNull().references(() => partBrands.id),
}, (table) => ({
  tenantIdx: index('supplier_brands_tenant_idx').on(table.tenantId),
  uniqueSupplierBrand: uniqueIndex('supplier_brands_unique_idx').on(table.supplierId, table.partBrandId)
}));

export const supplierInvoices = pgTable('supplier_invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  supplierId: uuid('supplier_id').notNull().references(() => suppliers.id),
  purchaseOrderId: uuid('purchase_order_id').references(() => purchaseOrders.id),
  invoiceNumber: varchar('invoice_number', { length: 100 }), // Dari nota supplier
  status: paymentStatusEnum('status').notNull().default('unpaid'),
  totalAmount: decimal('total_amount', { precision: 14, scale: 2 }).notNull(),
  amountPaid: decimal('amount_paid', { precision: 14, scale: 2 }).notNull().default('0'),
  paymentMethod: supplierPayMethodEnum('payment_method').notNull(),
  invoiceDate: timestamp('invoice_date', { withTimezone: true }).notNull().defaultNow(),
  dueDate: timestamp('due_date', { withTimezone: true }), // Tanggal jatuh tempo jika tempo
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantBranchIdx: index('supplier_invoices_tenant_branch_idx').on(table.tenantId, table.branchId),
  supplierIdx: index('supplier_invoices_supplier_idx').on(table.supplierId),
}));

export const supplierPayments = pgTable('supplier_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  supplierInvoiceId: uuid('supplier_invoice_id').notNull().references(() => supplierInvoices.id),
  amount: decimal('amount', { precision: 14, scale: 2 }).notNull(),
  paymentMethod: supplierPayMethodEnum('payment_method').notNull(),
  referenceNumber: varchar('reference_number', { length: 100 }), // misal no referensi transfer
  paymentDate: timestamp('payment_date', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
}, (table) => ({
  invoiceIdx: index('supplier_payments_invoice_idx').on(table.supplierInvoiceId),
}));

export const purchaseOrders = pgTable('purchase_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  supplierId: uuid('supplier_id').notNull().references(() => suppliers.id),
  poNumber: varchar('po_number', { length: 50 }).notNull(),
  status: poStatusEnum('status').notNull().default('draft'),
  expectedDeliveryDate: timestamp('expected_delivery_date', { withTimezone: true }),
  invoiceNumber: varchar('invoice_number', { length: 100 }),
  invoiceDate: timestamp('invoice_date', { withTimezone: true }),
  invoiceDueDate: timestamp('invoice_due_date', { withTimezone: true }),
  estimatedTotal: decimal('estimated_total', { precision: 14, scale: 2 }).notNull().default('0'),
  actualTotal: decimal('actual_total', { precision: 14, scale: 2 }),
  createdBy: uuid('created_by'), // -> users.id (for tracking who made the PO)
  approvedBy: uuid('approved_by'), // -> users.id (for tracking who approved)
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantBranchIdx: index('purchase_orders_tenant_branch_idx').on(table.tenantId, table.branchId),
}));

export const purchaseOrderLines = pgTable('purchase_order_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  purchaseOrderId: uuid('purchase_order_id').notNull().references(() => purchaseOrders.id),
  inventoryItemId: uuid('inventory_item_id').notNull().references(() => inventoryItems.id),
  quantity: integer('quantity').notNull(),
  receivedQuantity: integer('received_quantity').notNull().default(0),
  unitPrice: decimal('unit_price', { precision: 14, scale: 2 }).notNull(), // estimated
  actualUnitPrice: decimal('actual_unit_price', { precision: 14, scale: 2 }), // final from invoice
}, (table) => ({
  tenantIdx: index('purchase_order_lines_tenant_idx').on(table.tenantId),
}));
