import { TransactionContext } from "../../../../../shared/types/db-context";
import { productBatches } from "../../../../../shared/infrastructure/database/schema";
import { eq } from "drizzle-orm";

export interface CreateReturnDTO {
    batchId: string;
    qty: number;
    reason: string;
    userId: string;
}

export class ReturnPurchaseUseCase {

    /**
     * Validates if a specific batch can be returned to the supplier based on stock and warranty period.
     */
    async validateReturn(tenantId: string, batchId: string, tx: TransactionContext) {
        const [batch] = await tx
            .select()
            .from(productBatches)
            .where(eq(productBatches.id, batchId));

        if (!batch) {
            throw new Error('Batch not found');
        }

        if (batch.currentStock <= 0) {
            throw new Error('No stock available in this batch');
        }

        const today = new Date();
        if (batch.warrantyEndDate && today > batch.warrantyEndDate) {
            const expiryStr = new Date(batch.warrantyEndDate).toLocaleDateString();
            throw new Error(`Cannot return: Warranty expired on ${expiryStr}`);
        }

        return true;
    }

    async execute(tenantId: string, data: CreateReturnDTO, tx: TransactionContext) {
        const runInternal = async () => {
            // 1. Strict Validation Guard
            await this.validateReturn(tenantId, data.batchId, tx);

            // 2. Draft mapping for future return ledger insertion
            // const returnRecord = await tx.insert(purchaseReturns).values(...)
            // const returnItems = await tx.insert(purchaseReturnItems).values(...)
            // await auth stock reduction via InventoryService

            return {
                success: true,
                message: "Return validated against warranty successfully"
            };
        };

        return await runInternal();
    }
}
