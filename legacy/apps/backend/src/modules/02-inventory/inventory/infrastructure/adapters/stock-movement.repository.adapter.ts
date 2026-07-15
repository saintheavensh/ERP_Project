import { stockMovements } from "../schema/StockMovementSchema";
import { eq, sql } from "drizzle-orm";
import { TransactionContext } from "@shared/types/db-context";
import { IStockMovementRepository } from "@domain/stock-movement.repository";
import { StockMovementEntity } from "@domain/stock-movement.entity";

export class StockMovementRepositoryAdapter implements IStockMovementRepository {
    async insert(movement: Omit<StockMovementEntity, "id" | "createdAt">, tx: TransactionContext): Promise<StockMovementEntity> {
        const [result] = await tx.insert(stockMovements).values({
            productId: movement.productId,
            type: movement.type,
            referenceType: movement.referenceType,
            referenceId: movement.referenceId,
            quantity: movement.quantity
        }).returning();

        return result as StockMovementEntity;
    }

    async getAggregatedStock(productId: string, tx: TransactionContext): Promise<number> {
        const result = await tx
            .select({
                total: sql<number>`SUM(CASE WHEN ${stockMovements.type} = 'IN' THEN ${stockMovements.quantity} ELSE -${stockMovements.quantity} END)`.mapWith(Number)
            })
            .from(stockMovements)
            .where(eq(stockMovements.productId, productId));

        return result[0]?.total || 0;
    }
}
