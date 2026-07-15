import { text, integer, timestamp, pgTable, index } from "drizzle-orm/pg-core";
import { randomUUID } from "crypto";

const timestamps = () => ({
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
});

export const members = pgTable("members", {
    id: text("id").primaryKey(), // MBR-XXX
    name: text("name").notNull(),
    phone: text("phone").notNull().unique(),
    email: text("email"),
    discountPercent: integer("discount_percent").default(0),
    points: integer("points").default(0),
    debt: integer("debt").default(0),
    creditLimit: integer("credit_limit").default(0),
    image: text("image"),
    tenantId: text("tenant_id").notNull(),
    ...timestamps(),
}, (table) => ({
    tenantIdx: index("members_tenant_idx").on(table.tenantId),
}));

// Since sales is not yet in its own schema, we'll wait for relations or use string
// Actually we will move sales soon.
