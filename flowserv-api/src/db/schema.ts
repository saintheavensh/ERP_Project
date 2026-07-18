// FlowServ — Drizzle Schema
// Diterjemahkan dari docs/06-data-model.md
// Keputusan final terkait: shared DB + tenant_id + RLS, Weighted Average Cost

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

// ==========================================================
// CORE PLATFORM: Tenant, Branch, User, RBAC
// ==========================================================

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  subscriptionTier: varchar('subscription_tier', { length: 50 }).notNull().default('trial'),
  status: varchar('status', { length: 50 }).notNull().default('trial'),
  settings: jsonb('settings').notNull().default({}), // termasuk { simplifiedFinanceMode: true } — default sembunyikan istilah akuntansi
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const branches = pgTable('branches', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  address: text('address'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('branches_tenant_idx').on(table.tenantId),
}));

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  tenantEmailUnique: unique('users_tenant_email_unique').on(table.tenantId, table.email),
  tenantIdx: index('users_tenant_idx').on(table.tenantId),
}));

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  isCustom: boolean('is_custom').notNull().default(false),
}, (table) => ({
  // tenantNameUnique: unique('roles_tenant_name_unique').on(table.tenantId, table.name),
  tenantIdx: index('roles_tenant_idx').on(table.tenantId),
}));

export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(), // e.g. "ticket.approve_quote"
  description: text('description').notNull(),
});

export const rolePermissions = pgTable('role_permissions', {
  roleId: uuid('role_id').notNull().references(() => roles.id),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id),
}, (table) => ({
  pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
}));

export const userRoleAssignments = pgTable('user_role_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  roleId: uuid('role_id').notNull().references(() => roles.id),
  branchId: uuid('branch_id').references(() => branches.id), // null = semua cabang
}, (table) => ({
  userIdx: index('user_role_assignments_user_idx').on(table.userId),
}));

// ==========================================================
// FLOW ENGINE: Template, Node, Transition (jantung produk)
// ==========================================================

export const flowTemplates = pgTable('flow_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  domain: varchar('domain', { length: 20 }).notNull(), // "service" | "inventory"
  name: text('name').notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('flow_templates_tenant_idx').on(table.tenantId),
}));

export const flowNodes = pgTable('flow_nodes', {
  id: uuid('id').primaryKey().defaultRandom(),
  flowTemplateId: uuid('flow_template_id').notNull().references(() => flowTemplates.id),
  name: text('name').notNull(),
  sequenceOrder: integer('sequence_order').notNull(),
  nodeType: varchar('node_type', { length: 20 }).notNull(), // "action" | "approval" | "system"
  requiredPermissionId: uuid('required_permission_id').references(() => permissions.id),
}, (table) => ({
  templateIdx: index('flow_nodes_template_idx').on(table.flowTemplateId),
}));

export const flowTransitions = pgTable('flow_transitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  fromNodeId: uuid('from_node_id').notNull().references(() => flowNodes.id),
  toNodeId: uuid('to_node_id').notNull().references(() => flowNodes.id),
  conditionExpression: text('condition_expression'),
});

// ==========================================================
// CUSTOMER & SERVICE TICKET
// ==========================================================

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('customers_tenant_idx').on(table.tenantId),
}));

export const customerAssets = pgTable('customer_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  assetType: text('asset_type').notNull(), // "HP", "Motor", "Kulkas", dst — bebas per tenant
  brand: text('brand'),
  model: text('model'),
  serialNumber: text('serial_number'),
});

export const serviceTickets = pgTable('service_tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  customerAssetId: uuid('customer_asset_id').notNull().references(() => customerAssets.id),
  flowTemplateId: uuid('flow_template_id').notNull().references(() => flowTemplates.id),
  currentNodeId: uuid('current_node_id').references(() => flowNodes.id),
  status: varchar('status', { length: 20 }).notNull().default('open'), // open, closed, cancelled
  createdAt: timestamp('created_at').notNull().defaultNow(),
  closedAt: timestamp('closed_at'),
}, (table) => ({
  tenantBranchIdx: index('service_tickets_tenant_branch_idx').on(table.tenantId, table.branchId),
}));

