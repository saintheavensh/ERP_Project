import { pgTable, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { randomUUID } from "crypto";
import { products } from "../../../../02-inventory/products/infrastructure/schema/ProductSchema";

export const stockMovements = pgTable("stock_movements", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    productId: text("product_id").notNull().references(() => products.id),
    type: text("type", { enum: ["IN", "OUT", "ADJUSTMENT"] }).notNull(),
    referenceType: text("reference_type", { enum: ["PURCHASE", "SALE", "MANUAL"] }).notNull(),
    referenceId: text("reference_id").notNull(),
    quantity: integer("quantity").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    productIdx: index("stock_movements_product_idx").on(table.productId),
    createdAtIdx: index("stock_movements_created_at_idx").on(table.createdAt),
}));

export type StockMovementRow = typeof stockMovements.$inferSelect;
export type NewStockMovementRow = typeof stockMovements.$inferInsert;
