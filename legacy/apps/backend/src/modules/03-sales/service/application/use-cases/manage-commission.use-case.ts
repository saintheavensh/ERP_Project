import { TransactionContext } from "../../../../../shared/types/db-context";
import { ICommissionSettingsRepository, ICommissionRepository } from "../../domain/repositories/commission-repository.port";

export class ManageCommissionUseCase {
    constructor(
        private readonly settingsRepo: ICommissionSettingsRepository,
        private readonly commissionRepo: ICommissionRepository
    ) { }

    async getSettings(tenantId: string, technicianId: string, tx: TransactionContext) {
        return await this.settingsRepo.findByTechnicianId(tenantId, technicianId, tx);
    }

    async upsertSettings(tenantId: string, technicianId: string, data: any, tx: TransactionContext) {
        await this.settingsRepo.upsert(tenantId, { ...data, technicianId }, tx);
        return await this.getSettings(tenantId, technicianId, tx);
    }

    async getSummary(tenantId: string, technicianId: string, tx: TransactionContext, startDate?: Date, endDate?: Date) {
        const commissions = await this.commissionRepo.findByTechnicianId(tenantId, technicianId, tx, startDate, endDate);

        const totalAmount = commissions.reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
        const paidAmount = commissions.filter(c => c.paid).reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
        const unpaidAmount = totalAmount - paidAmount;

        return {
            technicianId,
            totalCommissions: commissions.length,
            totalAmount,
            paidAmount,
            unpaidAmount,
            commissions
        };
    }

    async markAsPaid(tenantId: string, ids: string[], tx: TransactionContext) {
        await this.commissionRepo.markAsPaid(tenantId, ids, tx);
        return { message: "Commissions marked as paid", count: ids.length };
    }
}
