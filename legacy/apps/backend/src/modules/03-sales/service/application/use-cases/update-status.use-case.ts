import { TransactionContext } from "../../../../../shared/types/db-context";
import {
    IServiceRepository,
    IAccountingGateway,
    IInventoryGateway,
    INotificationGateway
} from "../../domain";
import { HTTPException } from "hono/http-exception";

export class UpdateServiceStatusUseCase {
    constructor(
        private readonly repository: IServiceRepository,
        private readonly accountingGateway: IAccountingGateway,
        private readonly inventoryGateway: IInventoryGateway,
        private readonly notificationGateway: INotificationGateway
    ) { }

    async execute(tenantId: string, id: string, data: { status: string; notes?: string; actualCost?: number; userId: string }, tx: TransactionContext): Promise<void> {
        const srv = await this.repository.findById(tenantId, id, tx);
        if (!srv) throw new HTTPException(404, { message: "Service not found" });

        // Check Register for pickup
        if (data.status === "diambil") {
            const isOpen = await this.accountingGateway.isRegisterOpen(tenantId, tx);
            if (!isOpen) throw new HTTPException(400, { message: "Register Closed. Cannot process pickup/payment." });
        }

        const updateValues: any = {
            status: data.status,
            notes: data.notes,
            actualCost: data.actualCost,
            dateOut: (data.status === "selesai" || data.status === "diambil") ? new Date() : undefined
        };

        if (data.status === 're-konfirmasi') {
            updateValues.reconfirmationCount = (srv.reconfirmationCount || 0) + 1;
        }

        await this.repository.update(tenantId, id, updateValues, tx);

        await this.repository.logActivity(tenantId, {
            userId: data.userId,
            action: "STATUS_CHANGE",
            entityType: "service",
            entityId: srv.no,
            description: `Service ${srv.no} status updated to ${data.status}`,
            oldValue: { status: srv.status },
            newValue: { status: data.status }
        }, tx);

        // Deduct Stock on 'selesai'
        if (data.status === "selesai" && srv.status !== "selesai") {
            const parts = (srv.parts as any[]) || [];
            for (const part of parts) {
                if (part.source === "inventory" && part.batchId) {
                    const batch = await this.inventoryGateway.getBatch(tenantId, part.batchId, tx);
                    if (batch) {
                        await this.inventoryGateway.updateStock(tenantId, part.batchId, -part.qty, tx);
                    }
                }
            }
        }

        // Ledger on 'diambil'
        if (data.status === "diambil" && srv.status !== "diambil") {
            const amount = data.actualCost || srv.actualCost || srv.costEstimate || 0;
            if (amount > 0) {
                let partsCost = 0;
                const parts = (srv.parts as any[]) || [];
                for (const part of parts) {
                    if (part.source === "inventory" && part.buyPrice) {
                        partsCost += (part.buyPrice || 0) * (part.qty || 1);
                    }
                }

                const journalLines: any[] = [
                    { accountId: "1-1000", debit: amount, credit: 0, description: `Pembayaran service ${srv.no}` },
                    { accountId: "4-2000", debit: 0, credit: amount, description: `Pendapatan service ${srv.no}` }
                ];

                if (partsCost > 0) {
                    journalLines.push({ accountId: "5-1002", debit: partsCost, credit: 0, description: `HPP sparepart ${srv.no}` });
                    journalLines.push({ accountId: "1-3000", debit: 0, credit: partsCost, description: `Pengurangan persediaan ${srv.no}` });
                }

                await this.accountingGateway.createJournal(tenantId, {
                    description: `Service ${srv.no} - Diambil`,
                    referenceType: "service",
                    referenceId: srv.no,
                    lines: journalLines,
                }, data.userId, tx);

                await this.accountingGateway.recordCashTransaction(tenantId, {
                    transactionType: "service",
                    transactionId: srv.no,
                    amount,
                    description: `Service ${srv.no}`
                }, tx);
            }
        }

        // Notifications
        if (srv.createdBy) {
            await this.notificationGateway.serviceStatusChanged(tenantId, srv.createdBy, srv.no, data.status, String(srv.id));
        }

        if (data.status === "selesai") {
            await this.notificationGateway.sendWhatsApp(tenantId, "complete", { ...srv, status: data.status, actualCost: data.actualCost }, { total: data.actualCost });
        } else {
            await this.notificationGateway.sendWhatsApp(tenantId, "status", { ...srv, status: data.status }, { status: data.status });
        }
    }
}
