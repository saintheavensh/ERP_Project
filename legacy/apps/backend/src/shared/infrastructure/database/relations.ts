import { relations } from "drizzle-orm";
import * as UserSchema from "../../../modules/05-shared/users/infrastructure/schema/UserSchema";
import * as ServiceSchema from "../../../modules/03-sales/service/infrastructure/schema/ServiceSchema";
import * as SaleSchema from "../../../modules/03-sales/sales/infrastructure/schema/SaleSchema";
import * as PurchaseSchema from "../../../modules/01-purchases/purchases/infrastructure/schema/PurchaseSchema";
import * as ProductSchema from "../../../modules/02-inventory/products/infrastructure/schema/ProductSchema";
import * as BatchSchema from "../../../modules/02-inventory/inventory/infrastructure/schema/BatchSchema";
import * as VariantSchema from "../../../modules/02-inventory/inventory/infrastructure/schema/VariantSchema";
import * as MemberSchema from "../../../modules/03-sales/customers/infrastructure/schema/MemberSchema";
import * as SupplierSchema from "../../../modules/01-purchases/suppliers/infrastructure/schema/SupplierSchema";
import * as CategorySchema from "../../../modules/02-inventory/categories/infrastructure/schema/CategorySchema";
import * as StockOpnameSchema from "../../../modules/02-inventory/inventory/infrastructure/schema/StockOpnameSchema";
import * as DefectiveItemSchema from "../../../modules/02-inventory/inventory/infrastructure/schema/DefectiveItemSchema";
import * as GamblingSchema from "../../../modules/02-inventory/inventory/infrastructure/schema/GamblingSchema";
import * as AccountingSchema from "../../../modules/04-finance/accounting/infrastructure/schema/AccountingSchema";
import * as ActivitySchema from "../../../modules/05-shared/dashboard/infrastructure/schema/ActivitySchema";
import * as DeviceSchema from "../../../modules/05-shared/devices/infrastructure/schema/DeviceSchema";
import * as BrandSchema from "../../../modules/05-shared/devices/infrastructure/schema/BrandSchema";
import * as AppSettingSchema from "../../../modules/05-shared/settings/infrastructure/schema/AppSettingSchema";
import * as ApprovalSchema from "../../../modules/04-finance/approvals/infrastructure/schema/ApprovalSchema";

// ============================================
// USERS
// ============================================

export const userRolesRelations = relations(UserSchema.userRoles, ({ one }) => ({
    user: one(UserSchema.users, {
        fields: [UserSchema.userRoles.userId],
        references: [UserSchema.users.id],
    }),
    roleDetail: one(UserSchema.roles, {
        fields: [UserSchema.userRoles.role],
        references: [UserSchema.roles.id],
    }),
}));


export const rolesRelations = relations(UserSchema.roles, ({ many }) => ({
    users: many(UserSchema.userRoles),
}));

export const usersRelations = relations(UserSchema.users, ({ many, one }) => ({
    roles: many(UserSchema.userRoles),
    roleDetail: one(UserSchema.roles, {
        fields: [UserSchema.users.role],
        references: [UserSchema.roles.id],
    }),
    services: many(ServiceSchema.services),
    sales: many(SaleSchema.sales),
    purchases: many(PurchaseSchema.purchases),
    activityLogs: many(ActivitySchema.activityLogs),
    notifications: many(ActivitySchema.notifications),
    technicianCommissionSettings: many(ServiceSchema.technicianCommissionSettings),
    technicianCommissions: many(ServiceSchema.technicianCommissions),
}));


// ============================================
// SERVICES
// ============================================

export const servicesRelations = relations(ServiceSchema.services, ({ many, one }) => ({
    items: many(ServiceSchema.serviceItems),
    technician: one(UserSchema.users, {
        fields: [ServiceSchema.services.technicianId],
        references: [UserSchema.users.id],
    }),
    creator: one(UserSchema.users, {
        fields: [ServiceSchema.services.createdBy],
        references: [UserSchema.users.id],
    }),
    gamblingTestLogs: many(GamblingSchema.gamblingTestLogs),
    forfeitedDevices: many(GamblingSchema.forfeitedDevices),
    partHarvestLogs: many(GamblingSchema.partHarvestLogs),
}));



