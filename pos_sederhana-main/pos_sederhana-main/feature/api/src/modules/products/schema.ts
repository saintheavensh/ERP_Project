import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

/**
 * Categories table
 */
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Products table - Master Data
 */
export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  categoryId: text('category_id').references(() => categories.id),
  name: text('name').notNull(),
  sku: text('sku').unique(), // Barcode / SKU
  unit: text('unit').notNull().default('pcs'), // pcs, box, kg, etc.
  description: text('description'),
  currentStock: integer('current_stock').notNull().default(0), // Snapshot stock (sum of batches)
  status: text('status').notNull().default('ACTIVE'), // ACTIVE, INACTIVE
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Product Batches - Support for FIFO (First-In First-Out)
 * Stores specific purchase batches with their own costs and prices.
 */
export const batches = sqliteTable('batches', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull().references(() => products.id),
  batchNo: text('batch_no'), // Optional: Invoice No or Batch No from Supplier
  buyPrice: integer('buy_price').notNull(), // Harga Beli (Modal)
  sellPrice: integer('sell_price').notNull(), // Harga Jual (Default)
  initialStock: integer('initial_stock').notNull(),
  currentStock: integer('current_stock').notNull(),
  expiredAt: integer('expired_at', { mode: 'timestamp' }), // For items with expiry date
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Stock Movements - Ledger for audit trail
 */
export const stockMovements = sqliteTable('stock_movements', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull().references(() => products.id),
  batchId: text('batch_id').references(() => batches.id),
  type: text('type').notNull(), // 'IN' (Purchase), 'OUT' (Sale), 'ADJ' (Adjustment)
  delta: integer('delta').notNull(), // Positiv (+stok), Negativ (-stok)
  reason: text('reason'), // Reference ID or Note
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Relations
 */
export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  batches: many(batches),
  movements: many(stockMovements),
}));

export const batchesRelations = relations(batches, ({ one }) => ({
  product: one(products, {
    fields: [batches.productId],
    references: [products.id],
  }),
}));

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Batch = typeof batches.$inferSelect;
export type NewBatch = typeof batches.$inferInsert;
export type StockMovement = typeof stockMovements.$inferSelect;
export type NewStockMovement = typeof stockMovements.$inferInsert;
