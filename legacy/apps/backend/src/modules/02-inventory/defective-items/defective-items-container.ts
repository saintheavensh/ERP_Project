import { TransactionContext } from "../../../shared/types/db-context";
import {
    DefectiveItemRepositoryAdapter,
    InventoryGatewayAdapter,
    PurchaseReturnGatewayAdapter
} from "./infrastructure";
import {
    GetDefectiveItemsUseCase,
    AddDefectiveItemUseCase,
    ProcessReturnUseCase
} from "./application";
import { DefectiveItemStatus } from "./domain";

import { inventoryAuthority } from "../inventory/inventory-container";

// Adapters
const repository = new DefectiveItemRepositoryAdapter();
const inventoryGateway = new InventoryGatewayAdapter();
const purchaseReturnGateway = new PurchaseReturnGatewayAdapter();

// Use Cases
const getDefectiveItemsUC = new GetDefectiveItemsUseCase(repository);
const addDefectiveItemUC = new AddDefectiveItemUseCase(repository, inventoryGateway, inventoryAuthority);
const processReturnUC = new ProcessReturnUseCase(repository, purchaseReturnGateway, inventoryAuthority);

/**
 * DefectiveItemsApplicationService — Facade for external and presentation layers.
 */
export class DefectiveItemsApplicationService {
    async getPendingItems(tenantId: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getDefectiveItemsUC.execute(tx, "pending")
        );
    }

    async getProcessedItems(tenantId: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getDefectiveItemsUC.execute(tx, "processed")
        );
    }

    async addItem(tenantId: string, data: any) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await addDefectiveItemUC.execute(data, tx)
        );
    }

    async processReturn(tenantId: string, userId: string, itemIds: string[]) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await processReturnUC.execute(userId, itemIds, tx)
        );
    }
}

/** Singleton instance */
export const defectiveItemsApplicationService = new DefectiveItemsApplicationService();
