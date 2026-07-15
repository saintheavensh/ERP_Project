import { TransactionContext } from "../../../../../shared/types/db-context";
import { IOperationalCostRepository, IAccountingGateway } from "../../domain";
import { HTTPException } from "hono/http-exception";

export class MarkAsPaidUseCase {
    constructor(
        private readonly repository: IOperationalCostRepository,
        private readonly accountingGateway: IAccountingGateway
    ) { }

    async execute(
        tenantId: string,
        id: string,
        paymentData: { sourceAccountId: string; expenseAccountId: string; date?: Date; notes?: string },
        tx: TransactionContext,
        userId?: string
    ): Promise<void> {
        if (!paymentData.sourceAccountId || !paymentData.expenseAccountId) {
            throw new HTTPException(400, { message: "Source Account and Expense Account are required for payment" });
        }

        const cost = await this.repository.findById(tenantId, id, tx);

        if (!cost) throw new HTTPException(404, { message: "Expense not found" });
        if (cost.status === "paid") throw new HTTPException(400, { message: "Expense already paid" });

        const paidAt = paymentData.date || new Date();

        // 1. Update status
        await this.repository.update(tenantId, id, {
            status: "paid",
            paidAt: paidAt,
            description: paymentData.notes ? `${cost.description} | ${paymentData.notes}` : cost.description
        }, tx);

        // 2. Journal Entry
        await this.accountingGateway.createJournal(tenantId, {
            description: `Pembayaran Biaya: ${cost.category}`,
            referenceType: "expense",
            referenceId: id,
            date: paidAt,
            lines: [
                {
                    accountId: paymentData.expenseAccountId,
                    debit: cost.amount,
                    credit: 0,
                    description: `${cost.category} - ${cost.description || ''}`
                },
                {
                    accountId: paymentData.sourceAccountId,
                    debit: 0,
                    credit: cost.amount,
                    description: `Pembayaran ${cost.category}`
                }
            ]
        }, userId || 'system', tx);
    }
}
