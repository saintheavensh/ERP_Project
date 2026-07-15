import { TransactionContext } from "../../../../../shared/types/db-context";
import { ICashRegisterRepository } from "../../domain";
import { AuditService } from "../../services/audit.service";

export class OpenRegisterUseCase {
    constructor(private readonly registerRepository: ICashRegisterRepository) { }

    async execute(tenantId: string, openingBalance: number, userId: string, tx: TransactionContext): Promise<string> {
        const current = await this.registerRepository.getCurrent(tenantId, tx);
        if (current) {
            throw new Error("A cash register is already open. Close it first.");
        }

        const { id } = await this.registerRepository.create(tenantId, {
            openedAt: new Date(),
            openedBy: userId,
            openingBalance,
            status: "open",
        }, tx);

        await AuditService.log(tenantId, {
            userId,
            action: "CREATE" as any,
            entityType: "cash_register",
            entityId: String(id),
            tableName: "cash_registers",
            newValues: { openingBalance },
        }, tx);

        return String(id);
    }
}
