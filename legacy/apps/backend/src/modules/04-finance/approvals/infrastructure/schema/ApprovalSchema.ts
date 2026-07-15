import { text, integer, timestamp, pgTable, json, index } from "drizzle-orm/pg-core";
import { users } from "../../../../05-shared/users/infrastructure/schema/UserSchema";
import { randomUUID } from "crypto";

export const approvals = pgTable("approvals", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    type: text("type", { enum: ["DISCOUNT", "REFUND", "PURCHASE", "VOID", "SERVICE_DISCOUNT"] }).notNull(),
    entityType: text("entity_type").notNull(), // 'sale', 'purchase', 'service'
    entityId: text("entity_id").notNull(),
    requestedById: text("requested_by_id").notNull().references(() => users.id),
    requestedAt: timestamp("requested_at").defaultNow(),
    status: text("status", { enum: ["PENDING", "APPROVED", "REJECTED"] }).default("PENDING"),
    approvedById: text("approved_by_id").references(() => users.id),
    approvedAt: timestamp("approved_at"),
    reason: text("reason"),
    data: json("data").$type<any>(),
    tenantId: text("tenant_id").notNull(),
}, (table) => ({
    tenantIdx: index("approvals_tenant_idx").on(table.tenantId),
}));