export const serviceItemsRelations = relations(ServiceSchema.serviceItems, ({ one, many }) => ({
    service: one(ServiceSchema.services, {
        fields: [ServiceSchema.serviceItems.serviceId],
        references: [ServiceSchema.services.id],
    }),
    parts: many(ServiceSchema.serviceParts),
    serviceType: one(ServiceSchema.serviceTypes, {
        fields: [ServiceSchema.serviceItems.serviceTypeId],
        references: [ServiceSchema.serviceTypes.id],
    }),
    technician: one(UserSchema.users, {
        fields: [ServiceSchema.serviceItems.technicianId],
        references: [UserSchema.users.id],
    }),
}));

export const servicePartsRelations = relations(ServiceSchema.serviceParts, ({ one }) => ({
    serviceItem: one(ServiceSchema.serviceItems, {
        fields: [ServiceSchema.serviceParts.serviceItemId],
        references: [ServiceSchema.serviceItems.id],
    }),
    variantBatch: one(BatchSchema.productBatches, {
        fields: [ServiceSchema.serviceParts.variantBatchId],
        references: [BatchSchema.productBatches.id],
    }),
}));

export const serviceToolsRelations = relations(ServiceSchema.serviceTools, ({ one }) => ({
    user: one(UserSchema.users, {
        fields: [ServiceSchema.serviceTools.userId],
        references: [UserSchema.users.id],
    }),
}));

export const serviceToolRequestsRelations = relations(ServiceSchema.serviceToolRequests, ({ one }) => ({
    user: one(UserSchema.users, {
        fields: [ServiceSchema.serviceToolRequests.userId],
        references: [UserSchema.users.id],
    }),
}));

export const serviceCategoriesRelations = relations(ServiceSchema.serviceCategories, ({ many }) => ({
    serviceTypes: many(ServiceSchema.serviceTypes),
}));

export const serviceTypesRelations = relations(ServiceSchema.serviceTypes, ({ one, many }) => ({
    category: one(ServiceSchema.serviceCategories, {
        fields: [ServiceSchema.serviceTypes.categoryId],
        references: [ServiceSchema.serviceCategories.id],
    }),
    serviceItems: many(ServiceSchema.serviceItems),
}));

export const technicianCommissionSettingsRelations = relations(ServiceSchema.technicianCommissionSettings, ({ one }) => ({
    technician: one(UserSchema.users, {
        fields: [ServiceSchema.technicianCommissionSettings.technicianId],
        references: [UserSchema.users.id],
    }),
}));

export const technicianCommissionsRelations = relations(ServiceSchema.technicianCommissions, ({ one }) => ({
    technician: one(UserSchema.users, {
        fields: [ServiceSchema.technicianCommissions.technicianId],
        references: [UserSchema.users.id],
    }),
    serviceItem: one(ServiceSchema.serviceItems, {
        fields: [ServiceSchema.technicianCommissions.serviceItemId],
        references: [ServiceSchema.serviceItems.id],
    }),
}));


// ============================================
// SALES
// ============================================

export const membersRelations = relations(MemberSchema.members, ({ many }) => ({
    sales: many(SaleSchema.sales),
}));


export const salesRelations = relations(SaleSchema.sales, ({ one, many }) => ({
    member: one(MemberSchema.members, {
        fields: [SaleSchema.sales.memberId],
        references: [MemberSchema.members.id],
    }),
    user: one(UserSchema.users, {
        fields: [SaleSchema.sales.userId],
        references: [UserSchema.users.id],
    }),
    items: many(SaleSchema.saleItems),
    payments: many(SaleSchema.salePayments),
}));