export const ticketStageHistory = pgTable('ticket_stage_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').notNull().references(() => serviceTickets.id),
  nodeId: uuid('node_id').notNull().references(() => flowNodes.id),
  actorId: uuid('actor_id'),
  notes: text('notes'),
  enteredAt: timestamp('entered_at').notNull().defaultNow(),
}, (table) => ({
  ticketIdx: index('ticket_stage_history_ticket_idx').on(table.ticketId),
}));

export const approvalRequests = pgTable('approval_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').notNull().references(() => serviceTickets.id),
  requestedAt: timestamp('requested_at').notNull().defaultNow(),
  respondedAt: timestamp('responded_at'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  amount: decimal('amount', { precision: 14, scale: 2 }),
  magicToken: text('magic_token').unique(), // dipakai untuk link approval customer
});

export const warrantyRecords = pgTable('warranty_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').notNull().unique().references(() => serviceTickets.id),
  customerAssetId: uuid('customer_asset_id').notNull().references(() => customerAssets.id),
  warrantyStart: timestamp('warranty_start').notNull(),
  warrantyEnd: timestamp('warranty_end').notNull(),
});

// ==========================================================
// INVENTORY
// ==========================================================

export const inventoryCategories = pgTable('inventory_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  description: text('description'),
  marginStrategy: varchar('margin_strategy', { length: 20 }), // 'markup' or 'gross_margin'
  targetMargin: decimal('target_margin', { precision: 5, scale: 2 }), // e.g. 30.00 for 30%
  createdAt: timestamp('created_at').notNull().defaultNow(),
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
  // tenantSkuUnique: unique('inventory_items_tenant_sku_unique').on(table.tenantId, table.sku),
  tenantIdx: index('inventory_items_tenant_idx').on(table.tenantId),
}));

export const itemBrandPricing = pgTable('item_brand_pricing', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  inventoryItemId: uuid('inventory_item_id').notNull().references(() => inventoryItems.id),
  partBrandId: uuid('part_brand_id').notNull().references(() => partBrands.id),
  sellingPrice: decimal('selling_price', { precision: 14, scale: 2 }).notNull().default('0'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  itemBrandUnique: unique('item_brand_pricing_unique').on(table.inventoryItemId, table.partBrandId),
}));


export const stockLevels = pgTable('stock_levels', {
  id: uuid('id').primaryKey().defaultRandom(),
  inventoryItemId: uuid('inventory_item_id').notNull().references(() => inventoryItems.id),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  quantityAvailable: integer('quantity_available').notNull().default(0),
  quantityReserved: integer('quantity_reserved').notNull().default(0),
}, (table) => ({
  // itemBranchUnique: unique('stock_levels_item_branch_unique').on(table.inventoryItemId, table.branchId),
}));

export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  inventoryItemId: uuid('inventory_item_id').notNull().references(() => inventoryItems.id),
  stockBatchId: uuid('stock_batch_id').references(() => stockBatches.id), // batch FIFO spesifik yang kepakai — jejak balik ke supplier
  movementType: varchar('movement_type', { length: 20 }).notNull(), // in, out, reserve, release, adjust, write_off
  quantity: integer('quantity').notNull(),
  referenceType: varchar('reference_type', { length: 30 }),
  referenceId: uuid('reference_id'),
  serviceTicketId: uuid('service_ticket_id').references(() => serviceTickets.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
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
  receivedAt: timestamp('received_at').notNull().defaultNow(),
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
  status: varchar('status', { length: 20 }).notNull().default('unpaid'), // 'unpaid' | 'partial' | 'paid'
  totalAmount: decimal('total_amount', { precision: 14, scale: 2 }).notNull(),
  amountPaid: decimal('amount_paid', { precision: 14, scale: 2 }).notNull().default('0'),
  paymentMethod: varchar('payment_method', { length: 20 }).notNull(), // 'tunai' | 'transfer' | 'tempo'
  invoiceDate: timestamp('invoice_date').notNull().defaultNow(),
  dueDate: timestamp('due_date'), // Tanggal jatuh tempo jika tempo
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  tenantBranchIdx: index('supplier_invoices_tenant_branch_idx').on(table.tenantId, table.branchId),
  supplierIdx: index('supplier_invoices_supplier_idx').on(table.supplierId),
}));

