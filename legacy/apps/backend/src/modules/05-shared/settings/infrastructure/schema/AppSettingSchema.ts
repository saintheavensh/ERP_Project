import { text, timestamp, pgTable, jsonb, boolean } from "drizzle-orm/pg-core";
import { users } from "../../../users/infrastructure/schema/UserSchema";
import { randomUUID } from "crypto";

export const appSettings = pgTable("app_settings", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    key: text("key").unique().notNull(),
    value: jsonb("value").notNull(),
    description: text("description"),
    updatedBy: text("updated_by").references(() => users.id),
    tenantId: text("tenant_id").notNull(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const settings = pgTable("settings", {
    key: text("key").primaryKey(),
    value: jsonb("value").notNull(),
    type: text("type").notNull().default('json'),
    scope: text("scope").notNull().default('system'),
    module: text("module"),
    userId: text("user_id"),
    storeId: text("store_id"),
    description: text("description"),
    isEditable: boolean("is_editable").notNull().default(true),
    tenantId: text("tenant_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
