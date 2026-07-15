import { db } from '../../db/index.js';
import { products, categories, batches, stockMovements } from './schema.js';
import { eq, like, or, sql, desc, and } from 'drizzle-orm';
import crypto from 'crypto';

export class ProductService {
  /**
   * Get all products with their current stock and category
   */
  static async getAll() {
    return db.select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      unit: products.unit,
      currentStock: products.currentStock,
      category: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .all();
  }

  /**
   * Search products by name or SKU
   */
  static async search(query: string) {
    if (!query) return [];
    const searchPattern = `%${query}%`;
    
    // Ambil produk yang aktif dan stoknya > 0 (Opsional, tergantung kebutuhan cashier)
    return db.select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      unit: products.unit,
      currentStock: products.currentStock,
      // Kita ambil harga jual dari batch terbaru sebagai default
      defaultPrice: sql<number>`(SELECT sell_price FROM batches WHERE product_id = ${products.id} ORDER BY created_at DESC LIMIT 1)`
    })
    .from(products)
    .where(
      or(
        like(products.name, searchPattern),
        like(products.sku, searchPattern)
      )
    )
    .limit(10)
    .all();
  }

  /**
   * Add new product master
   */
  static async createProduct(data: { name: string, sku?: string, unit?: string, categoryId?: string }) {
    const id = crypto.randomUUID();
    const now = new Date();
    
    await db.insert(products).values({
      id,
      name: data.name,
      sku: data.sku,
      unit: data.unit || 'pcs',
      categoryId: data.categoryId,
      createdAt: now,
      updatedAt: now,
    }).run();
    
    return { id, ...data };
  }

  /**
   * Add Stock (Stock In) - Creates a new Batch (FIFO)
   */
  static async addStock(data: { productId: string, qty: number, buyPrice: number, sellPrice: number, batchNo?: string }) {
    const productId = data.productId;
    const batchId = crypto.randomUUID();
    const now = new Date();

    return db.transaction(async (tx) => {
      // 1. Create Batch
      await tx.insert(batches).values({
        id: batchId,
        productId,
        batchNo: data.batchNo,
        buyPrice: data.buyPrice,
        sellPrice: data.sellPrice,
        initialStock: data.qty,
        currentStock: data.qty,
        createdAt: now,
        updatedAt: now,
      }).run();

      // 2. Create Stock Movement (Audit Trail)
      await tx.insert(stockMovements).values({
        id: crypto.randomUUID(),
        productId,
        batchId,
        type: 'IN',
        delta: data.qty,
        reason: 'PENGADAAN_STOK',
        createdAt: now,
      }).run();

      // 3. Update Product Snapshot Stock
      await tx.update(products)
        .set({ 
          currentStock: sql`${products.currentStock} + ${data.qty}`,
          updatedAt: now 
        })
        .where(eq(products.id, productId))
        .run();

      return { batchId, productId, qty: data.qty };
    });
  }

  /**
   * Get Categories
   */
  static async getCategories() {
    return db.select().from(categories).all();
  }

  /**
   * Create Category
   */
  static async createCategory(name: string) {
    const id = crypto.randomUUID();
    const now = new Date();
    await db.insert(categories).values({
      id,
      name,
      createdAt: now,
      updatedAt: now,
    }).run();
    return { id, name };
  }

  /**
   * Update Product
   */
  static async updateProduct(id: string, data: { name?: string, sku?: string, unit?: string, categoryId?: string }) {
    const now = new Date();
    await db.update(products)
      .set({ ...data, updatedAt: now })
      .where(eq(products.id, id))
      .run();
    return { id, ...data };
  }

  /**
   * Delete Product
   */
  static async deleteProduct(id: string) {
    return db.transaction(async (tx) => {
      // 1. Delete stock movements
      await tx.delete(stockMovements).where(eq(stockMovements.productId, id)).run();
      // 2. Delete batches
      await tx.delete(batches).where(eq(batches.productId, id)).run();
      // 3. Delete product
      await tx.delete(products).where(eq(products.id, id)).run();
      return { success: true };
    });
  }

  /**
   * Update Category
   */
  static async updateCategory(id: string, name: string) {
    const now = new Date();
    await db.update(categories)
      .set({ name, updatedAt: now })
      .where(eq(categories.id, id))
      .run();
    return { id, name };
  }

  /**
   * Delete Category
   */
  static async deleteCategory(id: string) {
    // Set product category to null before deleting
    await db.update(products)
      .set({ categoryId: null })
      .where(eq(products.categoryId, id))
      .run();
    await db.delete(categories).where(eq(categories.id, id)).run();
    return { success: true };
  }

  /**
   * Get Stock In History (Purchases)
   */
  static async getStockInHistory() {
    return db.select({
      id: stockMovements.id,
      productName: products.name,
      delta: stockMovements.delta,
      buyPrice: batches.buyPrice,
      sellPrice: batches.sellPrice,
      batchNo: batches.batchNo,
      reason: stockMovements.reason,
      createdAt: stockMovements.createdAt,
    })
    .from(stockMovements)
    .innerJoin(products, eq(stockMovements.productId, products.id))
    .leftJoin(batches, eq(stockMovements.batchId, batches.id))
    .where(eq(stockMovements.type, 'IN'))
    .orderBy(desc(stockMovements.createdAt))
    .all();
  }
}
