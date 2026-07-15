import type {
    IStockOpnameRepository,
    OpnameSessionEntity,
    OpnameItemEntity,
    OpnameBatchEntity,
    AdjustmentHistoryRow,
    InsertSessionData,
    InsertItemData,
    OpnameStatus
} from "@domain/stock-opname-repository.port";
import {
    stockOpnameSessions,
    stockOpnameItems,
    productBatches,
    products,
    productVariants
} from "@shared/infrastructure/database/schema";
import { logger, type LogContext } from "@shared/logging/AppLogger";
import { eq, and, sql, asc, desc, isNull } from "drizzle-orm";
import { TransactionContext } from "@shared/types/db-context";

export class StockOpnameRepositoryAdapter implements IStockOpnameRepository {

    async insertSession(tenantId: string, data: InsertSessionData, tx: TransactionContext): Promise<void> {
        await tx.insert(stockOpnameSessions).values({
            id: data.id,
            tenantId,
            userId: data.userId,
            notes: data.notes ?? null,
            status: data.status as any
        });
    }

    async updateSessionStatus(tenantId: string, id: string, status: OpnameStatus, completedAt: Date | undefined, tx: TransactionContext): Promise<void> {
        const setData: any = { status };
        if (completedAt) setData.completedAt = completedAt;
        await tx.update(stockOpnameSessions)
            .set(setData)
            .where(and(eq(stockOpnameSessions.id, id), eq(stockOpnameSessions.tenantId, tenantId)));
    }

    async insertItems(tenantId: string, items: InsertItemData[], tx: TransactionContext): Promise<void> {
        const itemsWithTenant = items.map(item => ({ ...item, tenantId }));
        await tx.insert(stockOpnameItems).values(itemsWithTenant as any);
    }

    async updateItem(tenantId: string, itemId: number, physicalStock: number, reason: string | undefined, tx: TransactionContext): Promise<OpnameItemEntity | null> {
        const item = await tx.query.stockOpnameItems.findFirst({
            where: and(
                eq(stockOpnameItems.id, String(itemId)),
                eq(stockOpnameItems.tenantId, tenantId)
            )
        });
        if (!item) return null;

        await tx.update(stockOpnameItems).set({
            physicalStock,
            adjustmentReason: reason
        }).where(and(
            eq(stockOpnameItems.id, String(itemId)),
            eq(stockOpnameItems.tenantId, tenantId)
        ));

        const difference = physicalStock - item.systemStock;
        return {
            id: item.id as any,
            sessionId: item.sessionId,
            productId: item.productId,
            variantName: item.variantName as any,
            systemStock: item.systemStock,
            physicalStock,
            adjustmentReason: reason ?? null,
            difference
        };
    }

    async findSessions(tenantId: string, tx: TransactionContext): Promise<OpnameSessionEntity[]> {
        const rows = await tx.query.stockOpnameSessions.findMany({
            where: eq(stockOpnameSessions.tenantId, tenantId),
            with: { creator: true },
            orderBy: (s: any, { desc }: any) => [desc(s.createdAt)]
        });
        return rows.map((r: any) => ({
            ...r,
            user: r.creator
        })) as OpnameSessionEntity[];
    }

    async findSessionById(tenantId: string, id: string, tx: TransactionContext): Promise<OpnameSessionEntity | null> {
        const sessionArr = await tx.select().from(stockOpnameSessions).where(
            and(eq(stockOpnameSessions.id, id), eq(stockOpnameSessions.tenantId, tenantId))
        );
        if (sessionArr.length === 0) return null;
        return sessionArr[0] as any as OpnameSessionEntity;
    }

    async findItemsBySession(tenantId: string, sessionId: string, tx: TransactionContext): Promise<OpnameItemEntity[]> {
        const items = await tx.select({
            id: stockOpnameItems.id,
            sessionId: stockOpnameItems.sessionId,
            productId: stockOpnameItems.productId,
            variantName: stockOpnameItems.variantName,
            systemStock: stockOpnameItems.systemStock,
            physicalStock: stockOpnameItems.physicalStock,
            adjustmentReason: stockOpnameItems.adjustmentReason,
            product: products
        })
            .from(stockOpnameItems)
            .leftJoin(products, eq(stockOpnameItems.productId, products.id))
            .where(and(
                eq(stockOpnameItems.sessionId, sessionId),
                eq(stockOpnameItems.tenantId, tenantId)
            ));

        return items.map((i: any) => ({
            id: i.id as any,
            sessionId: i.sessionId,
            productId: i.productId,
            variantName: i.variantName || "",
            systemStock: i.systemStock,
            physicalStock: i.physicalStock,
            adjustmentReason: i.adjustmentReason ?? null,
            difference: i.physicalStock !== null ? (i.physicalStock - i.systemStock) : 0,
            product: i.product
        }));
    }

