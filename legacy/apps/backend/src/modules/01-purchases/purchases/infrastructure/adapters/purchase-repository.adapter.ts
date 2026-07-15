import { TransactionContext } from "../../../../../shared/types/db-context";
import { purchases, purchaseItems } from "../../../../../shared/infrastructure/database/schema";
import { eq, and } from "drizzle-orm";
import { IPurchaseRepository } from "../../domain/purchase-repository.port";
import { PurchaseOrder, PurchaseItem, PurchaseStatus } from "../../domain/entities/purchase.entity";

export class PurchaseRepositoryAdapter implements IPurchaseRepository {
    async findById(tenantId: string, id: string, tx: TransactionContext): Promise<PurchaseOrder | null> {
        const result = await tx.query.purchases.findFirst({
            where: and(
                eq(purchases.id, id),
                eq(purchases.tenantId, tenantId)
            ),
            with: {
                items: true
            }
        });

        if (!result) return null;

        // Map Drizzle result to Domain Entity
        const items = (result.items || []).map(item => new PurchaseItem({
            id: item.id,
            productId: item.productId,
            variantId: item.variant || undefined, // Map 'variant' (string) to variantId
            qtyOrdered: item.qtyOrdered,
            qtyReceived: item.qtyReceived,
            buyPrice: item.buyPrice,
            sellPrice: item.sellPrice,
            batchId: item.batchId || undefined
        }));

        return new PurchaseOrder({
            id: result.id,
            supplierId: result.supplierId,
            userId: result.userId || undefined,
            totalAmount: result.totalAmount,
            status: result.status as PurchaseStatus, // Basic cast for now
            items: items,
            date: result.date || undefined,
            referenceNumber: result.referenceNumber || undefined,
            notes: result.notes || undefined,
            receivedAt: result.receivedAt || undefined,
            receivedBy: result.receivedBy || undefined,
            verifiedAt: result.verifiedAt || undefined,
            verifiedBy: result.verifiedBy || undefined,
            cancelledAt: result.cancelledAt || undefined,
            cancelledBy: result.cancelledBy || undefined,
            shippingFee: result.shippingFee || undefined,
            discountAmount: result.discountAmount || undefined,
            shippingExpenseAccountId: result.shippingExpenseAccountId || undefined,
            paymentDueDate: result.paymentDueDate || undefined
        });
    }

    async save(tenantId: string, purchase: PurchaseOrder, tx: TransactionContext): Promise<void> {
        const snapshot = purchase.toSnapshot();

        // Upsert Purchase Header
        await tx.insert(purchases).values({
            id: snapshot.id,
            tenantId,
            supplierId: snapshot.supplierId,
            userId: snapshot.userId,
            totalAmount: snapshot.totalAmount,
            status: snapshot.status,
            date: snapshot.date,
            referenceNumber: snapshot.referenceNumber,
            notes: snapshot.notes,
            receivedAt: snapshot.receivedAt,
            receivedBy: snapshot.receivedBy,
            verifiedAt: snapshot.verifiedAt,
            verifiedBy: snapshot.verifiedBy,
            cancelledAt: snapshot.cancelledAt,
            cancelledBy: snapshot.cancelledBy,
            shippingFee: snapshot.shippingFee,
            discountAmount: snapshot.discountAmount,
            shippingExpenseAccountId: snapshot.shippingExpenseAccountId,
            paymentDueDate: snapshot.paymentDueDate
        }).onConflictDoUpdate({
            target: purchases.id,
            set: {
                status: snapshot.status,
                totalAmount: snapshot.totalAmount,
                receivedAt: snapshot.receivedAt,
                receivedBy: snapshot.receivedBy,
                verifiedAt: snapshot.verifiedAt,
                verifiedBy: snapshot.verifiedBy,
                cancelledAt: snapshot.cancelledAt,
                cancelledBy: snapshot.cancelledBy,
                notes: snapshot.notes,
                shippingFee: snapshot.shippingFee,
                discountAmount: snapshot.discountAmount,
                shippingExpenseAccountId: snapshot.shippingExpenseAccountId,
                paymentDueDate: snapshot.paymentDueDate,
                referenceNumber: snapshot.referenceNumber
            }
        });

        // Upsert Purchase Items
        for (const item of snapshot.items) {
            await tx.insert(purchaseItems).values({
                id: item.id,
                tenantId,
                purchaseId: snapshot.id,
                productId: item.productId,
                variant: item.variantId,
                qtyOrdered: item.qtyOrdered,
                qtyReceived: item.qtyReceived,
                buyPrice: item.buyPrice,
                sellPrice: item.sellPrice,
                batchId: item.batchId
            }).onConflictDoUpdate({
                target: purchaseItems.id,
                set: {
                    qtyReceived: item.qtyReceived,
                    batchId: item.batchId
                }
            });
        }
    }

    async findAll(tenantId: string, _filters: any, tx: TransactionContext): Promise<PurchaseOrder[]> {
        const results = await tx.query.purchases.findMany({
            where: eq(purchases.tenantId, tenantId),
            with: {
                items: true
            },
            orderBy: (purchases, { desc }) => [desc(purchases.date)]
        });

        return results.map(result => {
            const items = (result.items || []).map(item => new PurchaseItem({
                id: item.id,
                productId: item.productId,
                variantId: item.variant || undefined,
                qtyOrdered: item.qtyOrdered,
                qtyReceived: item.qtyReceived,
                buyPrice: item.buyPrice,
                sellPrice: item.sellPrice,
                batchId: item.batchId || undefined
            }));

            return new PurchaseOrder({
                id: result.id,
                supplierId: result.supplierId,
                userId: result.userId || undefined,
                totalAmount: result.totalAmount,
                status: result.status as PurchaseStatus,
                items: items,
                date: result.date || undefined,
                referenceNumber: result.referenceNumber || undefined,
                notes: result.notes || undefined,
                receivedAt: result.receivedAt || undefined,
                receivedBy: result.receivedBy || undefined,
                verifiedAt: result.verifiedAt || undefined,
                verifiedBy: result.verifiedBy || undefined,
                cancelledAt: result.cancelledAt || undefined,
                cancelledBy: result.cancelledBy || undefined,
                shippingFee: result.shippingFee || undefined,
                discountAmount: result.discountAmount || undefined,
                shippingExpenseAccountId: result.shippingExpenseAccountId || undefined,
                paymentDueDate: result.paymentDueDate || undefined
            });
        });
    }

    async delete(tenantId: string, id: string, tx: TransactionContext): Promise<void> {
        await tx.delete(purchaseItems).where(
            and(
                eq(purchaseItems.purchaseId, id),
                eq(purchaseItems.tenantId, tenantId)
            )
        );
        await tx.delete(purchases).where(
            and(
                eq(purchases.id, id),
                eq(purchases.tenantId, tenantId)
            )
        );
    }
}
