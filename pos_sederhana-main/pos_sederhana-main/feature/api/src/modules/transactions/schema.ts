import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { products, batches } from '../products/schema.js';

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  receiptNo: text('receipt_no').notNull().unique(),
  customerName: text('customer_name'),
  paymentMethod: text('payment_method').notNull().default('TUNAI'), // 'TUNAI' | 'TEMPO'
  paymentSubMethod: text('payment_sub_method').notNull().default('CASH'), // 'CASH' | 'QRIS' | 'TRANSFER'
  totalQty: integer('total_qty').notNull(),
  subtotal: integer('subtotal').notNull(),
  total: integer('total').notNull(),
  cashPaid: integer('cash_paid').notNull(),
  changeAmount: integer('change_amount').notNull(),
  amountDue: integer('amount_due').notNull().default(0),
  cogs: integer('cogs').notNull().default(0), // Total Harga Pokok Penjualan (Beban Modal)
  grossProfit: integer('gross_profit').notNull().default(0), // Total Laba Kotor
  status: text('status').notNull().default('LUNAS'), // 'LUNAS' | 'BELUM_LUNAS'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const transactionItems = sqliteTable('transaction_items', {
  id: text('id').primaryKey(),
  transactionId: text('transaction_id').notNull().references(() => transactions.id),
  productId: text('product_id').references(() => products.id), // Link ke Master Data
  batchId: text('batch_id').references(() => batches.id), // Link ke Batch FIFO (Jika ada)
  name: text('name').notNull(),
  price: integer('price').notNull(),
  qty: integer('qty').notNull(),
  total: integer('total').notNull(),
});

/**
 * Transaction Item Batches - Tracks which batches were used for each item (FIFO audit)
 */
export const transactionItemBatches = sqliteTable('transaction_item_batches', {
  id: text('id').primaryKey(),
  transactionItemId: text('transaction_item_id').notNull().references(() => transactionItems.id),
  batchId: text('batch_id').notNull().references(() => batches.id),
  qty: integer('qty').notNull(),
  buyPrice: integer('buy_price').notNull(), // Cost at the time of sale
});

/**
 * Relations
 */
export const transactionsRelations = relations(transactions, ({ many }) => ({
  items: many(transactionItems),
}));

export const transactionItemsRelations = relations(transactionItems, ({ one, many }) => ({
  transaction: one(transactions, {
    fields: [transactionItems.transactionId],
    references: [transactions.id],
  }),
  product: one(products, {
    fields: [transactionItems.productId],
    references: [products.id],
  }),
  batch: one(batches, {
    fields: [transactionItems.batchId],
    references: [batches.id],
  }),
  itemBatches: many(transactionItemBatches),
}));

export const transactionItemBatchesRelations = relations(transactionItemBatches, ({ one }) => ({
  item: one(transactionItems, {
    fields: [transactionItemBatches.transactionItemId],
    references: [transactionItems.id],
  }),
  batch: one(batches, {
    fields: [transactionItemBatches.batchId],
    references: [batches.id],
  }),
}));

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type TransactionItem = typeof transactionItems.$inferSelect;
export type NewTransactionItem = typeof transactionItems.$inferInsert;
export type TransactionItemBatch = typeof transactionItemBatches.$inferSelect;
export type NewTransactionItemBatch = typeof transactionItemBatches.$inferInsert;
