import { TransactionContext } from "../../../../../shared/types/db-context";
import { IReportRepository, ReportFilters, ProfitAndLoss } from "../../domain";
import { gte, lte, sql, and } from "drizzle-orm";
import { sales, operationalCosts, services } from "../../../../../shared/infrastructure/database/schema";

export class GetProfitAndLossUseCase {
    constructor(private readonly repository: IReportRepository) { }

    async execute(tenantId: string, tx: TransactionContext, filters: ReportFilters = {}): Promise<ProfitAndLoss> {
        let salesConditions = [];
        let expenseConditions = [];
        let serviceDateCondition = undefined;

        if (filters.startDate) {
            const start = new Date(filters.startDate);
            salesConditions.push(gte(sales.createdAt, start));
            expenseConditions.push(gte(operationalCosts.date, start));
            serviceDateCondition = gte(sql`COALESCE(${services.dateOut}, ${services.dateIn})`, start);
        }

        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            salesConditions.push(lte(sales.createdAt, end));
            expenseConditions.push(lte(operationalCosts.date, end));

            const endCond = lte(sql`COALESCE(${services.dateOut}, ${services.dateIn})`, end);
            serviceDateCondition = serviceDateCondition ? and(serviceDateCondition, endCond) : endCond;
        }

        // 1. Sales Data
        const salesData = await this.repository.getSalesData(tenantId, salesConditions, tx);
        let salesRevenue = 0;
        let salesCOGS = 0;
        for (const s of salesData) {
            salesRevenue += s.totalAmount;
            for (const item of (s.items || [])) {
                const buyPrice = (item as any).batch?.buyPrice || 0;
                salesCOGS += buyPrice * item.qty;
            }
        }

        // 2. Service Data
        const servicesData = await this.repository.getServicesWithTechnicians(tenantId, [
            sql`${services.status} IN ('diambil', 'selesai')`,
            serviceDateCondition
        ].filter(Boolean) as any[], tx);

        let serviceRevenueRealized = 0;
        let serviceRevenuePending = 0;
        let serviceCOGSRealized = 0;
        let serviceCOGSPending = 0;
        let commissionsRealized = 0;
        let commissionsPending = 0;

        const commissionModel = filters.commissionModel || 'completion';

        for (const svc of servicesData) {
            const isRealized = svc.status === 'diambil';
            const cost = svc.actualCost || 0;

            if (isRealized) {
                serviceRevenueRealized += cost;
            } else {
                serviceRevenuePending += cost;
            }

            const parts = (svc.parts as any[]) || [];
            let partsCost = 0;
            let partsSellingPrice = 0;

            for (const p of parts) {
                const c = (p.buyPrice || 0) * (p.qty || 1);
                partsCost += c;
                partsSellingPrice += (p.price || 0) * (p.qty || 1);
            }

            if (isRealized) {
                serviceCOGSRealized += partsCost;
            } else {
                serviceCOGSPending += partsCost;
            }

            if (svc.technicianId && svc.technician) {
                const config = (svc.technician as any).commissionConfig;
                if (config && config.enabled) {
                    let comm = 0;
                    const jasaValue = Math.max(0, cost - partsSellingPrice);
                    if (config.type === 'percent') {
                        comm = (jasaValue * config.value) / 100;
                    } else if (config.type === 'fixed') {
                        comm = config.value;
                    }

                    if (commissionModel === 'completion') {
                        commissionsRealized += comm;
                    } else {
                        if (isRealized) {
                            commissionsRealized += comm;
                        } else {
                            commissionsPending += comm;
                        }
                    }
                }
            }
        }

        // 3. Operational Expenses
        const expensesData = await this.repository.getOperationalCosts(tenantId, expenseConditions, tx);
        const operationalExpense = expensesData.reduce((sum: number, e: any) => sum + e.amount, 0);

        const totalRevenue = salesRevenue + serviceRevenueRealized;
        const totalCOGS = salesCOGS + serviceCOGSRealized;
        const grossProfit = totalRevenue - totalCOGS;
        const totalExpenses = operationalExpense + commissionsRealized;
        const netProfit = grossProfit - totalExpenses;
        const pendingProfit = serviceRevenuePending - serviceCOGSPending - commissionsPending;

        return {
            revenue: {
                sales: salesRevenue,
                services: serviceRevenueRealized,
                servicesPending: serviceRevenuePending,
                total: salesRevenue + serviceRevenueRealized
            },
            cogs: {
                sales: salesCOGS,
                services: serviceCOGSRealized,
                servicesPending: serviceCOGSPending,
                total: salesCOGS + serviceCOGSRealized
            },
            grossProfit,
            expenses: {
                operational: operationalExpense,
                commissions: commissionsRealized,
                commissionsPending: commissionsPending,
                total: totalExpenses
            },
            netProfit,
            pendingProfit
        };
    }
}