export const supplierPayments = pgTable('supplier_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  supplierInvoiceId: uuid('supplier_invoice_id').notNull().references(() => supplierInvoices.id),
  amount: decimal('amount', { precision: 14, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 20 }).notNull(),
  referenceNumber: varchar('reference_number', { length: 100 }), // misal no referensi transfer
  paymentDate: timestamp('payment_date').notNull().defaultNow(),
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
  status: varchar('status', { length: 20 }).notNull().default('draft'), // 'draft' | 'ordered' | 'received' | 'completed'
  expectedDeliveryDate: timestamp('expected_delivery_date'),
  invoiceNumber: varchar('invoice_number', { length: 100 }),
  invoiceDate: timestamp('invoice_date'),
  invoiceDueDate: timestamp('invoice_due_date'),
  estimatedTotal: decimal('estimated_total', { precision: 14, scale: 2 }).notNull().default('0'),
  actualTotal: decimal('actual_total', { precision: 14, scale: 2 }),
  createdBy: uuid('created_by'), // -> users.id (for tracking who made the PO)
  approvedBy: uuid('approved_by'), // -> users.id (for tracking who approved)
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  tenantBranchIdx: index('purchase_orders_tenant_branch_idx').on(table.tenantId, table.branchId),
}));

export const purchaseOrderLines = pgTable('purchase_order_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  purchaseOrderId: uuid('purchase_order_id').notNull().references(() => purchaseOrders.id),
  inventoryItemId: uuid('inventory_item_id').notNull().references(() => inventoryItems.id),
  quantity: integer('quantity').notNull(),
  receivedQuantity: integer('received_quantity').notNull().default(0),
  unitPrice: decimal('unit_price', { precision: 14, scale: 2 }).notNull(), // estimated
  actualUnitPrice: decimal('actual_unit_price', { precision: 14, scale: 2 }), // final from invoice
});

// ==========================================================
// PRODUCT CATALOG: Device Brand/Model (kompatibilitas), Part Brand (merk sparepart)
//
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
  lastPrice: decimal('last_price', { precision: 14, scale: 2 }),
}, (table) => ({
  itemSupplierUnique: unique('product_suppliers_item_supplier_unique').on(table.inventoryItemId, table.supplierId),
}));

// ==========================================================
// POS & FINANCE
// ==========================================================

export const posTransactions = pgTable('pos_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  serviceTicketId: uuid('service_ticket_id').unique().references(() => serviceTickets.id), // null = retail langsung
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  totalAmount: decimal('total_amount', { precision: 14, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  tenantBranchIdx: index('pos_transactions_tenant_branch_idx').on(table.tenantId, table.branchId),
}));

export const invoiceLines = pgTable('invoice_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  posTransactionId: uuid('pos_transaction_id').notNull().references(() => posTransactions.id),
  description: text('description').notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: decimal('unit_price', { precision: 14, scale: 2 }).notNull(),
  sourceType: varchar('source_type', { length: 20 }).notNull(), // "part" | "labor" | "fee"
});

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  posTransactionId: uuid('pos_transaction_id').notNull().references(() => posTransactions.id),
  method: varchar('method', { length: 20 }).notNull(), // cash, qris, card, transfer
  amount: decimal('amount', { precision: 14, scale: 2 }).notNull(),
  paidAt: timestamp('paid_at').notNull().defaultNow(),
});

export const financeLedgerEntries = pgTable('finance_ledger_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  entryType: varchar('entry_type', { length: 20 }).notNull(), // "cogs" | "revenue" | "adjustment" | "loss"
  amount: decimal('amount', { precision: 14, scale: 2 }).notNull(),
  referenceType: varchar('reference_type', { length: 30 }),
  referenceId: uuid('reference_id'),
  postedAt: timestamp('posted_at').notNull().defaultNow(),
}, (table) => ({
  tenantBranchIdx: index('finance_ledger_entries_tenant_branch_idx').on(table.tenantId, table.branchId),
}));