export const saleItemsRelations = relations(SaleSchema.saleItems, ({ one }) => ({
    sale: one(SaleSchema.sales, {
        fields: [SaleSchema.saleItems.saleId],
        references: [SaleSchema.sales.id],
    }),
    product: one(ProductSchema.products, {
        fields: [SaleSchema.saleItems.productId],
        references: [ProductSchema.products.id],
    }),
    batch: one(BatchSchema.productBatches, {
        fields: [SaleSchema.saleItems.batchId],
        references: [BatchSchema.productBatches.id],
    }),
}));

export const salePaymentsRelations = relations(SaleSchema.salePayments, ({ one }) => ({
    sale: one(SaleSchema.sales, {
        fields: [SaleSchema.salePayments.saleId],
        references: [SaleSchema.sales.id],
    }),
    paymentMethod: one(SaleSchema.paymentMethods, {
        fields: [SaleSchema.salePayments.methodId],
        references: [SaleSchema.paymentMethods.id],
    }),
    paymentVariant: one(SaleSchema.paymentVariants, {
        fields: [SaleSchema.salePayments.variantId],
        references: [SaleSchema.paymentVariants.id],
    }),
}));

export const paymentMethodsRelations = relations(SaleSchema.paymentMethods, ({ many }) => ({
    variants: many(SaleSchema.paymentVariants),
}));

export const paymentVariantsRelations = relations(SaleSchema.paymentVariants, ({ one }) => ({
    method: one(SaleSchema.paymentMethods, {
        fields: [SaleSchema.paymentVariants.methodId],
        references: [SaleSchema.paymentMethods.id],
    }),
}));

// ============================================
// PURCHASES
// ============================================

export const purchasesRelations = relations(PurchaseSchema.purchases, ({ one, many }) => ({
    supplier: one(SupplierSchema.suppliers, {
        fields: [PurchaseSchema.purchases.supplierId],
        references: [SupplierSchema.suppliers.id],
    }),
    user: one(UserSchema.users, {
        fields: [PurchaseSchema.purchases.userId],
        references: [UserSchema.users.id],
    }),
    items: many(PurchaseSchema.purchaseItems),
    payments: many(PurchaseSchema.purchasePayments),
}));

export const purchaseItemsRelations = relations(PurchaseSchema.purchaseItems, ({ one }) => ({
    purchase: one(PurchaseSchema.purchases, {
        fields: [PurchaseSchema.purchaseItems.purchaseId],
        references: [PurchaseSchema.purchases.id],
    }),
    product: one(ProductSchema.products, {
        fields: [PurchaseSchema.purchaseItems.productId],
        references: [ProductSchema.products.id],
    }),
    batch: one(BatchSchema.productBatches, {
        fields: [PurchaseSchema.purchaseItems.batchId],
        references: [BatchSchema.productBatches.id],
    }),
}));

export const purchasePaymentsRelations = relations(PurchaseSchema.purchasePayments, ({ one }) => ({
    purchase: one(PurchaseSchema.purchases, {
        fields: [PurchaseSchema.purchasePayments.purchaseId],
        references: [PurchaseSchema.purchases.id],
    }),
    supplier: one(SupplierSchema.suppliers, {
        fields: [PurchaseSchema.purchasePayments.supplierId],
        references: [SupplierSchema.suppliers.id],
    }),
    createdByUser: one(UserSchema.users, {
        fields: [PurchaseSchema.purchasePayments.createdBy],
        references: [UserSchema.users.id],
    }),
}));

export const purchaseReturnsRelations = relations(PurchaseSchema.purchaseReturns, ({ one, many }) => ({
    supplier: one(SupplierSchema.suppliers, {
        fields: [PurchaseSchema.purchaseReturns.supplierId],
        references: [SupplierSchema.suppliers.id],
    }),
    user: one(UserSchema.users, {
        fields: [PurchaseSchema.purchaseReturns.userId],
        references: [UserSchema.users.id],
    }),
    items: many(PurchaseSchema.purchaseReturnItems),
}));

