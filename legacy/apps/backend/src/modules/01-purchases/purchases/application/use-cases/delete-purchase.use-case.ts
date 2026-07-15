import { TransactionContext } from "../../../../../shared/types/db-context";
import { IPurchaseRepository } from "../../domain/purchase-repository.port";
import { InventoryService } from "../../../../02-inventory/inventory/application/services/inventory.service";

export class DeletePurchaseUseCase {
    constructor(
        private purchaseRepo: IPurchaseRepository,
        private inventoryService: InventoryService
    ) { }

    async execute(tenantId: string, purchaseId: string, tx: TransactionContext): Promise<void> {
        const runInternal = async () => {
            const purchase = await this.purchaseRepo.findById(tenantId, purchaseId, tx);
            if (!purchase) return; // Idempotent delete

            // Reversal Trigger: Any item already received must be reversed in inventory
            const itemsToReverse = purchase.items
                .filter(i => i.qtyReceived > 0)
                .map(i => ({
                    productId: i.productId,
                    batchId: i.batchId || null,
                    qtyReceived: i.qtyReceived
                }));

            if (itemsToReverse.length > 0) {
                await this.inventoryService.reverseStockFromPurchaseDeletion({
                    purchaseId: purchase.id,
                    items: itemsToReverse
                }, tx, tenantId);
            }

            // Persistence
            await this.purchaseRepo.delete(tenantId, purchaseId, tx);
        };

        return await runInternal();
    }
}
