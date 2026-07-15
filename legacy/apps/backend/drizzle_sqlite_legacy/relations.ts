import { relations } from "drizzle-orm/relations";
import { categories, products, productBatches, suppliers, productVariants, users, notifications, paymentMethods, paymentVariants, activityLogs, purchaseReturns, purchaseReturnItems, sales, saleItems, services, salePayments, purchases, defectiveItems, purchaseItems, members, roles, categoryVariants, stockOpnameSessions, stockOpnameItems, operationalCosts, productDeviceCompatibility, devices } from "./schema";

export const productsRelations = relations(products, ({one, many}) => ({
	category: one(categories, {
		fields: [products.categoryId],
		references: [categories.id]
	}),
	productBatches: many(productBatches),
	purchaseReturnItems: many(purchaseReturnItems),
	saleItems: many(saleItems),
	defectiveItems: many(defectiveItems),
	purchaseItems: many(purchaseItems),
	stockOpnameItems: many(stockOpnameItems),
	productVariants: many(productVariants),
	productDeviceCompatibilities: many(productDeviceCompatibility),
}));

export const categoriesRelations = relations(categories, ({one, many}) => ({
	products: many(products),
	category: one(categories, {
		fields: [categories.parentId],
		references: [categories.id],
		relationName: "categories_parentId_categories_id"
	}),
	categories: many(categories, {
		relationName: "categories_parentId_categories_id"
	}),
	categoryVariants: many(categoryVariants),
}));

export const productBatchesRelations = relations(productBatches, ({one, many}) => ({
	product: one(products, {
		fields: [productBatches.productId],
		references: [products.id]
	}),
	supplier: one(suppliers, {
		fields: [productBatches.supplierId],
		references: [suppliers.id]
	}),
	productVariant: one(productVariants, {
		fields: [productBatches.variantId],
		references: [productVariants.id]
	}),
	purchaseReturnItems: many(purchaseReturnItems),
	saleItems: many(saleItems),
	defectiveItems: many(defectiveItems),
	purchaseItems: many(purchaseItems),
	stockOpnameItems: many(stockOpnameItems),
}));

export const suppliersRelations = relations(suppliers, ({many}) => ({
	productBatches: many(productBatches),
	purchaseReturns: many(purchaseReturns),
	purchases: many(purchases),
	defectiveItems: many(defectiveItems),
	categoryVariants: many(categoryVariants),
}));

