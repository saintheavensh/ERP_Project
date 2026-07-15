import { eq, desc, and } from "drizzle-orm";
import { purchaseReturns, purchaseReturnItems } from "../../../../../shared/infrastructure/database/schema";
import { TransactionContext } from "../../../../../shared/types/db-context";
import { IPurchaseReturnRepository, PurchaseReturn, PurchaseReturnItem } from "../../domain";

export class PurchaseReturnRepositoryAdapter implements IPurchaseReturnRepository {
    async findAll(tenantId: string, tx: TransactionContext): Promise<PurchaseReturn[]> {
        return await tx.query.purchaseReturns.findMany({
            where: eq(purchaseReturns.tenantId, tenantId),
            with: {
                supplier: true,
                user: true,
                items: {
                    with: {
                        product: true
                    }
                }
            },
            orderBy: [desc(purchaseReturns.date)]
        }) as PurchaseReturn[];
    }

    async findById(tenantId: string, id: string, tx: TransactionContext): Promise<PurchaseReturn | null> {
        const result = await tx.query.purchaseReturns.findFirst({
            where: and(
                eq(purchaseReturns.id, id),
                eq(purchaseReturns.tenantId, tenantId)
            ),
            with: {
                supplier: true,
                user: true,
                items: {
                    with: {
                        product: true,
                        batch: true
                    }
                }
            }
        });
        return (result as PurchaseReturn) || null;
    }

    async create(tenantId: string, data: Omit<PurchaseReturn, 'items' | 'createdAt'>, tx: TransactionContext): Promise<PurchaseReturn> {
        const [result] = await tx.insert(purchaseReturns).values({ ...data, tenantId }).returning();
        return result as PurchaseReturn;
    }

    async createItems(tenantId: string, items: Omit<PurchaseReturnItem, 'id' | 'createdAt'>[], tx: TransactionContext): Promise<void> {
        const itemsWithTenant = items.map(item => ({ ...item, tenantId }));
        await tx.insert(purchaseReturnItems).values(itemsWithTenant);
    }
}
