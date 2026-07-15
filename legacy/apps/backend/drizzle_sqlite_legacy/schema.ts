import { pgTable, foreignKey, unique, text, integer, timestamp, boolean, serial, json, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const products = pgTable("products", {
	id: text().primaryKey().notNull(),
	code: text(),
	name: text().notNull(),
	categoryId: text("category_id"),
	image: text(),
	stock: integer().default(0).notNull(),
	minStock: integer("min_stock").default(5),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "products_category_id_categories_id_fk"
		}),
	unique("products_code_unique").on(table.code),
]);

export const members = pgTable("members", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	phone: text().notNull(),
	email: text(),
	discountPercent: integer("discount_percent").default(0),
	points: integer().default(0),
	debt: integer().default(0),
	creditLimit: integer("credit_limit").default(0),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("members_phone_unique").on(table.phone),
]);

export const categories = pgTable("categories", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	parentId: text("parent_id"),
}, (table) => [
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "categories_parent_id_fkey"
		}),
]);

export const paymentMethods = pgTable("payment_methods", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	type: text().notNull(),
	icon: text().default('💳').notNull(),
	enabled: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const productBatches = pgTable("product_batches", {
	id: text().primaryKey().notNull(),
	productId: text("product_id").notNull(),
	supplierId: text("supplier_id"),
	variant: text(),
	supplierName: text("supplier_name"),
	buyPrice: integer("buy_price").notNull(),
	sellPrice: integer("sell_price").notNull(),
	initialStock: integer("initial_stock").notNull(),
	currentStock: integer("current_stock").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	variantId: text("variant_id"),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_batches_product_id_products_id_fk"
		}),
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [suppliers.id],
			name: "product_batches_supplier_id_suppliers_id_fk"
		}),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [productVariants.id],
			name: "product_batches_variant_id_product_variants_id_fk"
		}),
]);

export const notifications = pgTable("notifications", {
	id: serial().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	type: text().notNull(),
	title: text().notNull(),
	message: text().notNull(),
	entityType: text("entity_type"),
	entityId: text("entity_id"),
	isRead: boolean("is_read").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notifications_user_id_users_id_fk"
		}),
]);

export const paymentVariants = pgTable("payment_variants", {
	id: text().primaryKey().notNull(),
	methodId: text("method_id").notNull(),
	name: text().notNull(),
	accountNumber: text("account_number"),
	accountHolder: text("account_holder"),
	enabled: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.methodId],
			foreignColumns: [paymentMethods.id],
			name: "payment_variants_method_id_payment_methods_id_fk"
		}),
]);

export const activityLogs = pgTable("activity_logs", {
	id: serial().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	action: text().notNull(),
	entityType: text("entity_type").notNull(),
	entityId: text("entity_id").notNull(),
	oldValue: json("old_value"),
	newValue: json("new_value"),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "activity_logs_user_id_users_id_fk"
		}),
]);

export const purchaseReturns = pgTable("purchase_returns", {
	id: text().primaryKey().notNull(),
	supplierId: text("supplier_id").notNull(),
	userId: text("user_id").notNull(),
	date: timestamp({ mode: 'string' }).defaultNow(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [suppliers.id],
			name: "purchase_returns_supplier_id_suppliers_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "purchase_returns_user_id_users_id_fk"
		}),
]);

export const purchaseReturnItems = pgTable("purchase_return_items", {
	id: serial().primaryKey().notNull(),
	returnId: text("return_id").notNull(),
	productId: text("product_id").notNull(),
	batchId: text("batch_id").notNull(),
	qty: integer().notNull(),
	reason: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.returnId],
			foreignColumns: [purchaseReturns.id],
			name: "purchase_return_items_return_id_purchase_returns_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "purchase_return_items_product_id_products_id_fk"
		}),
	foreignKey({
			columns: [table.batchId],
			foreignColumns: [productBatches.id],
			name: "purchase_return_items_batch_id_product_batches_id_fk"
		}),
]);

