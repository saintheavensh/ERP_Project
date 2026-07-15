import { TransactionContext } from "../../../../../shared/types/db-context";
import { brands } from "../../../../../shared/infrastructure/database/schema";
import { eq, desc, ilike, and } from "drizzle-orm";
import { IBrandRepository, Brand, CreateBrandData, UpdateBrandData } from "../../domain";

export class BrandRepositoryAdapter implements IBrandRepository {
    async findAll(tx: TransactionContext): Promise<Brand[]> {
        return await tx.select().from(brands).where(eq(brands.tenantId, tx.tenantId!)).orderBy(desc(brands.createdAt));
    }

    async findById(id: string, tx: TransactionContext): Promise<Brand | null> {
        const results = await tx
            .select()
            .from(brands)
            .where(and(eq(brands.id, id), eq(brands.tenantId, tx.tenantId!)));
        return results[0] || null;
    }

    async findByName(name: string, tx: TransactionContext): Promise<Brand | null> {
        const results = await tx
            .select()
            .from(brands)
            .where(and(ilike(brands.name, name), eq(brands.tenantId, tx.tenantId!)));
        return results[0] || null;
    }

    async create(data: CreateBrandData, tx: TransactionContext): Promise<Brand[]> {
        return await tx.insert(brands).values({
            ...data,
            tenantId: tx.tenantId!
        }).returning();
    }

    async update(id: string, data: UpdateBrandData, tx: TransactionContext): Promise<Brand[]> {
        return await tx
            .update(brands)
            .set(data)
            .where(and(eq(brands.id, id), eq(brands.tenantId, tx.tenantId!)))
            .returning();
    }

    async delete(id: string, tx: TransactionContext): Promise<Brand[]> {
        return await tx.delete(brands).where(and(eq(brands.id, id), eq(brands.tenantId, tx.tenantId!))).returning();
    }
}
