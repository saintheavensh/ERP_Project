import { and, eq } from "drizzle-orm";
import { DBContext } from "../../../../../shared/types/db-context";
import {
    settings, salePayments, saleItems, sales,
    purchaseReturnItems, purchaseReturns, purchaseItems,
    purchases, services, activityLogs, notifications,
    productBatches, productVariants, products,
    categories, suppliers, members
} from "../../../../../shared/infrastructure/database/schema";
import { ISettingsRepository, Setting } from "../../domain";

export class SettingsRepositoryAdapter implements ISettingsRepository {
    async findByKey(tenantId: string, key: string, tx: DBContext): Promise<Setting | null> {
        const result = await tx.query.settings.findFirst({
            where: and(
                eq(settings.tenantId, tenantId),
                eq(settings.key, key)
            )
        });
        return (result as Setting) || null;
    }

    async upsert(tenantId: string, key: string, value: any, tx: DBContext): Promise<void> {
        const existing = await this.findByKey(tenantId, key, tx);

        if (existing) {
            await tx.update(settings)
                .set({ value: value as any })
                .where(and(
                    eq(settings.tenantId, tenantId),
                    eq(settings.key, key)
                ));
        } else {
            await tx.insert(settings).values({
                tenantId,
                key,
                value: value as any
            });
        }
    }

    async factoryReset(tenantId: string, mode: "data" | "full", tx: DBContext): Promise<void> {
        if (mode === "data" || mode === "full") {
            // Delete in reverse order of dependencies safely BOUNDED TO TENANT
            await tx.delete(salePayments).where(eq(salePayments.tenantId, tenantId));
            await tx.delete(saleItems).where(eq(saleItems.tenantId, tenantId));
            await tx.delete(sales).where(eq(sales.tenantId, tenantId));

            await tx.delete(purchaseReturnItems).where(eq(purchaseReturnItems.tenantId, tenantId));
            await tx.delete(purchaseReturns).where(eq(purchaseReturns.tenantId, tenantId));

            await tx.delete(purchaseItems).where(eq(purchaseItems.tenantId, tenantId));
            await tx.delete(purchases).where(eq(purchases.tenantId, tenantId));

            await tx.delete(services).where(eq(services.tenantId, tenantId));

            await tx.delete(activityLogs).where(eq(activityLogs.tenantId, tenantId));
            await tx.delete(notifications).where(eq(notifications.tenantId, tenantId));

            if (mode === "full") {
                await tx.delete(productBatches).where(eq(productBatches.tenantId, tenantId));
                await tx.delete(productVariants).where(eq(productVariants.tenantId, tenantId));
                await tx.delete(products).where(eq(products.tenantId, tenantId));
                await tx.delete(categories).where(eq(categories.tenantId, tenantId));
                await tx.delete(suppliers).where(eq(suppliers.tenantId, tenantId));
                await tx.delete(members).where(eq(members.tenantId, tenantId));
            }
        }
    }
}
