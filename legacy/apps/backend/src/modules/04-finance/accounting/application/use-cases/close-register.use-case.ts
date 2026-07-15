import { TransactionContext } from "../../../../../shared/types/db-context";
import { ICashRegisterRepository } from "../../domain";
import { AuditService } from "../../services/audit.service";

export interface CloseRegisterInput {
    actualClosing: number;
    notes?: string | null | undefined;
    reservation?: { amount: number, targetAccountId: string, sourceAccountId?: string | null | undefined } | null | undefined;
}

export class CloseRegisterUseCase {
    constructor(
        private readonly registerRepository: ICashRegisterRepository
    ) { }

    async execute(tenantId: string, input: CloseRegisterInput, userId: string, tx: TransactionContext): Promise<{ difference: number }> {
        const current = await this.registerRepository.getCurrent(tenantId, tx);
        if (!current) {
            throw new Error("No open cash register found");
        }

        // Calculate expected closing
        const transactions = await this.registerRepository.getTransactions(tenantId, current.id, tx);
        const netTransactions = transactions.reduce((sum, t) => {
            if (t.type === 'sale' || t.type === 'deposit') return sum + t.amount;
            return sum - t.amount;
        }, 0);

        const expectedClosing = current.openingBalance + netTransactions;
        const difference = input.actualClosing - expectedClosing;

        await this.registerRepository.update(tenantId, current.id, {
            closedAt: new Date(),
            closedBy: userId,
            expectedClosing,
            actualClosing: input.actualClosing,
            difference,
            status: "closed",
            notes: input.notes,
        }, tx);

        // If there is a difference, we might need a journal entry for adjustment.
        // In simpler version, we just log it. In complex, we post to "Short/Over" account.
        if (Math.abs(difference) > 0) {
            // Logic to handle discrepancy journal entry could go here
        }

        await AuditService.log(tenantId, {
            userId,
            action: "CLOSE",
            entityType: "cash_register",
            entityId: current.id,
            tableName: "cash_registers",
            newValues: { expectedClosing, actualClosing: input.actualClosing, difference, notes: input.notes, status: "closed" },
        }, tx);

        return { difference };
    }
}
