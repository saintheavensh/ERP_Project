import { TransactionContext } from "../../../../../shared/types/db-context";
import { IApprovalRepository } from "../../domain";
import { HTTPException } from "hono/http-exception";

export interface ApproveApprovalInput {
    approvalId: string;
    approvedById: string;
    status: 'APPROVED' | 'REJECTED';
    reason?: string;
}

export class ApproveApprovalUseCase {
    constructor(private readonly repository: IApprovalRepository) { }

    async execute(tenantId: string, input: ApproveApprovalInput, tx: TransactionContext) {
        const approval = await this.repository.findById(tenantId, input.approvalId, tx);
        if (!approval) {
            throw new HTTPException(404, { message: "Approval request not found." });
        }

        if (approval.status !== 'PENDING') {
            throw new HTTPException(400, { message: `Approval is already ${approval.status}` });
        }

        const updated = await this.repository.update(tenantId, input.approvalId, {
            status: input.status,
            approvedById: input.approvedById,
            approvedAt: new Date(),
            reason: input.reason
        }, tx);

        return updated;
    }
}
