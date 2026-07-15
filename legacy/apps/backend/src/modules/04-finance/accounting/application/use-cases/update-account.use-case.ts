import { TransactionContext } from "../../../../../shared/types/db-context";
import { IAccountRepository } from "../../domain";
import { AuditService } from "../../services/audit.service";

export interface UpdateAccountInput {
    name?: string;
    description?: string | null;
    isActive?: boolean;
}

export class UpdateAccountUseCase {
    constructor(private readonly accountRepository: IAccountRepository) { }

    async execute(tenantId: string, id: string, input: UpdateAccountInput, tx: TransactionContext, userId?: string): Promise<void> {
        const oldAccount = await this.accountRepository.findById(tenantId, id, tx);
        if (!oldAccount) {
            throw new Error(`Account ${id} not found`);
        }

        if (oldAccount.isSystem) {
            if (input.name && input.name !== oldAccount.name) {
                throw new Error("Cannot rename system account");
            }
            if (input.isActive !== undefined && input.isActive !== oldAccount.isActive) {
                throw new Error("Cannot change active status of system account");
            }
        }

        await this.accountRepository.update(tenantId, id, {
            ...input,
            updatedAt: new Date(),
        }, tx);

        await AuditService.log(tenantId, {
            userId,
            action: "UPDATE",
            entityType: "account",
            entityId: id,
            tableName: "accounts",
            oldValues: { name: oldAccount.name, description: oldAccount.description, isActive: oldAccount.isActive },
            newValues: input as Record<string, unknown>,
        }, tx);
    }
}
