import { TransactionContext } from "../../../../../shared/types/db-context";
import {
    IServiceRepository,
    IAccountingGateway,
    INotificationGateway
} from "../../domain";
import { HTTPException } from "hono/http-exception";

export class CreateServiceUseCase {
    constructor(
        private readonly repository: IServiceRepository,
        private readonly accountingGateway: IAccountingGateway,
        private readonly notificationGateway: INotificationGateway
    ) { }

    async execute(tenantId: string, data: any, userId: string, tx: TransactionContext): Promise<{ message: string; no: string; id: string }> {
        // 1. Check Register
        const isOpen = await this.accountingGateway.isRegisterOpen(tenantId, tx);
        if (!isOpen) {
            throw new HTTPException(400, { message: "Register Closed. Cannot create new service ticket within an active session." });
        }

        // 2. Generate Service Number
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const prefix = `SRV-${today}`;

        const lastService = await this.repository.findLastServiceNo(tenantId, prefix, tx);

        let counter = 1;
        if (lastService) {
            const parts = lastService.no.split("-");
            const lastCount = parseInt(parts[2]!);
            if (!isNaN(lastCount)) counter = lastCount + 1;
        }
        const no = `${prefix}-${String(counter).padStart(3, "0")}`;

        // 3. Create Ticket
        const res = await this.repository.create(tenantId, {
            no,
            customer: data.customer,
            device: { ...data.unit, photos: data.photos, initialQC: data.initialQC },
            complaint: data.complaint,
            diagnosis: JSON.stringify(data.diagnosis || {}),
            technicianId: data.technicianId || null,
            status: (data.isDirectComplete ? "selesai" : (data.status || "antrian")),
            createdBy: userId,
            dateIn: new Date(),
            dateOut: data.isDirectComplete ? new Date() : null,
            estimatedCompletionDate: data.estimatedCompletionDate ? new Date(data.estimatedCompletionDate) : null,
            actualCost: data.actualCost || null,
            qc: data.qc || null,
            priority: data.priority || "standard",
            isDirectComplete: data.isDirectComplete || false,
            warranty: data.warranty || null,
        }, tx);

        await this.repository.logActivity(tenantId, {
            userId,
            action: "CREATE",
            entityType: "service",
            entityId: no,
            description: `New Service ${no} created for ${data.customer.name}`,
            newValue: data
        }, tx);

        // 4. Post-creation Notifications
        if (data.technicianId) {
            await this.notificationGateway.technicianAssigned(tenantId, data.technicianId, no, res.id);
        }

        await this.notificationGateway.sendWhatsApp(tenantId, "new", {
            no,
            customer: data.customer,
            device: data.unit,
            status: data.status || "antrian"
        }, {});

        return { message: "Service created", no, id: res.id };
    }
}