export const purchaseReturnItemsRelations = relations(PurchaseSchema.purchaseReturnItems, ({ one }) => ({
    return: one(PurchaseSchema.purchaseReturns, {
        fields: [PurchaseSchema.purchaseReturnItems.returnId],
        references: [PurchaseSchema.purchaseReturns.id],
    }),
    product: one(ProductSchema.products, {
        fields: [PurchaseSchema.purchaseReturnItems.productId],
        references: [ProductSchema.products.id],
    }),
    batch: one(BatchSchema.productBatches, {
        fields: [PurchaseSchema.purchaseReturnItems.batchId],
        references: [BatchSchema.productBatches.id],
    }),
}));

// ============================================
// PRODUCTS & INVENTORY
// ============================================

export const productsRelations = relations(ProductSchema.products, ({ one, many }) => ({
    category: one(CategorySchema.categories, {
        fields: [ProductSchema.products.categoryId],
        references: [CategorySchema.categories.id],
    }),
    brand: one(BrandSchema.brands, {
        fields: [ProductSchema.products.brandId],
        references: [BrandSchema.brands.id],
    }),

    variants: many(VariantSchema.productVariants),
    batches: many(BatchSchema.productBatches),
    stockOpnameSessions: many(StockOpnameSchema.stockOpnameSessions),
    compatibleDevices: many(DeviceSchema.productDeviceCompatibility),
}));


export const productVariantsRelations = relations(VariantSchema.productVariants, ({ one, many }) => ({
    product: one(ProductSchema.products, {
        fields: [VariantSchema.productVariants.productId],
        references: [ProductSchema.products.id],
    }),
    batches: many(BatchSchema.productBatches),
    supplierBrands: many(SupplierSchema.supplierBrands),
}));

export const productBatchesRelations = relations(BatchSchema.productBatches, ({ one, many }) => ({
    product: one(ProductSchema.products, {
        fields: [BatchSchema.productBatches.productId],
        references: [ProductSchema.products.id],
    }),
    supplier: one(SupplierSchema.suppliers, {
        fields: [BatchSchema.productBatches.supplierId],
        references: [SupplierSchema.suppliers.id],
    }),
    variantLink: one(VariantSchema.productVariants, {
        fields: [BatchSchema.productBatches.variantId],
        references: [VariantSchema.productVariants.id],
    }),
    purchaseItems: many(PurchaseSchema.purchaseItems),
    saleItems: many(SaleSchema.saleItems),
}));

export const categoriesRelations = relations(CategorySchema.categories, ({ many }) => ({
    products: many(ProductSchema.products),
    variantTemplates: many(CategorySchema.categoryVariants),
}));

export const categoryVariantsRelations = relations(CategorySchema.categoryVariants, ({ one }) => ({
    category: one(CategorySchema.categories, {
        fields: [CategorySchema.categoryVariants.categoryId],
        references: [CategorySchema.categories.id],
    }),
    supplier: one(SupplierSchema.suppliers, {
        fields: [CategorySchema.categoryVariants.supplierId],
        references: [SupplierSchema.suppliers.id],
    }),
}));

export const supplierCategoriesRelations = relations(CategorySchema.supplierCategories, ({ one }) => ({
    supplier: one(SupplierSchema.suppliers, {
        fields: [CategorySchema.supplierCategories.supplierId],
        references: [SupplierSchema.suppliers.id],
    }),
    category: one(CategorySchema.categories, {
        fields: [CategorySchema.supplierCategories.categoryId],
        references: [CategorySchema.categories.id],
    }),
}));

export const stockOpnameSessionsRelations = relations(StockOpnameSchema.stockOpnameSessions, ({ one, many }) => ({
    creator: one(UserSchema.users, {
        fields: [StockOpnameSchema.stockOpnameSessions.userId],
        references: [UserSchema.users.id],
    }),
    items: many(StockOpnameSchema.stockOpnameItems),
}));

