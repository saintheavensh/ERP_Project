import { DrizzleApprovalRepository } from "./infrastructure/repositories/DrizzleApprovalRepository";
import { ApprovalCheckService } from "./domain/services/ApprovalCheckService";
import { TransactionContext } from "../../../shared/types/db-context";
import { RequestApprovalUseCase } from "./application/use-cases/request-approval.use-case";
import { ApproveApprovalUseCase } from "./application/use-cases/approve-approval.use-case";
import { SettingsRepositoryAdapter } from "../../05-shared/settings/infrastructure/repositories/settings.repository.adapter";
import { Approval } from "./domain";

// Adapters
const repository = new DrizzleApprovalRepository();
const settingsRepo = new SettingsRepositoryAdapter();

// Services
const checkService = new ApprovalCheckService(settingsRepo);

// Use Cases
const requestApprovalUC = new RequestApprovalUseCase(repository, checkService);
const approveApprovalUC = new ApproveApprovalUseCase(repository);

export class ApprovalsService {
    async getPending(tenantId: string, tx: TransactionContext): Promise<Approval[]> {
        return await repository.findPending(tenantId, tx);
    }

    async getById(tenantId: string, id: string, tx: TransactionContext): Promise<Approval | null> {
        return await repository.findById(tenantId, id, tx);
    }

    async getHistory(tenantId: string, tx: TransactionContext, filters?: { type?: string; status?: string }): Promise<Approval[]> {
        return await repository.findHistory(tenantId, tx, filters);
    }

    async getStats(tenantId: string, tx: TransactionContext): Promise<{ pending: number; approved: number; rejected: number; totalAmount: number }> {
        return await repository.getStats(tenantId, tx);
    }

    async requestApproval(tenantId: string, data: any, tx: TransactionContext): Promise<any> {
        return await requestApprovalUC.execute(tenantId, data, tx);
    }

    async approve(tenantId: string, data: any, tx: TransactionContext): Promise<any> {
        return await approveApprovalUC.execute(tenantId, data, tx);
    }

    async reject(tenantId: string, id: string, reason: string, tx: TransactionContext): Promise<any> {
        return await repository.update(tenantId, id, {
            status: 'REJECTED' as any,
            reason,
            approvedAt: new Date() as any,
        }, tx);
    }
}

export const approvalsService = new ApprovalsService();
