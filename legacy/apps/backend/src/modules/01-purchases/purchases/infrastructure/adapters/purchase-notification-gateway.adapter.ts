import { notifications } from "../../../../../shared/infrastructure/database/schema";
import { INotificationGateway } from "../../domain/purchase-repository.port";
import { TransactionContext } from "../../../../../shared/types/db-context";

export class PurchaseNotificationGatewayAdapter implements INotificationGateway {
    async notifyPurchaseOrderCreated(
        tenantId: string,
        payload: { purchaseId: string; userId: string; supplierId: string },
        tx: TransactionContext
    ): Promise<void> {
        await tx.insert(notifications).values({
            tenantId,
            userId: "user-warehouse-001",
            type: "po_action_required",
            title: "New Purchase Order",
            message: `New Order ${payload.purchaseId} requires receiving.`,
            entityType: "purchase",
            entityId: payload.purchaseId,
        });
    }

    async notifyGoodsReceived(
        tenantId: string,
        payload: { purchaseId: string; userId: string; hasDiscrepancy: boolean },
        tx: TransactionContext
    ): Promise<void> {
        await tx.insert(notifications).values({
            tenantId,
            userId: payload.userId,
            type: payload.hasDiscrepancy ? "po_discrepancy" : "po_action_required",
            title: payload.hasDiscrepancy ? "PO Discrepancy Found" : "Goods Received",
            message: payload.hasDiscrepancy
                ? `Order ${payload.purchaseId} has quantity mismatches. Please verify.`
                : `Order ${payload.purchaseId} has been received. Please verify and set prices.`,
            entityType: "purchase",
            entityId: payload.purchaseId,
        });
    }
}

