import { text, timestamp, pgTable, boolean, integer, unique, index } from "drizzle-orm/pg-core";
import { randomUUID } from "crypto";
import { products } from "../../../../02-inventory/products/infrastructure/schema/ProductSchema";
import { productVariants } from "../../../../02-inventory/inventory/infrastructure/schema/VariantSchema";

const timestamps = () => ({
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
});

export const suppliers = pgTable("suppliers", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()), // UUID PK
    name: text("name").notNull(),
    contact: text("contact"),
    phone: text("phone"),
    address: text("address"),
    image: text("image"),
    isActive: boolean("is_active").default(true),
    tenantId: text("tenant_id").notNull(),
    ...timestamps(),
}, (table) => ({
    tenantIdx: index("suppliers_tenant_idx").on(table.tenantId),
}));

export const supplierProductVariants = pgTable("supplier_product_variants", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    supplierId: text("supplier_id").notNull().references(() => suppliers.id),
    productId: text("product_id").notNull().references(() => products.id),
    variantId: text("variant_id").references(() => productVariants.id),
    isActive: boolean("is_active").default(true),
    tenantId: text("tenant_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

export const supplierBrands = pgTable("supplier_brands", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    supplierId: text("supplier_id").notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
    brandId: text("brand_id").notNull().references(() => productVariants.id, { onDelete: 'cascade' }),
    warrantyPeriodDays: integer("warranty_period_days").notNull(),
    isActive: boolean("is_active").default(true),
    tenantId: text("tenant_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
}, (table) => ({
    unq: unique("sup_brand_unique").on(table.supplierId, table.brandId),
    tenantIdx: index("supplier_brands_tenant_idx").on(table.tenantId),
    supplierIdx: index("idx_supplier_brands_supplier").on(table.supplierId),
    brandIdx: index("idx_supplier_brands_brand").on(table.brandId),
}));

