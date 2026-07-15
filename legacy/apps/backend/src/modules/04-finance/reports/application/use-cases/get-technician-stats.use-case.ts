import { TransactionContext } from "../../../../../shared/types/db-context";
import { IReportRepository, ReportFilters, TechnicianReport } from "../../domain";
import { gte, lte } from "drizzle-orm";
import { services } from "../../../../../shared/infrastructure/database/schema";

export class GetTechnicianStatsUseCase {
    constructor(private readonly repository: IReportRepository) { }

    async execute(tenantId: string, tx: TransactionContext, filters: ReportFilters = {}): Promise<TechnicianReport[]> {
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

        const technicians = await this.repository.getTechnicians(tenantId, tx);
        const servicesData = await this.repository.getServicesWithTechnicians(tenantId, conditions, tx);

        const technicianMap: Map<string, {
            id: string;
            name: string;
            image: string | null;
            totalServices: number;
            completed: number;
            inProgress: number;
            cancelled: number;
            revenue: number;
        }> = new Map();

        // Initialize with all technicians
        for (const tech of technicians) {
            technicianMap.set(tech.id, {
                id: tech.id,
                name: tech.name,
                image: tech.image || null,
                totalServices: 0,
                completed: 0,
                inProgress: 0,
                cancelled: 0,
                revenue: 0
            });
        }

        // Count services per technician
        for (const svc of servicesData) {
            if (!svc.technicianId) continue;

            let techData = technicianMap.get(svc.technicianId);
            if (!techData) {
                const techUser = svc.technician;
                techData = {
                    id: svc.technicianId,
                    name: techUser?.name || 'Unknown',
                    image: techUser?.image || null,
                    totalServices: 0,
                    completed: 0,
                    inProgress: 0,
                    cancelled: 0,
                    revenue: 0
                };
                technicianMap.set(svc.technicianId, techData);
            }

            techData.totalServices++;

            if (svc.status === 'selesai' || svc.status === 'diambil') {
                techData.completed++;
                if (svc.actualCost) {
                    techData.revenue += svc.actualCost;
                }
            } else if (svc.status === 'batal') {
                techData.cancelled++;
            } else {
                techData.inProgress++;
            }
        }

        const result: TechnicianReport[] = [];
        for (const [, data] of technicianMap) {
            result.push({
                ...data,
                completionRate: data.totalServices > 0
                    ? Math.round((data.completed / data.totalServices) * 100)
                    : 0
            });
        }

        result.sort((a, b) => b.totalServices - a.totalServices);

        return result;
    }
}
