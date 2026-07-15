import { TransactionContext } from "../../../../../shared/types/db-context";
import { IApprovalRepository, ApprovalType } from "../../domain";
import { ApprovalCheckService } from "../../domain/services/ApprovalCheckService";

export interface RequestApprovalInput {
    type: ApprovalType;
    entityType: string;
    entityId: string;
    requestedById: string;
    amount: number;
    reason?: string;
    data?: any;
}

export class RequestApprovalUseCase {
    constructor(
        private readonly repository: IApprovalRepository,
        private readonly checkService: ApprovalCheckService
    ) { }

    async execute(tenantId: string, input: RequestApprovalInput, tx: TransactionContext) {
        const needsApproval = await this.checkService.needsApproval(tenantId, input.type, input.amount, tx, input.data);

        if (!needsApproval) {
            return { needsApproval: false };
        }

        const approval = await this.repository.save(tenantId, {
            type: input.type,
            entityType: input.entityType,
            entityId: input.entityId,
            requestedById: input.requestedById,
            status: 'PENDING',
            reason: input.reason,
            data: input.data
        }, tx);

        return {
            needsApproval: true,
            approvalId: approval.id,
            message: "Approval required for this transaction."
        };
    }
}
