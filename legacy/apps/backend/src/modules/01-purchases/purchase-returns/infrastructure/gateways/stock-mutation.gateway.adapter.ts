import { eq } from "drizzle-orm";
import { DBContext } from "../../../../../shared/types/db-context";
import { db } from "../../../../../shared/infrastructure/database/client";
import { products, productBatches } from "../../../../../shared/infrastructure/database/schema";
import { IStockMutationGateway } from "../../domain";

export class StockMutationGatewayAdapter implements IStockMutationGateway {
    async deductBatchStock(batchId: string, qty: number, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        const batch = await this.getBatchStock(batchId, dbOrTx);
        if (!batch) return;

        await client.update(productBatches)
            .set({ currentStock: batch.currentStock - qty })
            .where(eq(productBatches.id, batchId));
    }

    async updateProductStock(productId: string, delta: number, dbOrTx?: DBContext): Promise<void> {
        const client = (dbOrTx as any) || db;
        const product = await client.query.products.findFirst({
            where: eq(products.id, productId)
        });

        if (product) {
            await client.update(products)
                .set({ stock: product.stock + delta })
                .where(eq(products.id, productId));
        }
    }

    async getBatchStock(batchId: string, dbOrTx?: DBContext): Promise<{ productId: string, currentStock: number } | null> {
        const client = (dbOrTx as any) || db;
        const batch = await client.query.productBatches.findFirst({
            where: eq(productBatches.id, batchId)
        });
        return batch ? { productId: batch.productId, currentStock: batch.currentStock } : null;
    }
}
