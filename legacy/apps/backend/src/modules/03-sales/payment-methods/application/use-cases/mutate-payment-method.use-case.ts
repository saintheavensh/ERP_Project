import { TransactionContext } from "../../../../../shared/types/db-context";
import { IPaymentMethodRepository, PaymentMethod } from "../../domain";
import { HTTPException } from "hono/http-exception";

export class MutatePaymentMethodUseCase {
    constructor(private readonly repository: IPaymentMethodRepository) { }

    async execute(tenantId: string, id: string, data: any, tx: TransactionContext): Promise<PaymentMethod> {
        const existing = await this.repository.findById(tenantId, id, tx);
        if (!existing) {
            throw new HTTPException(404, { message: "Payment method not found" });
        }

        return await this.repository.update(tenantId, id, data, tx);
    }

    async disable(tenantId: string, id: string, tx: TransactionContext): Promise<void> {
        const existing = await this.repository.findById(tenantId, id, tx);
        if (!existing) {
            throw new HTTPException(404, { message: "Payment method not found" });
        }

        await this.repository.update(tenantId, id, { enabled: false }, tx);
    }
}
