import { text, timestamp, pgTable, json, boolean } from "drizzle-orm/pg-core";
import { randomUUID } from "crypto";
import { users } from "../../../users/infrastructure/schema/UserSchema";

const uuid = () => text("id").primaryKey().$defaultFn(() => randomUUID());

export const activityLogs = pgTable("activity_logs", {
    id: uuid(),
    userId: text("user_id").notNull().references(() => users.id),
    action: text("action", { enum: ["CREATE", "UPDATE", "DELETE", "ASSIGN", "STATUS_CHANGE", "LOGIN", "LOGOUT", "EXPORT"] }).notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    oldValue: json("old_value"),
    newValue: json("new_value"),
    description: text("description"),
    tenantId: text("tenant_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
    id: uuid(),
    userId: text("user_id").notNull().references(() => users.id),
    type: text("type", { enum: ["low_stock", "service_update", "new_assignment", "sale_complete", "purchase_complete", "po_action_required", "po_discrepancy", "spend_alert"] }).notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    isRead: boolean("is_read").default(false),
    tenantId: text("tenant_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});


