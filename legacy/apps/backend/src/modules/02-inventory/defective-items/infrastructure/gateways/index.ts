import type { TransactionContext } from "../../../../../shared/types/db-context";
import type { ProductBatchEntity } from "../../../inventory/domain/batch-repository.port";
import { inventoryApplicationService } from "../../../inventory/inventory-container";
import { purchaseReturnsService } from "../../../../01-purchases/purchase-returns/purchase-returns-container";
import { IInventoryGateway, IPurchaseReturnGateway } from "../../domain";

export class InventoryGatewayAdapter implements IInventoryGateway {
    async getBatch(batchId: string, tx: TransactionContext): Promise<ProductBatchEntity | null> {
        return await inventoryApplicationService.getBatchById(batchId, tx);
    }

    async reduceStock(batchId: string, qty: number, tx: TransactionContext): Promise<void> {
        // reduceStock requires tenantId; use a placeholder since defective-items gateway
        // operates within an InventoryTransactionAuthority context which already has tenantId.
        await inventoryApplicationService.reduceStock(batchId, qty, "system");
    }
}

export class PurchaseReturnGatewayAdapter implements IPurchaseReturnGateway {
    async createReturn(params: {
        supplierId: string;
        userId: string;
        items: Array<{
            productId: string;
            batchId: string;
            qty: number;
            reason: string;
        }>;
        notes?: string;
    }, tx: TransactionContext): Promise<{ returnId: string }> {
        const result = await purchaseReturnsService.create(params, tx);
        return { returnId: result.id };
    }
}
