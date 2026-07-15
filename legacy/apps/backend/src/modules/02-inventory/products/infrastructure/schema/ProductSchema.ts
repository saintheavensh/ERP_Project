import { pgTable, text, integer, timestamp, index, boolean, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { brands } from "../../../../05-shared/devices/infrastructure/schema/BrandSchema";
import { categories } from "../../../../02-inventory/categories/infrastructure/schema/CategorySchema";

export const products = pgTable("products", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()), // UUID PK
    sku: text("sku").unique().notNull(),
    name: text("name").notNull(),
    categoryId: text("category_id").references(() => categories.id),
    unit: text("unit").notNull().default("pcs"),
    image: text("image"),
    brandId: text("brand_id").references(() => brands.id),
    stock: integer("stock").notNull().default(0),

    minimumStock: integer("minimum_stock").default(0).notNull(),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
    tenantId: text("tenant_id").notNull(),
}, (table) => ({
    categoryIdx: index("products_category_idx").on(table.categoryId),
    createdAtIdx: index("products_created_at_idx").on(table.createdAt),
    skuIdx: index("products_sku_idx").on(table.sku),
    tenantIdx: index("products_tenant_idx").on(table.tenantId),
    minStockCheck: check("minimum_stock_check", sql`${table.minimumStock} >= 0`),
}));


export type ProductRow = typeof products.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;
