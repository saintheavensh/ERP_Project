import { purchasePayments } from "../../../../../shared/infrastructure/database/schema";
import { eq, and } from "drizzle-orm";
import { IPurchasePaymentRepository } from "../../domain/purchase-repository.port";
import { TransactionContext } from "../../../../../shared/types/db-context";

export class PurchasePaymentRepositoryAdapter implements IPurchasePaymentRepository {
    async savePayment(tenantId: string, payment: any, tx: TransactionContext): Promise<void> {
        await tx.insert(purchasePayments).values({
            ...payment,
            tenantId,
            id: payment.id || crypto.randomUUID()
        });
    }

    async findPaymentsByPurchaseId(tenantId: string, purchaseId: string, tx: TransactionContext): Promise<any[]> {
        return await tx.query.purchasePayments.findMany({
            where: and(
                eq(purchasePayments.purchaseId, purchaseId),
                eq(purchasePayments.tenantId, tenantId)
            )
        });
    }
}
