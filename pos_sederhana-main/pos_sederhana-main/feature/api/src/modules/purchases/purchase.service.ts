import { db } from '../../db/index.js';
import { purchases, purchaseItems } from './schema.js';
import { products, batches, stockMovements } from '../products/schema.js';
import { eq, desc, sql } from 'drizzle-orm';
import crypto from 'crypto';

export interface NewPurchaseRequest {
  invoiceNo: string;
  supplierId?: string;
  note?: string;
  items: {
    productId: string;
    qty: number;
    buyPrice: number;
    sellPrice: number;
  }[];
}

export class PurchaseService {
  /**
   * Get all purchases (headers)
   */
  static async getAll() {
    return db.select().from(purchases).orderBy(desc(purchases.createdAt)).all();
  }

  /**
   * Create new Purchase (Transaction-based)
   */
  static async create(data: NewPurchaseRequest) {
    const purchaseId = crypto.randomUUID();
    const now = new Date();
    let totalAmount = 0;

    return db.transaction(async (tx) => {
      // 1. Create Purchase Header
      for (const item of data.items) {
        totalAmount += item.qty * item.buyPrice;
      }

      await tx.insert(purchases).values({
        id: purchaseId,
        invoiceNo: data.invoiceNo,
        supplierId: data.supplierId,
        totalAmount,
        note: data.note,
        createdAt: now,
        updatedAt: now,
      }).run();

      // 2. Process Items
      for (const item of data.items) {
        const batchId = crypto.randomUUID();

        // A. Insert Purchase Item
        await tx.insert(purchaseItems).values({
          id: crypto.randomUUID(),
          purchaseId,
          productId: item.productId,
          batchId,
          qty: item.qty,
          buyPrice: item.buyPrice,
          sellPrice: item.sellPrice,
        }).run();

        // B. Create Batch (FIFO Engine)
        await tx.insert(batches).values({
          id: batchId,
          productId: item.productId,
          batchNo: data.invoiceNo, // Use invoice no as batch no
          buyPrice: item.buyPrice,
          sellPrice: item.sellPrice,
          initialStock: item.qty,
          currentStock: item.qty,
          createdAt: now,
          updatedAt: now,
        }).run();

        // C. Record Stock Movement
        await tx.insert(stockMovements).values({
          id: crypto.randomUUID(),
          productId: item.productId,
          batchId,
          type: 'IN',
          delta: item.qty,
          reason: `PEMBELIAN: ${data.invoiceNo}`,
          createdAt: now,
        }).run();

        // D. Update Product Snapshot Stock
        await tx.update(products)
          .set({ 
            currentStock: sql`${products.currentStock} + ${item.qty}`,
            updatedAt: now 
          })
          .where(eq(products.id, item.productId))
          .run();
      }

      return { purchaseId, totalAmount };
    });
  }
}