export const saleItems = pgTable("sale_items", {
	id: serial().primaryKey().notNull(),
	saleId: text("sale_id").notNull(),
	productId: text("product_id").notNull(),
	batchId: text("batch_id").notNull(),
	variant: text(),
	qty: integer().notNull(),
	price: integer().notNull(),
	subtotal: integer().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.saleId],
			foreignColumns: [sales.id],
			name: "sale_items_sale_id_sales_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "sale_items_product_id_products_id_fk"
		}),
	foreignKey({
			columns: [table.batchId],
			foreignColumns: [productBatches.id],
			name: "sale_items_batch_id_product_batches_id_fk"
		}),
]);

export const services = pgTable("services", {
	id: serial().primaryKey().notNull(),
	no: text().notNull(),
	customer: json().notNull(),
	device: json().notNull(),
	complaint: text().notNull(),
	diagnosis: text(),
	notes: text(),
	status: text().default('antrian'),
	technicianId: text("technician_id"),
	createdBy: text("created_by"),
	costEstimate: integer("cost_estimate"),
	actualCost: integer("actual_cost"),
	dateIn: timestamp("date_in", { mode: 'string' }).defaultNow(),
	dateOut: timestamp("date_out", { mode: 'string' }),
	estimatedCompletionDate: timestamp("estimated_completion_date", { mode: 'string' }),
	parts: json(),
	qc: json(),
	reconfirmationCount: integer("reconfirmation_count").default(0),
	warranty: text(),
	warrantyExpiryDate: timestamp("warranty_expiry_date", { mode: 'string' }),
	priority: text().default('standard'),
	isDirectComplete: boolean("is_direct_complete").default(false),
}, (table) => [
	foreignKey({
			columns: [table.technicianId],
			foreignColumns: [users.id],
			name: "services_technician_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "services_created_by_users_id_fk"
		}),
	unique("services_no_unique").on(table.no),
]);

export const salePayments = pgTable("sale_payments", {
	id: serial().primaryKey().notNull(),
	saleId: text("sale_id").notNull(),
	amount: integer().notNull(),
	method: text().notNull(),
	methodId: text("method_id"),
	variantName: text("variant_name"),
	variantId: text("variant_id"),
	reference: text(),
	proofImage: text("proof_image"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.saleId],
			foreignColumns: [sales.id],
			name: "sale_payments_sale_id_sales_id_fk"
		}),
	foreignKey({
			columns: [table.methodId],
			foreignColumns: [paymentMethods.id],
			name: "sale_payments_method_id_payment_methods_id_fk"
		}),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [paymentVariants.id],
			name: "sale_payments_variant_id_payment_variants_id_fk"
		}),
]);

export const settings = pgTable("settings", {
	key: text().primaryKey().notNull(),
	value: json().notNull(),
});

export const purchases = pgTable("purchases", {
	id: text().primaryKey().notNull(),
	supplierId: text("supplier_id").notNull(),
	userId: text("user_id"),
	totalAmount: integer("total_amount").notNull(),
	notes: text(),
	date: timestamp({ mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [suppliers.id],
			name: "purchases_supplier_id_suppliers_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "purchases_user_id_users_id_fk"
		}),
]);

export const suppliers = pgTable("suppliers", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	contact: text(),
	phone: text(),
	address: text(),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const defectiveItems = pgTable("defective_items", {
	id: text().primaryKey().notNull(),
	productId: text("product_id").notNull(),
	batchId: text("batch_id").notNull(),
	supplierId: text("supplier_id").notNull(),
	qty: integer().notNull(),
	source: text().notNull(),
	sourceRefId: text("source_ref_id"),
	reason: text(),
	status: text().default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "defective_items_product_id_products_id_fk"
		}),
	foreignKey({
			columns: [table.batchId],
			foreignColumns: [productBatches.id],
			name: "defective_items_batch_id_product_batches_id_fk"
		}),
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [suppliers.id],
			name: "defective_items_supplier_id_suppliers_id_fk"
		}),
]);

export const purchaseItems = pgTable("purchase_items", {
	id: serial().primaryKey().notNull(),
	purchaseId: text("purchase_id").notNull(),
	productId: text("product_id").notNull(),
	variant: text(),
	qtyOrdered: integer("qty_ordered").notNull(),
	qtyReceived: integer("qty_received").notNull(),
	buyPrice: integer("buy_price").notNull(),
	sellPrice: integer("sell_price").notNull(),
	batchId: text("batch_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.purchaseId],
			foreignColumns: [purchases.id],
			name: "purchase_items_purchase_id_purchases_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "purchase_items_product_id_products_id_fk"
		}),
	foreignKey({
			columns: [table.batchId],
			foreignColumns: [productBatches.id],
			name: "purchase_items_batch_id_product_batches_id_fk"
		}),
]);

