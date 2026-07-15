import { TransactionContext } from "../../../../../shared/types/db-context";
import { IServiceRepository, ServiceTicket } from "../../domain";
import { HTTPException } from "hono/http-exception";

export class GetServicesUseCase {
    constructor(private readonly repository: IServiceRepository) { }

    async execute(tenantId: string, params: { status?: string; technicianId?: string }, tx: TransactionContext): Promise<ServiceTicket[]> {
        return await this.repository.findAll(tenantId, params, tx);
    }
}

export class GetServiceCountsUseCase {
    constructor(private readonly repository: IServiceRepository) { }

    async execute(tenantId: string, tx: TransactionContext) {
        return await this.repository.getCountsByStatus(tenantId, tx);
    }
}

export class GetServiceByIdUseCase {
    constructor(private readonly repository: IServiceRepository) { }

    async execute(tenantId: string, id: string, tx: TransactionContext): Promise<ServiceTicket> {
        const srv = await this.repository.findById(tenantId, id, tx);
        if (!srv) {
            throw new HTTPException(404, { message: "Service not found" });
        }

        const timeline = await this.repository.getTimeline(tenantId, srv.no, tx);

        return {
            ...srv,
            timeline,
            photos: (srv.device as any)?.photos || [],
            serviceFee: srv.actualCost ?? srv.costEstimate ?? 0
        };
    }
}

export class GetTechnicianDashboardStatsUseCase {
    constructor(private readonly repository: IServiceRepository) { }

    async execute(tenantId: string, userId: string, startDate: Date, endDate: Date, tx: TransactionContext) {
        const servicesData = await this.repository.getTechnicianStats(tenantId, userId, startDate, endDate, tx);

        const total = servicesData.length;
        const success = servicesData.filter((s: any) => s.status === 'selesai' || s.status === 'diambil').length;
        const failed = servicesData.filter((s: any) => s.status === 'batal').length;
        const profit = servicesData
            .filter((s: any) => s.status === 'selesai' || s.status === 'diambil')
            .reduce((sum: number, s: any) => sum + (Number(s.actualCost) || 0), 0);

        return {
            profit,
            total,
            success,
            failed,
            period: 'This Month'
        };
    }
}
