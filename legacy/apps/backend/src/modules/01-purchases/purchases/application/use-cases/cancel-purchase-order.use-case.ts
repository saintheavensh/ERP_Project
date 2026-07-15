import { TransactionContext } from "../../../../../shared/types/db-context";
import { IPurchaseRepository } from "../../domain/purchase-repository.port";
import { InventoryService } from "../../../../02-inventory/inventory/application/services/inventory.service";

export class CancelPurchaseOrderUseCase {
    constructor(
        private purchaseRepo: IPurchaseRepository,
        private inventoryService: InventoryService
    ) { }

    async execute(tenantId: string, purchaseId: string, userId: string, reason: string | undefined, tx: TransactionContext): Promise<void> {
        const runInternal = async () => {
            const purchase = await this.purchaseRepo.findById(tenantId, purchaseId, tx);
            if (!purchase) {
                throw new Error(`Purchase order ${purchaseId} not found`);
            }

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

            // Domain Logic
            purchase.cancel(userId, reason);

            // Persistence
            await this.purchaseRepo.save(tenantId, purchase, tx);
        };

        return await runInternal();
    }
}
