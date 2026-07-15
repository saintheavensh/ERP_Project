import { activityLogs, saleItems, products, services, users, purchases } from "../../../../../shared/infrastructure/database/schema";
import { desc, eq, sql, and, gte, inArray } from "drizzle-orm";
import { DBContext } from "../../../../../shared/types/db-context";
import { IDashboardRepository } from "../../domain/repositories/dashboard.repository.port";

export class DashboardRepositoryAdapter implements IDashboardRepository {
    async getActiveServicesCount(tenantId: string, tx: DBContext): Promise<number> {
        const result = await tx.select({ count: sql<number>`count(*)` })
            .from(services)
            .where(and(
                eq(services.tenantId, tenantId),
                sql`${services.status} NOT IN ('selesai', 'diambil', 'batal')`
            ));
        return Number(result[0].count);
    }

    async getReadyPickupCount(tenantId: string, tx: DBContext): Promise<number> {
        const result = await tx.select({ count: sql<number>`count(*)` })
            .from(services)
            .where(and(
                eq(services.tenantId, tenantId),
                eq(services.status, 'selesai')
            ));
        return Number(result[0].count);
    }

    async getLowStockCount(tenantId: string, tx: DBContext): Promise<number> {
        const result = await tx.select({ count: sql<number>`count(*)` })
            .from(products)
            .where(and(
                eq(products.tenantId, tenantId),
                sql`${products.stock} <= ${products.minimumStock}`
            ));
        return Number(result[0].count);
    }

    async getPendingVerificationsCount(tenantId: string, tx: DBContext): Promise<number> {
        const result = await tx.select({ count: sql<number>`count(*)` })
            .from(purchases)
            .where(and(
                eq(purchases.tenantId, tenantId),
                eq(purchases.status, "RECEIVED")
            ));
        return Number(result[0].count);
    }

    async getTopProducts(tenantId: string, limit = 10, tx: DBContext): Promise<any[]> {
        return await tx.select({
            id: products.id,
            name: products.name,
            sold: sql<number>`sum(${saleItems.qty})`
        })
            .from(saleItems)
            .leftJoin(products, eq(saleItems.productId, products.id))
            .where(eq(saleItems.tenantId, tenantId)) // Note: Both tables need tenantId, filtering saleItems is sufficient
            .groupBy(products.id)
            .orderBy(desc(sql`sum(${saleItems.qty})`))
            .limit(limit);
    }

    async getRecentActivities(tenantId: string, limit: number, tx: DBContext): Promise<any[]> {
        return await tx.select({
            id: activityLogs.id,
            user: users.name,
            action: activityLogs.action,
            description: activityLogs.description,
            time: activityLogs.createdAt,
            entityType: activityLogs.entityType
        })
            .from(activityLogs)
            .leftJoin(users, eq(activityLogs.userId, users.id))
            .where(eq(activityLogs.tenantId, tenantId))
            .orderBy(desc(activityLogs.createdAt))
            .limit(limit);
    }

    async getRecentServices(tenantId: string, limit: number, tx: DBContext): Promise<any[]> {
        return await tx.query.services.findMany({
            where: eq(services.tenantId, tenantId),
            orderBy: [desc(services.dateIn)],
            limit: limit
        });
    }

    async getUrgentServices(tenantId: string, limit: number, tx: DBContext): Promise<any[]> {
        return await tx.query.services.findMany({
            where: and(
                eq(services.tenantId, tenantId),
                sql`${services.status} NOT IN ('selesai', 'diambil', 'batal')`,
                sql`${services.estimatedCompletionDate} IS NOT NULL`
            ),
            orderBy: [sql`${services.estimatedCompletionDate} ASC`],
            limit: limit
        });
    }

    async getTechnicianJobs(tenantId: string, technicianId: string, tx: DBContext): Promise<any[]> {
        return await tx.query.services.findMany({
            where: and(
                eq(services.tenantId, tenantId),
                eq(services.technicianId, technicianId),
                sql`${services.status} NOT IN ('selesai', 'diambil', 'batal')`
            ),
            orderBy: [desc(services.dateIn)]
        });
    }

    async getTechnicianQueue(tenantId: string, limit: number = 10, tx: DBContext): Promise<any[]> {
        return await tx.query.services.findMany({
            where: and(
                eq(services.tenantId, tenantId),
                eq(services.status, 'antrian'),
                sql`${services.technicianId} IS NULL`
            ),
            orderBy: [desc(services.dateIn)],
            limit: limit
        });
    }

