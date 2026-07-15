import { TransactionContext } from "../../../../../shared/types/db-context";
import { inventoryApplicationService } from "../../../../02-inventory/inventory/inventory-container";
import { IInventoryGateway } from "../../domain";

export class InventoryGatewayAdapter implements IInventoryGateway {
    async deductStockFIFO(tenantId: string, params: {
        saleId: string;
        items: {
            productId: string;
            variant: string;
            quantity: number;
            unitPrice: number;
        }[];
    }, tx: TransactionContext): Promise<{ allocations: any[]; cogsAmount: number }> {
        // TODO: propagate tenantId when inventoryApplicationService is tenant-hardened
        return await inventoryApplicationService.deductStockFIFO(params);
    }
}
