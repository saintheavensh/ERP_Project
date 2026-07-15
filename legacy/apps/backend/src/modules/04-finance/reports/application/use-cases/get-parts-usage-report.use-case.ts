import { TransactionContext } from "../../../../../shared/types/db-context";
import { IReportRepository, ReportFilters, PartsUsageReport } from "../../domain";
import { gte, lte } from "drizzle-orm";
import { services } from "../../../../../shared/infrastructure/database/schema";

export class GetPartsUsageReportUseCase {
    constructor(private readonly repository: IReportRepository) { }

    async execute(tenantId: string, tx: TransactionContext, filters: ReportFilters = {}): Promise<PartsUsageReport[]> {
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

        const servicesData = await this.repository.getServices(tenantId, conditions, tx);

        const report: PartsUsageReport[] = [];

        for (const svc of servicesData as any[]) {
            const parts = (svc.parts as any[]) || [];
            if (parts.length === 0) continue;

            for (const part of parts) {
                report.push({
                    serviceId: svc.id,
                    serviceNo: svc.no,
                    date: svc.dateOut || svc.dateIn || new Date(),
                    partName: part.name,
                    source: part.source,
                    qty: part.qty,
                    price: part.price,
                    subtotal: (part.subtotal || (part.price * part.qty)),
                    variant: part.variant
                });
            }
        }

        return report;
    }
}