    async getTechnicianStats(tenantId: string, technicianId: string, startOfDay: Date, tx: DBContext): Promise<{ completedToday: number; inProgress: number }> {
        const completedToday = await tx.select({ count: sql<number>`count(*)` })
            .from(services)
            .where(and(
                eq(services.tenantId, tenantId),
                eq(services.technicianId, technicianId),
                eq(services.status, 'selesai'),
                gte(services.dateOut, startOfDay)
            ));

        const inProgress = await tx.select({ count: sql<number>`count(*)` })
            .from(services)
            .where(and(
                eq(services.tenantId, tenantId),
                eq(services.technicianId, technicianId),
                sql`${services.status} IN ('dicek', 'dikerjakan', 're-konfirmasi')`
            ));

        return {
            completedToday: Number(completedToday[0]?.count || 0),
            inProgress: Number(inProgress[0]?.count || 0)
        };
    }

    async getCashierStats(tenantId: string, startOfDay: Date, tx: DBContext): Promise<any> {
        const readyPickup = await tx.query.services.findMany({
            where: and(
                eq(services.tenantId, tenantId),
                eq(services.status, 'selesai')
            ),
            orderBy: [desc(services.dateIn)],
            limit: 20
        });

        const pickedUpToday = await tx.select({ count: sql<number>`count(*)` })
            .from(services)
            .where(and(
                eq(services.tenantId, tenantId),
                eq(services.status, 'diambil'),
                gte(services.dateOut, startOfDay)
            ));

        const revenueToday = await tx.select({
            total: sql<number>`COALESCE(SUM(${services.actualCost}), 0)`
        })
            .from(services)
            .where(and(
                eq(services.tenantId, tenantId),
                eq(services.status, 'diambil'),
                gte(services.dateOut, startOfDay)
            ));

        const pendingConfirm = await tx.select({ count: sql<number>`count(*)` })
            .from(services)
            .where(and(
                eq(services.tenantId, tenantId),
                sql`${services.status} IN ('konfirmasi', 're-konfirmasi')`
            ));

        return {
            readyPickup,
            pickedUpToday: Number(pickedUpToday[0]?.count || 0),
            revenueToday: Number(revenueToday[0]?.total || 0),
            pendingConfirm: Number(pendingConfirm[0]?.count || 0)
        };
    }

    async getWarehouseStats(tenantId: string, tx: DBContext): Promise<any> {
        const totalProducts = await tx.select({ count: sql<number>`count(*)` }).from(products)
            .where(eq(products.tenantId, tenantId));
        const lowStock = await this.getLowStockCount(tenantId, tx);

        const pendingPurchases = await tx.select({ count: sql<number>`count(*)` })
            .from(purchases)
            .where(and(
                eq(purchases.tenantId, tenantId),
                eq(purchases.status, "ORDERED")
            ));

        return {
            totalProducts: Number(totalProducts[0]?.count || 0),
            lowStock: Number(lowStock || 0),
            pendingPurchases: Number(pendingPurchases[0]?.count || 0)
        };
    }

    async getIncomingOrders(tenantId: string, limit = 5, tx: DBContext): Promise<any[]> {
        return await tx.query.purchases.findMany({
            where: and(
                eq(purchases.tenantId, tenantId),
                eq(purchases.status, "ORDERED")
            ),
            with: {
                supplier: true,
                user: true
            },
            orderBy: [desc(purchases.date)],
            limit
        });
    }

    async getLowStockProducts(tenantId: string, limit = 10, tx: DBContext): Promise<any[]> {
        return await tx.select()
            .from(products)
            .where(and(
                eq(products.tenantId, tenantId),
                sql`${products.stock} <= ${products.minimumStock}`
            ))
            .orderBy(products.stock)
            .limit(limit);
    }

    async getProcurementTasks(tenantId: string, limit = 5, tx: DBContext): Promise<any[]> {
        return await tx.query.purchases.findMany({
            where: and(
                eq(purchases.tenantId, tenantId),
                inArray(purchases.status, ["ORDERED", "RECEIVED"])
            ),
            with: {
                supplier: true,
                user: true
            },
            orderBy: [desc(purchases.date)],
            limit
        });
    }
}