export const sales = pgTable("sales", {
	id: text().primaryKey().notNull(),
	memberId: text("member_id"),
	customerName: text("customer_name"),
	totalAmount: integer("total_amount").notNull(),
	discountAmount: integer("discount_amount").default(0),
	finalAmount: integer("final_amount").notNull(),
	paymentMethod: text("payment_method").notNull(),
	paymentStatus: text("payment_status").default('paid').notNull(),
	userId: text("user_id").notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.memberId],
			foreignColumns: [members.id],
			name: "sales_member_id_members_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sales_user_id_users_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: text().primaryKey().notNull(),
	username: text().notNull(),
	password: text().notNull(),
	role: text().default('teknisi').notNull(),
	name: text().notNull(),
	image: text(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	commissionConfig: json("commission_config"),
}, (table) => [
	foreignKey({
			columns: [table.role],
			foreignColumns: [roles.id],
			name: "users_role_roles_id_fk"
		}),
	unique("users_username_unique").on(table.username),
]);

export const roles = pgTable("roles", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	permissions: json().default([]).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const brands = pgTable("brands", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	logo: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const categoryVariants = pgTable("category_variants", {
	id: serial().primaryKey().notNull(),
	categoryId: text("category_id").notNull(),
	name: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	supplierId: text("supplier_id"),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "category_variants_category_id_categories_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [suppliers.id],
			name: "category_variants_supplier_id_suppliers_id_fk"
		}),
]);

export const stockOpnameSessions = pgTable("stock_opname_sessions", {
	id: text().primaryKey().notNull(),
	status: text().default('draft'),
	userId: text("user_id").notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "stock_opname_sessions_user_id_users_id_fk"
		}),
]);

export const stockOpnameItems = pgTable("stock_opname_items", {
	id: serial().primaryKey().notNull(),
	sessionId: text("session_id").notNull(),
	productId: text("product_id").notNull(),
	batchId: text("batch_id"),
	systemStock: integer("system_stock").notNull(),
	physicalStock: integer("physical_stock"),
	difference: integer(),
	adjustmentReason: text("adjustment_reason"),
	variantName: text("variant_name"),
}, (table) => [
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [stockOpnameSessions.id],
			name: "stock_opname_items_session_id_stock_opname_sessions_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "stock_opname_items_product_id_products_id_fk"
		}),
	foreignKey({
			columns: [table.batchId],
			foreignColumns: [productBatches.id],
			name: "stock_opname_items_batch_id_product_batches_id_fk"
		}),
]);

export const productVariants = pgTable("product_variants", {
	id: text().primaryKey().notNull(),
	productId: text("product_id").notNull(),
	name: text().notNull(),
	image: text(),
	sku: text(),
	defaultPrice: integer("default_price"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_variants_product_id_products_id_fk"
		}),
]);

export const devices = pgTable("devices", {
	id: text().primaryKey().notNull(),
	brand: text().notNull(),
	model: text().notNull(),
	code: text(),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	series: text(),
	colors: json(),
	specs: text(),
	chipset: text(),
	specifications: json(),
});

export const serviceTools = pgTable("service_tools", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	brand: text(),
	qty: integer().default(1).notNull(),
	condition: text().default('good'),
	purchaseDate: timestamp("purchase_date", { mode: 'string' }),
	price: integer(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const operationalCosts = pgTable("operational_costs", {
	id: serial().primaryKey().notNull(),
	category: text().notNull(),
	amount: integer().notNull(),
	date: timestamp({ mode: 'string' }).defaultNow(),
	description: text(),
	userId: text("user_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "operational_costs_user_id_users_id_fk"
		}),
]);

export const productDeviceCompatibility = pgTable("product_device_compatibility", {
	productId: text("product_id").notNull(),
	deviceId: text("device_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_device_compatibility_product_id_products_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.deviceId],
			foreignColumns: [devices.id],
			name: "product_device_compatibility_device_id_devices_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.productId, table.deviceId], name: "product_device_compatibility_product_id_device_id_pk"}),
]);
