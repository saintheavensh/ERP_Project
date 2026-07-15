import { IDefectiveItemRepository, IPurchaseReturnGateway } from "../../domain";
import { HTTPException } from "hono/http-exception";
import { InventoryTransactionAuthority } from "../../../inventory/application/services/inventory-transaction-authority";
import { TransactionContext } from "../../../../../shared/types/db-context";

export class ProcessReturnUseCase {
    constructor(
        private readonly repository: IDefectiveItemRepository,
        private readonly purchaseReturnGateway: IPurchaseReturnGateway,
        private readonly inventoryAuthority: InventoryTransactionAuthority
    ) { }

    async execute(userId: string, itemIds: string[], tx: TransactionContext): Promise<{ returnId: string }> {
        if (itemIds.length === 0) throw new HTTPException(400, { message: "No items selected" });

        const runInternal = async () => {
            // 1. Load Items
            const items = await this.repository.findByIds(itemIds, tx);

            if (items.length !== itemIds.length) {
                throw new HTTPException(400, { message: "Some items not found or status mismatch" });
            }

            // 2. Validate Same Supplier
            const supplierId = items[0].supplierId;
            const differentSupplier = items.find(i => i.supplierId !== supplierId);
            if (differentSupplier) {
                throw new HTTPException(400, { message: "All items must be from the same supplier" });
            }

            // 3. Ensure all items are pending
            const notPending = items.find(i => i.status !== "pending");
            if (notPending) {
                throw new HTTPException(400, { message: `Item ${notPending.id} is not pending` });
            }

            // 4. Create Purchase Return via Gateway
            const { returnId } = await this.purchaseReturnGateway.createReturn({
                supplierId,
                userId,
                items: items.map(i => ({
                    productId: i.productId,
                    batchId: i.batchId,
                    qty: i.qty,
                    reason: i.reason ?? ""
                })),
                notes: "Auto-generated from Defective Items"
            }, tx);

            // 5. Update Status
            await this.repository.updateStatus(itemIds, "processed", tx);

            return { returnId };
        };

        return await runInternal();
    }
}
