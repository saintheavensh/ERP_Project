import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { suppliers } from '../suppliers/schema.js';
import { products, batches } from '../products/schema.js';

/**
 * Purchase Header Table
 */
export const purchases = sqliteTable('purchases', {
  id: text('id').primaryKey(),
  invoiceNo: text('invoice_no').notNull().unique(), // No Faktur Supplier
  supplierId: text('supplier_id').references(() => suppliers.id),
  totalAmount: integer('total_amount').notNull(),
  status: text('status').notNull().default('COMPLETED'), // COMPLETED, PENDING
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Purchase Items Table
 */
export const purchaseItems = sqliteTable('purchase_items', {
  id: text('id').primaryKey(),
  purchaseId: text('purchase_id').notNull().references(() => purchases.id),
  productId: text('product_id').notNull().references(() => products.id),
  batchId: text('batch_id').notNull().references(() => batches.id),
  qty: integer('qty').notNull(),
  buyPrice: integer('buy_price').notNull(),
  sellPrice: integer('sell_price').notNull(),
});

/**
 * Relations
 */
export const purchasesRelations = relations(purchases, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [purchases.supplierId],
    references: [suppliers.id],
  }),
  items: many(purchaseItems),
}));

export const purchaseItemsRelations = relations(purchaseItems, ({ one }) => ({
  purchase: one(purchases, {
    fields: [purchaseItems.purchaseId],
    references: [purchases.id],
  }),
  product: one(products, {
    fields: [purchaseItems.productId],
    references: [products.id],
  }),
  batch: one(batches, {
    fields: [purchaseItems.batchId],
    references: [batches.id],
  }),
}));

export type Purchase = typeof purchases.$inferSelect;
export type NewPurchase = typeof purchases.$inferInsert;
export type PurchaseItem = typeof purchaseItems.$inferSelect;
export type NewPurchaseItem = typeof purchaseItems.$inferInsert;
