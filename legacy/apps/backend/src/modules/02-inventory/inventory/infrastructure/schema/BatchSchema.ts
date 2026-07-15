import { sql } from "drizzle-orm";
import { text, integer, timestamp, pgTable, index, check } from "drizzle-orm/pg-core";
import { products } from "../../../products/infrastructure/schema/ProductSchema";
import { productVariants } from "./VariantSchema";
import { suppliers } from "../../../../01-purchases/suppliers/infrastructure/schema/SupplierSchema";

export const productBatches = pgTable("product_batches", {
    id: text("id").primaryKey(), // B-XXX (Keep)
    productId: text("product_id").notNull().references(() => products.id),
    variantId: text("variant_id").references(() => productVariants.id),
    supplierId: text("supplier_id").references(() => suppliers.id),

    supplierName: text("supplier_name"),
    buyPrice: integer("buy_price").notNull(),
    sellPrice: integer("sell_price").notNull(),
    initialStock: integer("initial_stock").notNull(),
    currentStock: integer("current_stock").notNull(),
    warrantyEndDate: timestamp("warranty_end_date"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
    tenantId: text("tenant_id").notNull(),
    deletedAt: timestamp("deleted_at"),
}, (table) => ({
    tenantIdx: index("product_batches_tenant_idx").on(table.tenantId),
    warrantyIdx: index("idx_batches_warranty").on(table.warrantyEndDate),
    productIdx: index("product_batches_product_idx").on(table.productId),
    variantIdx: index("product_batches_variant_idx").on(table.variantId),
    supplierIdx: index("product_batches_supplier_idx").on(table.supplierId),
    priceCheck: check("price_not_negative", sql`${table.buyPrice} >= 0 AND ${table.sellPrice} >= 0`),
    stockCheck: check("stock_not_negative", sql`${table.currentStock} >= 0`)
}));