// ==========================================================
// PAYMENT METHODS (Settings)
// ==========================================================

export const paymentMethods = pgTable('payment_methods', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: varchar('name', { length: 50 }).notNull(), // e.g., "Tunai", "BCA", "QRIS", "Tempo"
  type: varchar('type', { length: 20 }).notNull(), // "cash", "transfer", "qris", "tempo"
  isActive: boolean('is_active').notNull().default(true),
});

// ==========================================================
// AUDIT LOG: lintas modul — siapa melakukan apa, di entitas mana, kapan
// ==========================================================

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  actorId: uuid('actor_id').references(() => users.id), // null = aksi sistem/otomatis
  action: text('action').notNull(), // "ticket.transition", "stock.adjust", "role.permission_changed", dst
  entityType: varchar('entity_type', { length: 50 }).notNull(), // "service_ticket", "inventory_item", "role", dst
  entityId: uuid('entity_id'),
  changes: jsonb('changes'), // detail before/after, fleksibel per jenis aksi
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('audit_logs_tenant_idx').on(table.tenantId),
  entityIdx: index('audit_logs_entity_idx').on(table.entityType, table.entityId),
  actorIdx: index('audit_logs_actor_idx').on(table.actorId),
}));

// ==========================================================
// PRINTER: device fisik, template per ukuran kertas, dan assignment per jenis dokumen
//
// Alur konfigurasi bebas yang diminta ("label ke printer mana, invoice ke printer mana,
// atau semua ke 1 printer") dicapai lewat printerAssignments — bukan lewat flag/mode khusus.
// Kalau semua documentType di 1 branch menunjuk printerDeviceId yang sama = "1 printer untuk semua".
// Kalau beda-beda = routing per jenis dokumen. Struktur datanya sama, tidak butuh logic spesial.
// ==========================================================

export const printerDevices = pgTable('printer_devices', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  name: text('name').notNull(), // "Epson TM-T82 - Kasir 1"
  connectionType: varchar('connection_type', { length: 20 }).notNull(), // 'usb' | 'network' | 'serial' | 'os_printer'
  connectionAddress: text('connection_address'), // IP/device path — null kalau 'os_printer' (A4 lewat dialog print browser)
  paperSize: varchar('paper_size', { length: 10 }).notNull(), // '58mm' | '80mm' | 'A4' | dst — properti fisik printer ini
}, (table) => ({
  branchIdx: index('printer_devices_branch_idx').on(table.branchId),
}));

export const printerTemplates = pgTable('printer_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(), // "Struk Default 80mm", "Label Garansi", "Invoice Resmi A4"
  documentType: varchar('document_type', { length: 30 }).notNull(), // 'receipt' | 'label' | 'invoice_a4' | dst
  paperSize: varchar('paper_size', { length: 10 }).notNull(),
  layoutConfig: jsonb('layout_config').notNull(), // field mana ditampilkan & urutannya — TIDAK PERNAH berisi nilai data transaksi asli
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('printer_templates_tenant_idx').on(table.tenantId),
}));

export const printerAssignments = pgTable('printer_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  documentType: varchar('document_type', { length: 30 }).notNull(), // samakan dengan printerTemplates.documentType
  printerDeviceId: uuid('printer_device_id').notNull().references(() => printerDevices.id),
  printerTemplateId: uuid('printer_template_id').notNull().references(() => printerTemplates.id),
}, (table) => ({
  branchDocUnique: unique('printer_assignments_branch_doc_unique').on(table.branchId, table.documentType),
}));

// ==========================================================
// POS & SALES
// ==========================================================

