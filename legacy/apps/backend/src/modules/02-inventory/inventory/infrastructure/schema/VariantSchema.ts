import { text, integer, timestamp, pgTable, index } from "drizzle-orm/pg-core";
import { products } from "../../../products/infrastructure/schema/ProductSchema";

export const productVariants = pgTable("product_variants", {
    id: text("id").primaryKey(), // VAR-XXX (Keep)
    productId: text("product_id").notNull().references(() => products.id),
    name: text("name").notNull(),
    image: text("image"),
    sku: text("sku"),
    defaultPrice: integer("default_price"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
    tenantId: text("tenant_id").notNull(),
    deletedAt: timestamp("deleted_at"),
}, (table) => ({
    tenantIdx: index("product_variants_tenant_idx").on(table.tenantId),
    productIdx: index("product_variants_product_idx").on(table.productId),
    skuIdx: index("product_variants_sku_idx").on(table.sku),
}));

