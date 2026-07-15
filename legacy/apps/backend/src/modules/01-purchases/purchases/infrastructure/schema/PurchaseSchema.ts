import { text, integer, timestamp, pgTable, index } from "drizzle-orm/pg-core";
import { randomUUID } from "crypto";
import { users } from "../../../../05-shared/users/infrastructure/schema/UserSchema";
import { suppliers } from "../../../suppliers/infrastructure/schema/SupplierSchema";
import { products } from "../../../../02-inventory/products/infrastructure/schema/ProductSchema";
import { productBatches } from "../../../../02-inventory/inventory/infrastructure/schema/BatchSchema";

const uuid = () => text("id").primaryKey().$defaultFn(() => randomUUID());

export const purchases = pgTable("purchases", {
    id: text("id").primaryKey(), // PO-XXX
    supplierId: text("supplier_id").notNull().references(() => suppliers.id),
    userId: text("user_id").references(() => users.id),
    totalAmount: integer("total_amount").notNull(),
    referenceNumber: text("reference_number"),
    notes: text("notes"),
    date: timestamp("date").defaultNow(),
    status: text("status", { enum: ["DRAFT", "ORDERED", "RECEIVED", "VERIFIED", "COMPLETED", "CANCELLED"] }).default("ORDERED"),
    receivedBy: text("received_by").references(() => users.id),
    receivedAt: timestamp("received_at"),
    verifiedAt: timestamp("verified_at"),
    verifiedBy: text("verified_by").references(() => users.id),
    cancelledAt: timestamp("cancelled_at"),
    cancelledBy: text("cancelled_by").references(() => users.id),
    shippingFee: integer("shipping_fee").default(0),
    discountAmount: integer("discount_amount").default(0),
    paymentDueDate: timestamp("payment_due_date"),
    shippingExpenseAccountId: text("shipping_expense_account_id"),
    tenantId: text("tenant_id").notNull(),
}, (table) => ({
    tenantIdx: index("purchases_tenant_idx").on(table.tenantId),
}));

export const purchaseItems = pgTable("purchase_items", {
    id: uuid(),
    purchaseId: text("purchase_id").notNull().references(() => purchases.id),
    productId: text("product_id").notNull().references(() => products.id),
    variant: text("variant"),
    qtyOrdered: integer("qty_ordered").notNull(),
    qtyReceived: integer("qty_received").notNull().default(0),
    buyPrice: integer("buy_price").notNull().default(0),
    sellPrice: integer("sell_price").notNull().default(0),
    batchId: text("batch_id").references(() => productBatches.id),
    tenantId: text("tenant_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

export const purchasePayments = pgTable("purchase_payments", {
    id: uuid(),
    purchaseId: text("purchase_id").notNull().references(() => purchases.id),
    supplierId: text("supplier_id").notNull().references(() => suppliers.id),
    amount: integer("amount").notNull(),
    method: text("method").notNull(),
    reference: text("reference"),
    proofImage: text("proof_image"),
    date: timestamp("date").notNull().defaultNow(),
    createdBy: text("created_by").references(() => users.id),
    tenantId: text("tenant_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

export const purchaseReturns = pgTable("purchase_returns", {
    id: text("id").primaryKey(), // RET-XXX
    supplierId: text("supplier_id").notNull().references(() => suppliers.id),
    userId: text("user_id").notNull().references(() => users.id),
    date: timestamp("date").defaultNow(),
    notes: text("notes"),
    tenantId: text("tenant_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

export const purchaseReturnItems = pgTable("purchase_return_items", {
    id: uuid(),
    returnId: text("return_id").notNull().references(() => purchaseReturns.id),
    productId: text("product_id").notNull().references(() => products.id),
    batchId: text("batch_id").notNull().references(() => productBatches.id),
    qty: integer("qty").notNull(),
    reason: text("reason"),
    tenantId: text("tenant_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});


