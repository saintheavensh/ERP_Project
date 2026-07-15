import { TransactionContext } from "../../../../../shared/types/db-context";
import {
    IServiceRepository,
    IUserGateway,
    INotificationGateway,
    ISettingsGateway
} from "../../domain";
import { HTTPException } from "hono/http-exception";

export class AssignTechnicianUseCase {
    constructor(
        private readonly repository: IServiceRepository,
        private readonly userGateway: IUserGateway,
        private readonly notificationGateway: INotificationGateway
    ) { }

    async execute(tenantId: string, id: string, technicianId: string, userId: string, tx: TransactionContext): Promise<any> {
        const srv = await this.repository.findById(tenantId, id, tx);
        if (!srv) throw new HTTPException(404, { message: "Service not found" });

        const technician = await this.userGateway.getTechnician(tenantId, technicianId, tx);
        if (!technician) throw new HTTPException(404, { message: "Technician not found" });

        await this.repository.update(tenantId, id, { technicianId }, tx);
        await this.repository.logActivity(tenantId, {
            userId,
            action: "ASSIGN",
            entityType: "service",
            entityId: srv.no,
            description: `Assigned to technician ${technician.name}`,
            newValue: { technicianId, technicianName: technician.name }
        }, tx);

        await this.notificationGateway.technicianAssigned(tenantId, technicianId, srv.no, String(srv.id));
        return { message: "Technician assigned", technician };
    }
}

export class UpdateServiceDetailsUseCase {
    constructor(private readonly repository: IServiceRepository) { }

    async execute(tenantId: string, id: string, data: any, userId: string, tx: TransactionContext): Promise<void> {
        const srv = await this.repository.findById(tenantId, id, tx);
        if (!srv) throw new HTTPException(404, { message: "Service not found" });

        await this.repository.update(tenantId, id, {
            diagnosis: data.diagnosis ? JSON.stringify(data.diagnosis) : undefined,
            costEstimate: data.costEstimate,
            complaint: data.complaint
        }, tx);

        await this.repository.logActivity(tenantId, {
            userId,
            action: "UPDATE",
            entityType: "service",
            entityId: srv.no,
            description: `Service details updated`,
            newValue: data
        }, tx);
    }
}

export class PatchServiceUseCase {
    constructor(private readonly repository: IServiceRepository, private readonly settingsGateway: ISettingsGateway) { }

    async execute(tenantId: string, id: string, data: any, tx: TransactionContext): Promise<any> {
        const srv = await this.repository.findById(tenantId, id, tx);
        if (!srv) throw new HTTPException(404, { message: "Service not found" });

        const updateData: any = {};
        if (data.estimatedCompletionDate) updateData.estimatedCompletionDate = new Date(data.estimatedCompletionDate);
        if (data.parts) updateData.parts = data.parts;
        if (data.qc) updateData.qc = data.qc;
        if (data.diagnosis) updateData.diagnosis = typeof data.diagnosis === 'string' ? data.diagnosis : JSON.stringify(data.diagnosis);
        if (data.costEstimate !== undefined) updateData.costEstimate = data.costEstimate;
        if (data.complaint) updateData.complaint = data.complaint;

        if (data.warranty) {
            updateData.warranty = data.warranty;
            const daysToAdd = await this.settingsGateway.getWarrantyDays(tenantId, data.warranty, tx);
            if (daysToAdd > 0) {
                const expiry = new Date();
                expiry.setDate(expiry.getDate() + daysToAdd);
                updateData.warrantyExpiryDate = expiry;
            }
        }

        if (Object.keys(updateData).length > 0) {
            await this.repository.update(tenantId, id, updateData, tx);
        }

        return await this.repository.findById(tenantId, id, tx);
    }
}

export class DeleteServiceUseCase {
    constructor(private readonly repository: IServiceRepository) { }

    async execute(tenantId: string, id: string, tx: TransactionContext): Promise<void> {
        await this.repository.delete(tenantId, id, tx);
    }
}
