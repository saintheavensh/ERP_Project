/**
 * Drizzle-based batch repository adapter.
 * Implements IBatchRepository from the inventory domain layer.
 * Extracts getLastBatchByProduct from the old ProductRepositoryAdapter.
 */
import type { IBatchRepository, ProductBatchEntity } from "@domain/batch-repository.port";
import { productBatches } from "@shared/infrastructure/database/schema";
import { eq, and } from "drizzle-orm";
import { TransactionContext } from "@shared/types/db-context";

export class BatchRepositoryAdapter implements IBatchRepository {
    async getLastBatchByProduct(productId: string, tx: TransactionContext): Promise<ProductBatchEntity | null> {
        return await tx.query.productBatches.findFirst({
            where: and(
                eq(productBatches.productId, productId),
                eq(productBatches.tenantId, tx.tenantId!)
            ),
            orderBy: (b: any, { desc }: any) => [desc(b.createdAt)],
            with: { supplier: true }
        }) || null;
    }

    async findById(batchId: string, tx: TransactionContext): Promise<ProductBatchEntity | null> {
        return await tx.query.productBatches.findFirst({
            where: and(
                eq(productBatches.id, batchId),
                eq(productBatches.tenantId, tx.tenantId!)
            ),
            with: { supplier: true }
        }) || null;
    }
}
