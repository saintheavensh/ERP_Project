import { IDefectiveItemRepository, IInventoryGateway } from "../../domain";
import { v4 as uuidv4 } from "uuid";
import { HTTPException } from "hono/http-exception";
import { InventoryTransactionAuthority } from "../../../inventory/application/services/inventory-transaction-authority";
import { TransactionContext } from "../../../../../shared/types/db-context";

export class AddDefectiveItemUseCase {
    constructor(
        private readonly repository: IDefectiveItemRepository,
        private readonly inventoryGateway: IInventoryGateway,
        private readonly inventoryAuthority: InventoryTransactionAuthority
    ) { }

    async execute(data: {
        productId: string;
        batchId: string;
        qty: number;
        reason: string;
        source: "manual" | "sales_return" | "service_return";
        sourceRefId?: string;
    }, tx: TransactionContext): Promise<{ id: string }> {
        const runInternal = async () => {
            // 1. Validate Batch Stock via Inventory Gateway
            const batch = await this.inventoryGateway.getBatch(data.batchId, tx);

            if (!batch) throw new HTTPException(404, { message: "Batch not found" });
            if (batch.currentStock < data.qty) {
                throw new HTTPException(400, { message: "Insufficient stock in batch" });
            }

            // 2. Batch must have supplier for defective link
            if (!batch.supplierId) throw new HTTPException(400, { message: "Batch has no supplier" });

            // 3. Create Defective Item
            const id = `DEF-${uuidv4().substring(0, 8)}`;
            await this.repository.create({
                id,
                productId: data.productId,
                batchId: data.batchId,
                supplierId: batch.supplierId,
                qty: data.qty,
                source: data.source,
                sourceRefId: data.sourceRefId,
                reason: data.reason,
                status: "pending"
            }, tx);

            // 4. Reduce Good Stock via Inventory Gateway
            await this.inventoryGateway.reduceStock(data.batchId, data.qty, tx);

            return { id };
        };

        return await runInternal();
    }
}
