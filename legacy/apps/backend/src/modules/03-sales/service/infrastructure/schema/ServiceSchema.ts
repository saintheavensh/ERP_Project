import { text, integer, numeric, timestamp, pgTable, boolean, json, index } from "drizzle-orm/pg-core";
import { randomUUID } from "crypto";
import { users } from "../../../../05-shared/users/infrastructure/schema/UserSchema";
import { productBatches } from "../../../../02-inventory/inventory/infrastructure/schema/BatchSchema";

// Helpers
const uuid = () => text("id").primaryKey().$defaultFn(() => randomUUID());
const timestamps = () => ({
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
});

export const services = pgTable("services", {
    id: uuid(),
    no: text("no").notNull().unique(), // SRV-YYYY-XXX

    customer: json("customer").notNull().$type<{ name: string; phone: string; address?: string }>(),
    device: json("device").notNull().$type<{ brand: string; model: string; imei?: string; equipment?: string }>(),

    complaint: text("complaint").notNull(),
    diagnosis: text("diagnosis"),
    notes: text("notes"),

    status: text("status", { enum: ["antrian", "dicek", "konfirmasi", "dikerjakan", "re-konfirmasi", "selesai", "diambil", "batal"] }).default("antrian"),

    technicianId: text("technician_id").references(() => users.id),
    createdBy: text("created_by").references(() => users.id),

    costEstimate: integer("cost_estimate"),
    actualCost: integer("actual_cost"),

    dateIn: timestamp("date_in").defaultNow(),
    dateOut: timestamp("date_out"),
    estimatedCompletionDate: timestamp("estimated_completion_date"),
    parts: json("parts"),
    qc: json("qc"),
    reconfirmationCount: integer("reconfirmation_count").default(0),

    warranty: text("warranty"),
    warrantyExpiryDate: timestamp("warranty_expiry_date"),
    priority: text("priority", { enum: ["standard", "wait"] }).default("standard"),
    isDirectComplete: boolean("is_direct_complete").default(false),
    tenantId: text("tenant_id").notNull(),

    ...timestamps(),
});

export const serviceCategories = pgTable("service_categories", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    name: text("name").notNull(),
    minWeight: integer("min_weight"),
    maxWeight: integer("max_weight"),
    description: text("description"),
    tenantId: text("tenant_id").notNull(),
});

export const serviceTypes = pgTable("service_types", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    categoryId: text("category_id").references(() => serviceCategories.id),
    name: text("name").notNull(),
    weight: integer("weight").notNull(),
    defaultPrice: integer("default_price"),
    commissionPercent: numeric("commission_percent", { precision: 5, scale: 2 }),
    warrantyDays: integer("warranty_days").default(30),
    isActive: boolean("is_active").default(true),
    tenantId: text("tenant_id").notNull(),
    createdAt: timestamp("created_at").defaultNow()
});

export const serviceItems = pgTable("service_items", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    serviceId: text("service_id").references(() => services.id, { onDelete: 'cascade' }),
    serviceTypeId: text("service_type_id").references(() => serviceTypes.id),
    technicianId: text("technician_id").references(() => users.id),
    description: text("description"),
    estimatedCost: integer("estimated_cost"),
    actualCost: integer("actual_cost"),
    status: text("status", { enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"] }).default("PENDING"),
    tenantId: text("tenant_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    completedAt: timestamp("completed_at")
});

export const serviceParts = pgTable("service_parts", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    serviceItemId: text("service_item_id").references(() => serviceItems.id, { onDelete: 'cascade' }),
    variantBatchId: text("variant_batch_id").references(() => productBatches.id),
    quantity: integer("quantity").notNull(),
    purchasePrice: integer("purchase_price"),
    sellingPrice: integer("selling_price").notNull(),
    notes: text("notes"),
    tenantId: text("tenant_id").notNull(),
    createdAt: timestamp("created_at").defaultNow()
});

export const technicianCommissionSettings = pgTable("technician_commission_settings", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    technicianId: text("technician_id").references(() => users.id, { onDelete: 'cascade' }),
    commissionType: text("commission_type", { enum: ['SIMPLE', 'WEIGHTED', 'MIX', 'SALARY'] }),
    simpleRate: numeric("simple_rate", { precision: 5, scale: 2 }),
    baseSalary: integer("base_salary"),
    valuePerPoint: integer("value_per_point"),
    isActive: boolean("is_active").default(true),
    tenantId: text("tenant_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow()
});

export const technicianCommissions = pgTable("technician_commissions", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    technicianId: text("technician_id").references(() => users.id),
    serviceItemId: text("service_item_id").references(() => serviceItems.id),
    commissionType: text("commission_type"),
    baseAmount: integer("base_amount"),
    commissionAmount: integer("commission_amount"),
    paid: boolean("paid").default(false),
    paidAt: timestamp("paid_at"),
    tenantId: text("tenant_id").notNull(),
    createdAt: timestamp("created_at").defaultNow()
});



export const serviceTools = pgTable("service_tools", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    brand: text("brand"),
    qty: integer("qty").notNull().default(1),
    condition: text("condition", { enum: ["good", "damaged", "lost"] }).default("good"),
    purchaseDate: timestamp("purchase_date"),
    price: integer("price"),
    notes: text("notes"),
    userId: text("user_id").references(() => users.id),
    tenantId: text("tenant_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
    tenantIdx: index("service_tools_tenant_idx").on(table.tenantId),
}));

export const serviceToolRequests = pgTable("service_tool_requests", {
    id: uuid(),
    userId: text("user_id").notNull().references(() => users.id),
    toolName: text("tool_name").notNull(),
    justification: text("justification").notNull(),
    status: text("status", { enum: ["pending", "approved", "rejected"] }).default("pending"),
    tenantId: text("tenant_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
    tenantIdx: index("service_tool_requests_tenant_idx").on(table.tenantId),
}));