export const stockOpnameItemsRelations = relations(StockOpnameSchema.stockOpnameItems, ({ one }) => ({
    session: one(StockOpnameSchema.stockOpnameSessions, {
        fields: [StockOpnameSchema.stockOpnameItems.sessionId],
        references: [StockOpnameSchema.stockOpnameSessions.id],
    }),
    product: one(ProductSchema.products, {
        fields: [StockOpnameSchema.stockOpnameItems.productId],
        references: [ProductSchema.products.id],
    }),
    batch: one(BatchSchema.productBatches, {
        fields: [StockOpnameSchema.stockOpnameItems.batchId],
        references: [BatchSchema.productBatches.id],
    }),
}));

export const defectiveItemsRelations = relations(DefectiveItemSchema.defectiveItems, ({ one }) => ({
    product: one(ProductSchema.products, {
        fields: [DefectiveItemSchema.defectiveItems.productId],
        references: [ProductSchema.products.id],
    }),
    batch: one(BatchSchema.productBatches, {
        fields: [DefectiveItemSchema.defectiveItems.batchId],
        references: [BatchSchema.productBatches.id],
    }),
    supplier: one(SupplierSchema.suppliers, {
        fields: [DefectiveItemSchema.defectiveItems.supplierId],
        references: [SupplierSchema.suppliers.id],
    }),
}));

// ============================================
// GAMBLING
// ============================================

export const deadPhonePurchasesRelations = relations(GamblingSchema.deadPhonePurchases, ({ one, many }) => ({
    supplier: one(SupplierSchema.suppliers, {
        fields: [GamblingSchema.deadPhonePurchases.supplierId],
        references: [SupplierSchema.suppliers.id],
    }),
    testLogs: many(GamblingSchema.gamblingTestLogs),
    harvestLogs: many(GamblingSchema.partHarvestLogs),
}));

export const gamblingTestLogsRelations = relations(GamblingSchema.gamblingTestLogs, ({ one }) => ({
    deadPhone: one(GamblingSchema.deadPhonePurchases, {
        fields: [GamblingSchema.gamblingTestLogs.deadPhoneId],
        references: [GamblingSchema.deadPhonePurchases.id],
    }),
    service: one(ServiceSchema.services, {
        fields: [GamblingSchema.gamblingTestLogs.triggerServiceId],
        references: [ServiceSchema.services.id],
    }),
    technician: one(UserSchema.users, {
        fields: [GamblingSchema.gamblingTestLogs.technicianId],
        references: [UserSchema.users.id],
    }),
}));

export const forfeitedDevicesRelations = relations(GamblingSchema.forfeitedDevices, ({ one, many }) => ({
    service: one(ServiceSchema.services, {
        fields: [GamblingSchema.forfeitedDevices.serviceId],
        references: [ServiceSchema.services.id],
    }),
    harvestLogs: many(GamblingSchema.partHarvestLogs),
}));

export const partHarvestLogsRelations = relations(GamblingSchema.partHarvestLogs, ({ one }) => ({
    forfeitedDevice: one(GamblingSchema.forfeitedDevices, {
        fields: [GamblingSchema.partHarvestLogs.forfeitedDeviceId],
        references: [GamblingSchema.forfeitedDevices.id],
    }),
    deadPhone: one(GamblingSchema.deadPhonePurchases, {
        fields: [GamblingSchema.partHarvestLogs.deadPhoneId],
        references: [GamblingSchema.deadPhonePurchases.id],
    }),
    targetService: one(ServiceSchema.services, {
        fields: [GamblingSchema.partHarvestLogs.targetServiceId],
        references: [ServiceSchema.services.id],
    }),
    technician: one(UserSchema.users, {
        fields: [GamblingSchema.partHarvestLogs.technicianId],
        references: [UserSchema.users.id],
    }),
    batch: one(BatchSchema.productBatches, {
        fields: [GamblingSchema.partHarvestLogs.newBatchId],
        references: [BatchSchema.productBatches.id],
    }),
}));



// ============================================
// SUPPLIERS
// ============================================

export const suppliersRelations = relations(SupplierSchema.suppliers, ({ many }) => ({
    productVariants: many(SupplierSchema.supplierProductVariants),
    brands: many(SupplierSchema.supplierBrands),
}));

