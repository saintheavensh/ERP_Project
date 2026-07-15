import { TransactionContext } from "../../../../../shared/types/db-context";
import { IReportRepository, ReportFilters, ServiceReport } from "../../domain";
import { gte, lte } from "drizzle-orm";
import { services } from "../../../../../shared/infrastructure/database/schema";

export class GetServiceTransactionsUseCase {
    constructor(private readonly repository: IReportRepository) { }

    async execute(tenantId: string, tx: TransactionContext, filters: ReportFilters = {}): Promise<ServiceReport[]> {
        let conditions = [];

        if (filters.startDate) {
            const start = new Date(filters.startDate);
            conditions.push(gte(services.dateIn, start));
        }
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            conditions.push(lte(services.dateIn, end));
        }

        const servicesData = await this.repository.getServiceTransactions(tenantId, conditions, tx);

        return servicesData.map((svc: any) => {
            const customer = svc.customer as { name?: string } | null;
            const device = svc.device as { brand?: string; model?: string } | null;

            return {
                id: svc.id,
                no: svc.no,
                date: svc.dateIn!,
                customerName: customer?.name || '-',
                deviceInfo: device ? `${device.brand || ''} ${device.model || ''}`.trim() : '-',
                status: svc.status || 'antrian',
                estimatedCost: svc.costEstimate || 0,
                actualCost: svc.actualCost || 0
            };
        });
    }
}