    async findProductIdsByCategory(tenantId: string, categoryId: string, tx: TransactionContext): Promise<string[]> {
        const productList = await tx.select({ id: products.id })
            .from(products)
            .where(and(
                eq(products.categoryId, categoryId),
                eq(products.tenantId, tenantId)
            ));
        return productList.map((p: any) => p.id);
    }

    async findAllBatches(tenantId: string, productIds: string[] | undefined, tx: TransactionContext): Promise<OpnameBatchEntity[]> {
        let rows: any[];
        if (productIds && productIds.length > 0) {
            rows = await tx.query.productBatches.findMany({
                where: (b: any, { and, inArray, eq }: any) => and(
                    inArray(b.productId, productIds),
                    eq(b.tenantId, tenantId)
                )
            });
        } else {
            rows = await tx.query.productBatches.findMany({
                where: (b: any, { eq }: any) => eq(b.tenantId, tenantId)
            });
        }
        return rows as any[] as OpnameBatchEntity[];
    }

    async findBatchesByProductAndVariant(
        tenantId: string,
        productId: string,
        variantName: string | null,
        tx: TransactionContext
    ): Promise<OpnameBatchEntity[]> {
        let targetVariantId: string | null = null;
        if (variantName) {
            const vQuery = await tx.select({ id: productVariants.id })
                .from(productVariants)
                .where(and(
                    eq(productVariants.productId, productId),
                    eq(productVariants.name, variantName),
                    eq(productVariants.tenantId, tenantId)
                ));
            if (vQuery[0]) targetVariantId = vQuery[0].id;
        }

        const rows = await tx.select().from(productBatches).where(
            and(
                eq(productBatches.productId, productId),
                eq(productBatches.tenantId, tenantId),
                targetVariantId
                    ? eq(productBatches.variantId, targetVariantId)
                    : isNull(productBatches.variantId)
            )
        ).orderBy(asc(productBatches.createdAt));

        return rows as any[] as OpnameBatchEntity[];
    }

    async resolveVariantId(tenantId: string, productId: string, variantName: string, tx: TransactionContext): Promise<string | null> {
        const vQuery = await tx.select({ id: productVariants.id })
            .from(productVariants)
            .where(and(
                eq(productVariants.productId, productId),
                eq(productVariants.name, variantName),
                eq(productVariants.tenantId, tenantId)
            ));
        return vQuery[0] ? vQuery[0].id : null;
    }

    async updateBatchStock(tenantId: string, batchId: string, newStock: number, tx: TransactionContext): Promise<void> {
        await tx.update(productBatches).set({
            currentStock: newStock,
            updatedAt: new Date()
        }).where(and(
            eq(productBatches.id, batchId),
            eq(productBatches.tenantId, tenantId)
        ));
    }

    async updateProductStockDelta(tenantId: string, productId: string, delta: number, tx: TransactionContext): Promise<void> {
        await tx.update(products).set({
            stock: sql`${products.stock} + ${delta}`
        }).where(and(
            eq(products.id, productId),
            eq(products.tenantId, tenantId)
        ));
    }

    async getAdjustmentHistoryRows(tenantId: string, tx: TransactionContext): Promise<AdjustmentHistoryRow[]> {
        const usersMap = await tx.query.users.findMany({
            where: (u: any, { eq }: any) => eq(u.tenantId, tenantId)
        }).then((rows: any[]) => {
            const map: Record<string, string> = {};
            rows.forEach((r: any) => map[r.id] = r.name);
            return map;
        });

        const rRows = await tx.select({
            id: stockOpnameItems.id,
            sessionId: stockOpnameItems.sessionId,
            productId: stockOpnameItems.productId,
            productName: products.name,
            variantName: stockOpnameItems.variantName,
            systemStock: stockOpnameItems.systemStock,
            physicalStock: stockOpnameItems.physicalStock,
            difference: sql<number>`(${stockOpnameItems.physicalStock} - ${stockOpnameItems.systemStock})`,
            reason: stockOpnameItems.adjustmentReason,
            completedAt: stockOpnameSessions.completedAt,
            userId: stockOpnameSessions.userId
        })
            .from(stockOpnameItems)
            .innerJoin(stockOpnameSessions, eq(stockOpnameItems.sessionId, stockOpnameSessions.id))
            .innerJoin(products, eq(stockOpnameItems.productId, products.id))
            .where(
                and(
                    eq(stockOpnameSessions.status, "completed"),
                    eq(stockOpnameSessions.tenantId, tenantId),
                    sql`${stockOpnameItems.physicalStock} != ${stockOpnameItems.systemStock}`
                )
            )
            .orderBy(desc(stockOpnameSessions.completedAt));

        return rRows.map((r: any) => ({
            ...r,
            userName: usersMap[r.userId as any] || "Unknown"
        }));
    }
}