export const productVariantsRelations = relations(productVariants, ({one, many}) => ({
	productBatches: many(productBatches),
	product: one(products, {
		fields: [productVariants.productId],
		references: [products.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	notifications: many(notifications),
	activityLogs: many(activityLogs),
	purchaseReturns: many(purchaseReturns),
	services_technicianId: many(services, {
		relationName: "services_technicianId_users_id"
	}),
	services_createdBy: many(services, {
		relationName: "services_createdBy_users_id"
	}),
	purchases: many(purchases),
	sales: many(sales),
	role: one(roles, {
		fields: [users.role],
		references: [roles.id]
	}),
	stockOpnameSessions: many(stockOpnameSessions),
	operationalCosts: many(operationalCosts),
}));

export const paymentVariantsRelations = relations(paymentVariants, ({one, many}) => ({
	paymentMethod: one(paymentMethods, {
		fields: [paymentVariants.methodId],
		references: [paymentMethods.id]
	}),
	salePayments: many(salePayments),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({many}) => ({
	paymentVariants: many(paymentVariants),
	salePayments: many(salePayments),
}));

export const activityLogsRelations = relations(activityLogs, ({one}) => ({
	user: one(users, {
		fields: [activityLogs.userId],
		references: [users.id]
	}),
}));

export const purchaseReturnsRelations = relations(purchaseReturns, ({one, many}) => ({
	supplier: one(suppliers, {
		fields: [purchaseReturns.supplierId],
		references: [suppliers.id]
	}),
	user: one(users, {
		fields: [purchaseReturns.userId],
		references: [users.id]
	}),
	purchaseReturnItems: many(purchaseReturnItems),
}));

export const purchaseReturnItemsRelations = relations(purchaseReturnItems, ({one}) => ({
	purchaseReturn: one(purchaseReturns, {
		fields: [purchaseReturnItems.returnId],
		references: [purchaseReturns.id]
	}),
	product: one(products, {
		fields: [purchaseReturnItems.productId],
		references: [products.id]
	}),
	productBatch: one(productBatches, {
		fields: [purchaseReturnItems.batchId],
		references: [productBatches.id]
	}),
}));

export const saleItemsRelations = relations(saleItems, ({one}) => ({
	sale: one(sales, {
		fields: [saleItems.saleId],
		references: [sales.id]
	}),
	product: one(products, {
		fields: [saleItems.productId],
		references: [products.id]
	}),
	productBatch: one(productBatches, {
		fields: [saleItems.batchId],
		references: [productBatches.id]
	}),
}));

export const salesRelations = relations(sales, ({one, many}) => ({
	saleItems: many(saleItems),
	salePayments: many(salePayments),
	member: one(members, {
		fields: [sales.memberId],
		references: [members.id]
	}),
	user: one(users, {
		fields: [sales.userId],
		references: [users.id]
	}),
}));

export const servicesRelations = relations(services, ({one}) => ({
	user_technicianId: one(users, {
		fields: [services.technicianId],
		references: [users.id],
		relationName: "services_technicianId_users_id"
	}),
	user_createdBy: one(users, {
		fields: [services.createdBy],
		references: [users.id],
		relationName: "services_createdBy_users_id"
	}),
}));

export const salePaymentsRelations = relations(salePayments, ({one}) => ({
	sale: one(sales, {
		fields: [salePayments.saleId],
		references: [sales.id]
	}),
	paymentMethod: one(paymentMethods, {
		fields: [salePayments.methodId],
		references: [paymentMethods.id]
	}),
	paymentVariant: one(paymentVariants, {
		fields: [salePayments.variantId],
		references: [paymentVariants.id]
	}),
}));

export const purchasesRelations = relations(purchases, ({one, many}) => ({
	supplier: one(suppliers, {
		fields: [purchases.supplierId],
		references: [suppliers.id]
	}),
	user: one(users, {
		fields: [purchases.userId],
		references: [users.id]
	}),
	purchaseItems: many(purchaseItems),
}));

export const defectiveItemsRelations = relations(defectiveItems, ({one}) => ({
	product: one(products, {
		fields: [defectiveItems.productId],
		references: [products.id]
	}),
	productBatch: one(productBatches, {
		fields: [defectiveItems.batchId],
		references: [productBatches.id]
	}),
	supplier: one(suppliers, {
		fields: [defectiveItems.supplierId],
		references: [suppliers.id]
	}),
}));

export const purchaseItemsRelations = relations(purchaseItems, ({one}) => ({
	purchase: one(purchases, {
		fields: [purchaseItems.purchaseId],
		references: [purchases.id]
	}),
	product: one(products, {
		fields: [purchaseItems.productId],
		references: [products.id]
	}),
	productBatch: one(productBatches, {
		fields: [purchaseItems.batchId],
		references: [productBatches.id]
	}),
}));

export const membersRelations = relations(members, ({many}) => ({
	sales: many(sales),
}));

export const rolesRelations = relations(roles, ({many}) => ({
	users: many(users),
}));

export const categoryVariantsRelations = relations(categoryVariants, ({one}) => ({
	category: one(categories, {
		fields: [categoryVariants.categoryId],
		references: [categories.id]
	}),
	supplier: one(suppliers, {
		fields: [categoryVariants.supplierId],
		references: [suppliers.id]
	}),
}));

export const stockOpnameSessionsRelations = relations(stockOpnameSessions, ({one, many}) => ({
	user: one(users, {
		fields: [stockOpnameSessions.userId],
		references: [users.id]
	}),
	stockOpnameItems: many(stockOpnameItems),
}));

export const stockOpnameItemsRelations = relations(stockOpnameItems, ({one}) => ({
	stockOpnameSession: one(stockOpnameSessions, {
		fields: [stockOpnameItems.sessionId],
		references: [stockOpnameSessions.id]
	}),
	product: one(products, {
		fields: [stockOpnameItems.productId],
		references: [products.id]
	}),
	productBatch: one(productBatches, {
		fields: [stockOpnameItems.batchId],
		references: [productBatches.id]
	}),
}));

export const operationalCostsRelations = relations(operationalCosts, ({one}) => ({
	user: one(users, {
		fields: [operationalCosts.userId],
		references: [users.id]
	}),
}));

export const productDeviceCompatibilityRelations = relations(productDeviceCompatibility, ({one}) => ({
	product: one(products, {
		fields: [productDeviceCompatibility.productId],
		references: [products.id]
	}),
	device: one(devices, {
		fields: [productDeviceCompatibility.deviceId],
		references: [devices.id]
	}),
}));

export const devicesRelations = relations(devices, ({many}) => ({
	productDeviceCompatibilities: many(productDeviceCompatibility),
}));