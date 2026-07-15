import { PurchaseRepositoryAdapter } from "./infrastructure/adapters/purchase-repository.adapter";
import { PurchasePaymentRepositoryAdapter } from "./infrastructure/adapters/purchase-payment-repository.adapter";
import { PurchaseActivityLoggerAdapter } from "./infrastructure/adapters/purchase-activity-logger.adapter";
import { PurchaseNotificationGatewayAdapter } from "./infrastructure/adapters/purchase-notification-gateway.adapter";
import { PurchaseVariantPolicyAdapter } from "./infrastructure/adapters/purchase-variant-policy.adapter";
import { PurchaseAccountingGatewayAdapter } from "./infrastructure/adapters/purchase-accounting-gateway.adapter";
import { CreatePurchaseOrderUseCase } from "./application/use-cases/create-purchase-order.use-case";
import { ReceiveGoodsUseCase } from "./application/use-cases/receive-goods.use-case";
import { VerifyAndCompletePurchaseUseCase } from "./application/use-cases/verify-and-complete-purchase.use-case";
import { CancelPurchaseOrderUseCase } from "./application/use-cases/cancel-purchase-order.use-case";
import { DeletePurchaseUseCase } from "./application/use-cases/delete-purchase.use-case";
import { GetPurchasesUseCase, GetPurchaseByIdUseCase } from "./application/use-cases/query-purchases.use-case";
import { GetLowStockSummaryUseCase } from "./application/use-cases/get-low-stock-summary.use-case";
import { PurchaseOrder } from "./domain/entities/purchase.entity";

import { inventoryService } from "../../02-inventory/inventory/inventory-container";

// 1. Adapters
const purchaseRepo = new PurchaseRepositoryAdapter();
const paymentRepo = new PurchasePaymentRepositoryAdapter();
const activityLogger = new PurchaseActivityLoggerAdapter();
const notificationGateway = new PurchaseNotificationGatewayAdapter();
const variantPolicyGateway = new PurchaseVariantPolicyAdapter();
const accountingGateway = new PurchaseAccountingGatewayAdapter();

// 2. Use Cases
const createPurchaseOrderUC = new CreatePurchaseOrderUseCase(
    purchaseRepo,
    activityLogger,
    notificationGateway,
    variantPolicyGateway
);
const receiveGoodsUC = new ReceiveGoodsUseCase(purchaseRepo, notificationGateway);
const verifyAndCompletePurchaseUC = new VerifyAndCompletePurchaseUseCase(
    purchaseRepo,
    paymentRepo,
    inventoryService,
    accountingGateway
);
const cancelPurchaseOrderUC = new CancelPurchaseOrderUseCase(purchaseRepo, inventoryService);
const deletePurchaseUC = new DeletePurchaseUseCase(purchaseRepo, inventoryService);
const getPurchasesUC = new GetPurchasesUseCase(purchaseRepo);
const getPurchaseByIdUC = new GetPurchaseByIdUseCase(purchaseRepo);
const getLowStockSummaryUC = new GetLowStockSummaryUseCase(inventoryService);

import { inventoryAuthority } from "../../02-inventory/inventory/inventory-container";
import { TransactionContext } from "../../../shared/types/db-context";

// 3. Facade Service (Thin Wrapper)
export class PurchasesService {
    async getAll(tenantId: string, filters?: any): Promise<PurchaseOrder[]> {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getPurchasesUC.execute(tenantId, filters, tx)
        ) as PurchaseOrder[];
    }

    async getById(tenantId: string, id: string): Promise<PurchaseOrder | null> {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getPurchaseByIdUC.execute(tenantId, id, tx)
        ) as PurchaseOrder | null;
    }

    async createOrder(tenantId: string, data: any) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await createPurchaseOrderUC.execute(tenantId, data, tx)
        );
    }

    async receiveGoods(tenantId: string, purchaseId: string, userId: string, items: any[]) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await receiveGoodsUC.execute(tenantId, { purchaseId, receivedByUserId: userId, items }, tx)
        );
    }

    async verifyAndComplete(tenantId: string, purchaseId: string, userId: string, items: any[], options: any = {}) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await verifyAndCompletePurchaseUC.execute(tenantId, {
                purchaseId,
                userId,
                items,
                options
            }, tx)
        );
    }

    async cancelOrder(tenantId: string, id: string, userId: string, reason?: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await cancelPurchaseOrderUC.execute(tenantId, id, userId, reason, tx)
        );
    }

    async deletePurchase(tenantId: string, id: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await deletePurchaseUC.execute(tenantId, id, tx)
        );
    }

    async getLowStockSummary(tenantId: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getLowStockSummaryUC.execute(tenantId, tx)
        );
    }
}

/** Singleton instance for use in controllers/routes */
export const purchasesService = new PurchasesService();
