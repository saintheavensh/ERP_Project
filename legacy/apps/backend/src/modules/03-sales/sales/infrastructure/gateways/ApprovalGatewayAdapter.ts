import { IApprovalGateway } from "../../domain/gateways";
import { ApprovalCheckService } from "../../../../04-finance/approvals/domain/services/ApprovalCheckService";
import { IApprovalRepository } from "../../../../04-finance/approvals/domain";
import { TransactionContext } from "../../../../../shared/types/db-context";

export class ApprovalGatewayAdapter implements IApprovalGateway {
    constructor(
        private readonly checkService: ApprovalCheckService,
        private readonly repository: IApprovalRepository
    ) { }

    async needsApproval(type: 'DISCOUNT' | 'VOID' | 'REFUND', amount: number, data?: any): Promise<boolean> {
        return this.checkService.needsApproval(type, amount, data);
    }

    async isApproved(tenantId: string, approvalId: string, entityType: string, tx: TransactionContext, entityId?: string | undefined): Promise<boolean> {
        const approval = await this.repository.findById(tenantId, approvalId, tx);
        if (!approval) return false;

        if (approval.status !== 'APPROVED') return false;
        if (approval.entityType !== entityType) return false;
        if (entityId && approval.entityId !== entityId) return false;

        return true;
    }
}
