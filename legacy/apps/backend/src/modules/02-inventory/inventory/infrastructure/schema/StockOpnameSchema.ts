import { text, integer, timestamp, pgTable, index } from "drizzle-orm/pg-core";
import { users } from "../../../../05-shared/users/infrastructure/schema/UserSchema";
import { products } from "../../../products/infrastructure/schema/ProductSchema";
import { productBatches } from "./BatchSchema";

// Function definition wrapper for uuid isn't globally available here so recreating local or referring.
const uuid = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());

export const stockOpnameSessions = pgTable("stock_opname_sessions", {
    id: text("id").primaryKey(),
    status: text("status", { enum: ["draft", "completed", "cancelled"] }).default("draft"),
    userId: text("user_id").notNull().references(() => users.id),
    notes: text("notes"),
    tenantId: text("tenant_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    completedAt: timestamp("completed_at"),
}, (table) => ({
    tenantIdx: index("stock_opname_sessions_tenant_idx").on(table.tenantId),
}));

export const stockOpnameItems = pgTable("stock_opname_items", {
    id: uuid(), // CHANGED: serial -> uuid
    sessionId: text("session_id").notNull().references(() => stockOpnameSessions.id, { onDelete: 'cascade' }),
    productId: text("product_id").notNull().references(() => products.id),
    variantName: text("variant_name"),
    batchId: text("batch_id").references(() => productBatches.id),
    systemStock: integer("system_stock").notNull(),
    physicalStock: integer("physical_stock"),
    adjustmentReason: text("adjustment_reason"),
    tenantId: text("tenant_id").notNull(),
}, (table) => ({
    tenantIdx: index("stock_opname_items_tenant_idx").on(table.tenantId),
}));

