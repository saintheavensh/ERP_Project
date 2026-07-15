// Export all schemas from their respective modules to maintain the central hub
// and ensure Drizzle migrations and repository imports continue to work correctly.

export * from "../../../modules/05-shared/users/infrastructure/schema/UserSchema";
export * from "../../../modules/02-inventory/categories/infrastructure/schema/CategorySchema";
export * from "../../../modules/02-inventory/products/infrastructure/schema/ProductSchema";
export * from "../../../modules/02-inventory/inventory/infrastructure/schema/BatchSchema";
export * from "../../../modules/02-inventory/inventory/infrastructure/schema/VariantSchema";
export * from "../../../modules/02-inventory/inventory/infrastructure/schema/StockOpnameSchema";
export * from "../../../modules/02-inventory/inventory/infrastructure/schema/StockMovementSchema";
export * from "../../../modules/02-inventory/inventory/infrastructure/schema/DefectiveItemSchema";
export * from "../../../modules/02-inventory/inventory/infrastructure/schema/GamblingSchema";
export * from "../../../modules/03-sales/customers/infrastructure/schema/MemberSchema";
export * from "../../../modules/01-purchases/suppliers/infrastructure/schema/SupplierSchema";
export * from "../../../modules/03-sales/sales/infrastructure/schema/SaleSchema";
export * from "../../../modules/01-purchases/purchases/infrastructure/schema/PurchaseSchema";
export * from "../../../modules/04-finance/accounting/infrastructure/schema/AccountingSchema";
export * from "../../../modules/05-shared/dashboard/infrastructure/schema/ActivitySchema";
export * from "../../../modules/05-shared/devices/infrastructure/schema/DeviceSchema";
export * from "../../../modules/05-shared/devices/infrastructure/schema/BrandSchema";
export * from "../../../modules/05-shared/settings/infrastructure/schema/AppSettingSchema";
export * from "../../../modules/03-sales/service/infrastructure/schema/ServiceSchema";
export * from "../../../modules/04-finance/approvals/infrastructure/schema/ApprovalSchema";

// Operational costs and other stragglers
export { storeDeviceTable } from "../external-api/devices/infrastructure/schema";


// Centralized Relations
export * from "./relations";