export const posInvoices = pgTable('pos_invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
  customerName: text('customer_name'), // Opsional untuk walk-in tunai, wajib untuk tempo
  serviceTicketId: uuid('service_ticket_id').references(() => serviceTickets.id),
  subtotal: numeric('subtotal').notNull().default('0'),
  discountAmount: numeric('discount_amount').notNull().default('0'),
  taxAmount: numeric('tax_amount').notNull().default('0'),
  grandTotal: numeric('grand_total').notNull().default('0'),
  paymentStatus: varchar('payment_status', { length: 20 }).notNull(), // 'unpaid', 'partial', 'paid'
  paymentMethod: varchar('payment_method', { length: 20 }).notNull(), // 'cash', 'transfer', 'qris', 'split', 'tempo'
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
}, (table) => ({
  branchIdx: index('pos_invoices_branch_idx').on(table.branchId),
  ticketIdx: index('pos_invoices_ticket_idx').on(table.serviceTicketId),
}));

export const posInvoiceLines = pgTable('pos_invoice_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  posInvoiceId: uuid('pos_invoice_id').notNull().references(() => posInvoices.id),
  inventoryItemId: uuid('inventory_item_id').notNull().references(() => inventoryItems.id),
  partBrandId: uuid('part_brand_id').references(() => partBrands.id),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
});

export const posDrafts = pgTable('pos_drafts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  name: varchar('name', { length: 100 }).notNull(),
  cartItems: jsonb('cart_items').notNull(), // array of { inventoryItemId, quantity, unitPrice, name, sku }
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==============================================================================================
// RELATIONS (untuk relational query API Drizzle: db.query.x.findMany({ with: {...} }))
// Tambahkan relasi lain mengikuti pola yang sama kalau dibutuhkan
// ==========================================================

export const tenantsRelations = relations(tenants, ({ many }) => ({
  branches: many(branches),
  users: many(users),
  roles: many(roles),
  flowTemplates: many(flowTemplates),
  inventoryItems: many(inventoryItems),
  customers: many(customers),
  serviceTickets: many(serviceTickets),
  auditLogs: many(auditLogs),
  printerDevices: many(printerDevices),
  printerTemplates: many(printerTemplates),
}));

export const branchesRelations = relations(branches, ({ one, many }) => ({
  tenant: one(tenants, { fields: [branches.tenantId], references: [tenants.id] }),
  serviceTickets: many(serviceTickets),
  stockLevels: many(stockLevels),
  printerDevices: many(printerDevices),
  printerAssignments: many(printerAssignments),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, { fields: [users.tenantId], references: [tenants.id] }),
  roleAssignments: many(userRoleAssignments),
  auditLogs: many(auditLogs),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  tenant: one(tenants, { fields: [auditLogs.tenantId], references: [tenants.id] }),
  actor: one(users, { fields: [auditLogs.actorId], references: [users.id] }),
}));

export const printerDevicesRelations = relations(printerDevices, ({ one, many }) => ({
  branch: one(branches, { fields: [printerDevices.branchId], references: [branches.id] }),
  assignments: many(printerAssignments),
}));

export const printerTemplatesRelations = relations(printerTemplates, ({ many }) => ({
  assignments: many(printerAssignments),
}));

export const printerAssignmentsRelations = relations(printerAssignments, ({ one }) => ({
  branch: one(branches, { fields: [printerAssignments.branchId], references: [branches.id] }),
  device: one(printerDevices, { fields: [printerAssignments.printerDeviceId], references: [printerDevices.id] }),
  template: one(printerTemplates, { fields: [printerAssignments.printerTemplateId], references: [printerTemplates.id] }),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  tenant: one(tenants, { fields: [roles.tenantId], references: [tenants.id] }),
  rolePermissions: many(rolePermissions),
}));

export const flowTemplatesRelations = relations(flowTemplates, ({ one, many }) => ({
  tenant: one(tenants, { fields: [flowTemplates.tenantId], references: [tenants.id] }),
  nodes: many(flowNodes),
}));

export const flowNodesRelations = relations(flowNodes, ({ one, many }) => ({
  flowTemplate: one(flowTemplates, { fields: [flowNodes.flowTemplateId], references: [flowTemplates.id] }),
  transitionsFrom: many(flowTransitions, { relationName: 'fromNode' }),
  transitionsTo: many(flowTransitions, { relationName: 'toNode' }),
}));

