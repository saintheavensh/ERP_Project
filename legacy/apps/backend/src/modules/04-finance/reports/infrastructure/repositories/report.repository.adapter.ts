import { sales, services, purchases, users, activityLogs, operationalCosts, productBatches, salePayments } from "../../../../../shared/infrastructure/database/schema";
import { and, desc, eq, lte } from "drizzle-orm";
import { TransactionContext } from "../../../../../shared/types/db-context";
import { IReportRepository } from "../../domain";

export class ReportRepositoryAdapter implements IReportRepository {
    async getSalesData(tenantId: string, conditions: any[], tx: TransactionContext): Promise<any[]> {
        return await tx.query.sales.findMany({
            where: and(eq(sales.tenantId, tenantId), ...(conditions.length > 0 ? conditions : [])),
            with: {
                items: {
                    with: {
                        batch: true
                    }
                }
            }
        });
    }

    async getTransactions(tenantId: string, conditions: any[], tx: TransactionContext): Promise<any[]> {
        return await tx.query.sales.findMany({
            where: and(eq(sales.tenantId, tenantId), ...(conditions.length > 0 ? conditions : [])),
            orderBy: [desc(sales.createdAt)],
            with: {
                items: {
                    with: {
                        batch: true
                    }
                }
            }
        });
    }

    async getServices(tenantId: string, conditions: any[], tx: TransactionContext): Promise<any[]> {
        return await tx.query.services.findMany({
            where: and(eq(services.tenantId, tenantId), ...(conditions.length > 0 ? conditions : []))
        });
    }

    async getServiceTransactions(tenantId: string, conditions: any[], tx: TransactionContext): Promise<any[]> {
        return await tx.query.services.findMany({
            where: and(eq(services.tenantId, tenantId), ...(conditions.length > 0 ? conditions : [])),
            orderBy: [desc(services.dateIn)]
        });
    }

    async getPurchases(tenantId: string, conditions: any[], tx: TransactionContext): Promise<any[]> {
        return await tx.query.purchases.findMany({
            where: and(eq(purchases.tenantId, tenantId), ...(conditions.length > 0 ? conditions : [])),
            with: {
                items: true,
                supplier: true
            },
            orderBy: [desc(purchases.date)]
        });
    }

    async getTechnicians(tenantId: string, tx: TransactionContext): Promise<any[]> {
        return await tx.query.users.findMany({
            where: and(eq(users.tenantId, tenantId), eq(users.role, "teknisi"))
        });
    }

    async getServicesWithTechnicians(tenantId: string, conditions: any[], tx: TransactionContext): Promise<any[]> {
        return await tx.query.services.findMany({
            where: and(eq(services.tenantId, tenantId), ...(conditions.length > 0 ? conditions : [])),
            with: {
                technician: true
            }
        });
    }

    async getActivityLogs(tenantId: string, conditions: any[], tx: TransactionContext, limit: number = 100): Promise<any[]> {
        return await tx.query.activityLogs.findMany({
            where: and(eq(activityLogs.tenantId, tenantId), ...(conditions.length > 0 ? conditions : [])),
            with: {
                user: true
            },
            orderBy: [desc(activityLogs.createdAt)],
            limit
        });
    }

    async getOperationalCosts(tenantId: string, conditions: any[], tx: TransactionContext): Promise<any[]> {
        return await tx.query.operationalCosts.findMany({
            where: and(eq(operationalCosts.tenantId, tenantId), ...(conditions.length > 0 ? conditions : []))
        });
    }

    async getCategoriesWithStock(_tenantId: string, tx: TransactionContext): Promise<any[]> {
        return await tx.query.categories.findMany({
            // TODO: Add tenantId filter when categories table has tenant_id column
            with: {
                products: {
                    with: {
                        batches: true
                    }
                }
            }
        });
    }

    async getLowStockItems(tenantId: string, threshold: number, tx: TransactionContext): Promise<any[]> {
        return await tx.query.productBatches.findMany({
            where: and(eq(productBatches.tenantId, tenantId), lte(productBatches.currentStock, threshold)),
            with: {
                variantLink: {
                    with: {
                        product: true
                    }
                }
            },
            orderBy: [desc(productBatches.currentStock)]
        });
    }

    async getSalesPayments(tenantId: string, conditions: any[], tx: TransactionContext): Promise<any[]> {
        const results = await tx.select()
            .from(salePayments)
            .innerJoin(sales, eq(sales.id, salePayments.saleId))
            .where(and(eq(sales.tenantId, tenantId), ...(conditions.length > 0 ? conditions : [])));

        return results.map((r: any) => r.sale_payments);
    }
}
