import { TransactionContext } from "../../../../../shared/types/db-context";
import { IAccountRepository, AccountType } from "../../domain";
import { AuditService } from "../../services/audit.service";

export interface CreateAccountInput {
    code: string;
    name: string;
    typeId: AccountType;
    parentId?: string | null | undefined;
    description?: string | null | undefined;
    isSystem?: boolean | undefined;
}

export class CreateAccountUseCase {
    constructor(private readonly accountRepository: IAccountRepository) { }

    async execute(tenantId: string, input: CreateAccountInput, tx: TransactionContext, userId?: string): Promise<string> {
        const type = await this.accountRepository.findTypeById(tenantId, input.typeId, tx);
        if (!type) {
            throw new Error(`Account type ${input.typeId} not found`);
        }

        const typePrefix = this.getTypePrefix(input.typeId);
        const id = `${typePrefix}-${input.code}`;

        await this.accountRepository.create(tenantId, {
            id,
            code: input.code,
            name: input.name,
            typeId: input.typeId,
            parentId: input.parentId,
            description: input.description,
            isSystem: input.isSystem || false,
            balance: 0,
        }, tx);

        await AuditService.log(tenantId, {
            userId,
            action: "CREATE",
            entityType: "account",
            entityId: id,
            tableName: "accounts",
            newValues: { code: input.code, name: input.name, typeId: input.typeId },
        }, tx);

        return id;
    }

    private getTypePrefix(typeId: string): string {
        const prefixes: Record<string, string> = {
            ASSET: "1",
            LIABILITY: "2",
            EQUITY: "3",
            REVENUE: "4",
            EXPENSE: "5",
        };
        return prefixes[typeId] || "9";
    }
}
