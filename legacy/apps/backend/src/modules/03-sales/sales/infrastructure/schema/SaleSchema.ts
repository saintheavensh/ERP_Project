import { text, integer, timestamp, pgTable, boolean, json, index } from "drizzle-orm/pg-core";
import { randomUUID } from "crypto";
import { users } from "../../../../05-shared/users/infrastructure/schema/UserSchema";
import { members } from "../../../customers/infrastructure/schema/MemberSchema";
import { products } from "../../../../02-inventory/products/infrastructure/schema/ProductSchema";
import { productBatches } from "../../../../02-inventory/inventory/infrastructure/schema/BatchSchema";

const uuid = () => text("id").primaryKey().$defaultFn(() => randomUUID());

export const sales = pgTable("sales", {
    id: text("id").primaryKey(), // SAL-XXX
    memberId: text("member_id").references(() => members.id),
    customerName: text("customer_name"),
    totalAmount: integer("total_amount").notNull(),
    discountAmount: integer("discount_amount").default(0),
    paymentMethod: text("payment_method", { enum: ["cash", "transfer", "qris", "mixed"] }).notNull(),
    paymentStatus: text("payment_status", { enum: ["paid", "partial", "unpaid"] }).notNull().default("paid"),
    userId: text("user_id").notNull().references(() => users.id),
    notes: text("notes"),
    tenantId: text("tenant_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
    tenantIdx: index("sales_tenant_idx").on(table.tenantId),
}));

export const saleItems = pgTable("sale_items", {
    id: uuid(),
    saleId: text("sale_id").notNull().references(() => sales.id),
    productId: text("product_id").notNull().references(() => products.id),
    batchId: text("batch_id").notNull().references(() => productBatches.id),
    variant: text("variant"),
    qty: integer("qty").notNull(),
    price: integer("price").notNull(),
    tenantId: text("tenant_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

// Payment schema parts that were in payment-methods module
export const paymentMethods = pgTable("payment_methods", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    type: text("type", { enum: ["cash", "transfer", "qris", "ewallet", "custom"] }).notNull(),
    icon: text("icon").notNull().default("💳"),
    accountId: text("account_id"), // Will link later to avoid circular accounting
    feeConfig: json("fee_config").$type<{ enabled: boolean; type: "percent" | "fixed"; value: number }>(),
    enabled: boolean("enabled").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
    tenantId: text("tenant_id").notNull(),
});

export const paymentVariants = pgTable("payment_variants", {
    id: text("id").primaryKey(),
    methodId: text("method_id").notNull().references(() => paymentMethods.id),
    name: text("name").notNull(),
    accountNumber: text("account_number"),
    accountHolder: text("account_holder"),
    accountId: text("account_id"),
    enabled: boolean("enabled").default(true),
    created_at: timestamp("created_at").defaultNow(),
    tenantId: text("tenant_id").notNull(),
});

export const salePayments = pgTable("sale_payments", {
    id: uuid(),
    saleId: text("sale_id").notNull().references(() => sales.id),
    amount: integer("amount").notNull(),
    method: text("method").notNull(),
    methodId: text("method_id").references(() => paymentMethods.id),
    variantName: text("variant_name"),
    variantId: text("variant_id").references(() => paymentVariants.id),
    reference: text("reference"),
    proofImage: text("proof_image"),
    tenantId: text("tenant_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});