export const supplierBrandsRelations = relations(SupplierSchema.supplierBrands, ({ one }) => ({
    supplier: one(SupplierSchema.suppliers, {
        fields: [SupplierSchema.supplierBrands.supplierId],
        references: [SupplierSchema.suppliers.id],
    }),
    brand: one(VariantSchema.productVariants, {
        fields: [SupplierSchema.supplierBrands.brandId],
        references: [VariantSchema.productVariants.id],
    }),
}));

export const supplierProductVariantsRelations = relations(SupplierSchema.supplierProductVariants, ({ one }) => ({
    supplier: one(SupplierSchema.suppliers, {
        fields: [SupplierSchema.supplierProductVariants.supplierId],
        references: [SupplierSchema.suppliers.id],
    }),
    product: one(ProductSchema.products, {
        fields: [SupplierSchema.supplierProductVariants.productId],
        references: [ProductSchema.products.id],
    }),
    variant: one(VariantSchema.productVariants, {
        fields: [SupplierSchema.supplierProductVariants.variantId],
        references: [VariantSchema.productVariants.id],
    }),
}));

// ============================================
// ACCOUNTING & DASHBOARD
// ============================================

export const accountsRelations = relations(AccountingSchema.accounts, ({ one, many }) => ({
    type: one(AccountingSchema.accountTypes, {
        fields: [AccountingSchema.accounts.typeId],
        references: [AccountingSchema.accountTypes.id],
    }),
    parent: one(AccountingSchema.accounts, {
        fields: [AccountingSchema.accounts.parentId],
        references: [AccountingSchema.accounts.id],
        relationName: "account_hierarchy"
    }),
    children: many(AccountingSchema.accounts, {
        relationName: "account_hierarchy"
    }),
    journalLines: many(AccountingSchema.journalLines),
}));

export const journalsRelations = relations(AccountingSchema.journals, ({ one, many }) => ({
    createdByUser: one(UserSchema.users, {
        fields: [AccountingSchema.journals.createdBy],
        references: [UserSchema.users.id],
    }),
    lines: many(AccountingSchema.journalLines),
}));

export const auditLogsRelations = relations(AccountingSchema.auditLogs, ({ one }) => ({
    user: one(UserSchema.users, {
        fields: [AccountingSchema.auditLogs.userId],
        references: [UserSchema.users.id],
    }),
}));

export const activityLogsRelations = relations(ActivitySchema.activityLogs, ({ one }) => ({
    user: one(UserSchema.users, {
        fields: [ActivitySchema.activityLogs.userId],
        references: [UserSchema.users.id],
    }),
}));

export const notificationsRelations = relations(ActivitySchema.notifications, ({ one }) => ({
    user: one(UserSchema.users, {
        fields: [ActivitySchema.notifications.userId],
        references: [UserSchema.users.id],
    }),
}));

// ============================================
// OTHERS
// ============================================

export const approvalsRelations = relations(ApprovalSchema.approvals, ({ one }) => ({
    requestedBy: one(UserSchema.users, {
        fields: [ApprovalSchema.approvals.requestedById],
        references: [UserSchema.users.id],
        relationName: "requested_by",
    }),
    approvedBy: one(UserSchema.users, {
        fields: [ApprovalSchema.approvals.approvedById],
        references: [UserSchema.users.id],
        relationName: "approved_by",
    }),
}));


export const devicesRelations = relations(DeviceSchema.devices, ({ many }) => ({
    compatibleProducts: many(DeviceSchema.productDeviceCompatibility),
}));

export const productDeviceCompatibilityRelations = relations(DeviceSchema.productDeviceCompatibility, ({ one }) => ({
    product: one(ProductSchema.products, {
        fields: [DeviceSchema.productDeviceCompatibility.productId],
        references: [ProductSchema.products.id],
    }),
    device: one(DeviceSchema.devices, {
        fields: [DeviceSchema.productDeviceCompatibility.deviceId],
        references: [DeviceSchema.devices.id],
    }),
}));
