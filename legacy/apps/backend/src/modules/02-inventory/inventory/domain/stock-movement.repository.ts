import { TransactionContext } from "@shared/types/db-context";
import { StockMovementEntity } from "./stock-movement.entity";

export interface IStockMovementRepository {
    insert(movement: Omit<StockMovementEntity, "id" | "createdAt">, tx: TransactionContext): Promise<StockMovementEntity>;
    getAggregatedStock(productId: string, tx: TransactionContext): Promise<number>;
}