export const flowTransitionsRelations = relations(flowTransitions, ({ one }) => ({
  fromNode: one(flowNodes, { fields: [flowTransitions.fromNodeId], references: [flowNodes.id], relationName: 'fromNode' }),
  toNode: one(flowNodes, { fields: [flowTransitions.toNodeId], references: [flowNodes.id], relationName: 'toNode' }),
}));

export const serviceTicketsRelations = relations(serviceTickets, ({ one, many }) => ({
  tenant: one(tenants, { fields: [serviceTickets.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [serviceTickets.branchId], references: [branches.id] }),
  customer: one(customers, { fields: [serviceTickets.customerId], references: [customers.id] }),
  customerAsset: one(customerAssets, { fields: [serviceTickets.customerAssetId], references: [customerAssets.id] }),
  flowTemplate: one(flowTemplates, { fields: [serviceTickets.flowTemplateId], references: [flowTemplates.id] }),
  currentNode: one(flowNodes, { fields: [serviceTickets.currentNodeId], references: [flowNodes.id] }),
  stageHistory: many(ticketStageHistory),
  approvalRequests: many(approvalRequests),
  stockMovements: many(stockMovements),
}));

export const inventoryItemsRelations = relations(inventoryItems, ({ one, many }) => ({
  tenant: one(tenants, { fields: [inventoryItems.tenantId], references: [tenants.id] }),
  partBrand: one(partBrands, { fields: [inventoryItems.partBrandId], references: [partBrands.id] }),
  category: one(inventoryCategories, { fields: [inventoryItems.categoryId], references: [inventoryCategories.id] }),
  stockLevels: many(stockLevels),
  stockMovements: many(stockMovements),
  stockBatches: many(stockBatches),
  compatibility: many(productCompatibility),
  productSuppliers: many(productSuppliers),
  brandPricing: many(itemBrandPricing),
}));

export const itemBrandPricingRelations = relations(itemBrandPricing, ({ one }) => ({
  inventoryItem: one(inventoryItems, { fields: [itemBrandPricing.inventoryItemId], references: [inventoryItems.id] }),
  partBrand: one(partBrands, { fields: [itemBrandPricing.partBrandId], references: [partBrands.id] }),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  inventoryItem: one(inventoryItems, { fields: [stockMovements.inventoryItemId], references: [inventoryItems.id] }),
  stockBatch: one(stockBatches, { fields: [stockMovements.stockBatchId], references: [stockBatches.id] }),
  serviceTicket: one(serviceTickets, { fields: [stockMovements.serviceTicketId], references: [serviceTickets.id] }),
}));

export const stockBatchesRelations = relations(stockBatches, ({ one, many }) => ({
  inventoryItem: one(inventoryItems, { fields: [stockBatches.inventoryItemId], references: [inventoryItems.id] }),
  partBrand: one(partBrands, { fields: [stockBatches.partBrandId], references: [partBrands.id] }),
  supplier: one(suppliers, { fields: [stockBatches.supplierId], references: [suppliers.id] }),
  purchaseOrderLine: one(purchaseOrderLines, { fields: [stockBatches.purchaseOrderLineId], references: [purchaseOrderLines.id] }),
  movements: many(stockMovements),
}));

export const posTransactionsRelations = relations(posTransactions, ({ one, many }) => ({
  serviceTicket: one(serviceTickets, { fields: [posTransactions.serviceTicketId], references: [serviceTickets.id] }),
  lines: many(invoiceLines),
  payments: many(payments),
}));

export const deviceBrandsRelations = relations(deviceBrands, ({ many }) => ({
  deviceModels: many(deviceModels),
}));

export const deviceModelsRelations = relations(deviceModels, ({ one, many }) => ({
  deviceBrand: one(deviceBrands, { fields: [deviceModels.deviceBrandId], references: [deviceBrands.id] }),
  compatibility: many(productCompatibility),
}));

export const productCompatibilityRelations = relations(productCompatibility, ({ one }) => ({
  inventoryItem: one(inventoryItems, { fields: [productCompatibility.inventoryItemId], references: [inventoryItems.id] }),
  deviceModel: one(deviceModels, { fields: [productCompatibility.deviceModelId], references: [deviceModels.id] }),
}));

export const partBrandsRelations = relations(partBrands, ({ many }) => ({
  inventoryItems: many(inventoryItems),
  supplierBrands: many(supplierBrands),
}));

export const productSuppliersRelations = relations(productSuppliers, ({ one }) => ({
  inventoryItem: one(inventoryItems, { fields: [productSuppliers.inventoryItemId], references: [inventoryItems.id] }),
  supplier: one(suppliers, { fields: [productSuppliers.supplierId], references: [suppliers.id] }),
}));

export const stockLevelsRelations = relations(stockLevels, ({ one }) => ({
  inventoryItem: one(inventoryItems, { fields: [stockLevels.inventoryItemId], references: [inventoryItems.id] }),
  branch: one(branches, { fields: [stockLevels.branchId], references: [branches.id] }),
}));

export const inventoryCategoriesRelations = relations(inventoryCategories, ({ many }) => ({
  inventoryItems: many(inventoryItems),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  tenant: one(tenants, { fields: [purchaseOrders.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [purchaseOrders.branchId], references: [branches.id] }),
  supplier: one(suppliers, { fields: [purchaseOrders.supplierId], references: [suppliers.id] }),
  purchaseOrderLines: many(purchaseOrderLines),
}));

export const purchaseOrderLinesRelations = relations(purchaseOrderLines, ({ one, many }) => ({
  purchaseOrder: one(purchaseOrders, { fields: [purchaseOrderLines.purchaseOrderId], references: [purchaseOrders.id] }),
  inventoryItem: one(inventoryItems, { fields: [purchaseOrderLines.inventoryItemId], references: [inventoryItems.id] }),
  stockBatches: many(stockBatches),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  productSuppliers: many(productSuppliers),
  purchaseOrders: many(purchaseOrders),
  stockBatches: many(stockBatches),
  supplierBrands: many(supplierBrands),
}));

export const supplierBrandsRelations = relations(supplierBrands, ({ one }) => ({
  supplier: one(suppliers, { fields: [supplierBrands.supplierId], references: [suppliers.id] }),
  partBrand: one(partBrands, { fields: [supplierBrands.partBrandId], references: [partBrands.id] }),
}));

export const posInvoicesRelations = relations(posInvoices, ({ one, many }) => ({
  tenant: one(tenants, { fields: [posInvoices.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [posInvoices.branchId], references: [branches.id] }),
  serviceTicket: one(serviceTickets, { fields: [posInvoices.serviceTicketId], references: [serviceTickets.id] }),
  creator: one(users, { fields: [posInvoices.createdBy], references: [users.id] }),
  lines: many(posInvoiceLines),
}));

export const posInvoiceLinesRelations = relations(posInvoiceLines, ({ one }) => ({
  posInvoice: one(posInvoices, { fields: [posInvoiceLines.posInvoiceId], references: [posInvoices.id] }),
  inventoryItem: one(inventoryItems, { fields: [posInvoiceLines.inventoryItemId], references: [inventoryItems.id] }),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({ one }) => ({
  tenant: one(tenants, { fields: [paymentMethods.tenantId], references: [tenants.id] }),
}));

export const supplierInvoicesRelations = relations(supplierInvoices, ({ one, many }) => ({
  tenant: one(tenants, { fields: [supplierInvoices.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [supplierInvoices.branchId], references: [branches.id] }),
  supplier: one(suppliers, { fields: [supplierInvoices.supplierId], references: [suppliers.id] }),
  purchaseOrder: one(purchaseOrders, { fields: [supplierInvoices.purchaseOrderId], references: [purchaseOrders.id] }),
  payments: many(supplierPayments),
}));

export const supplierPaymentsRelations = relations(supplierPayments, ({ one }) => ({
  tenant: one(tenants, { fields: [supplierPayments.tenantId], references: [tenants.id] }),
  supplierInvoice: one(supplierInvoices, { fields: [supplierPayments.supplierInvoiceId], references: [supplierInvoices.id] }),
  createdBy: one(users, { fields: [supplierPayments.createdBy], references: [users.id] }),
}));
