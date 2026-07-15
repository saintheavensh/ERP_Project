import { db } from '../../db/index.js';
import { suppliers } from './schema.js';
import { eq, desc } from 'drizzle-orm';
import crypto from 'crypto';

export class SupplierService {
  /**
   * Get all suppliers
   */
  static async getAll() {
    return db.select().from(suppliers).orderBy(desc(suppliers.createdAt)).all();
  }

  /**
   * Create new supplier
   */
  static async create(data: { name: string, contactName?: string, phone?: string, address?: string }) {
    const id = crypto.randomUUID();
    const now = new Date();
    
    await db.insert(suppliers).values({
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
    }).run();
    
    return { id, ...data };
  }

  /**
   * Update supplier
   */
  static async update(id: string, data: { name?: string, contactName?: string, phone?: string, address?: string }) {
    const now = new Date();
    await db.update(suppliers)
      .set({ ...data, updatedAt: now })
      .where(eq(suppliers.id, id))
      .run();
    return { id, ...data };
  }

  /**
   * Delete supplier
   */
  static async delete(id: string) {
    await db.delete(suppliers).where(eq(suppliers.id, id)).run();
    return { success: true };
  }
}
