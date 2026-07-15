import { TransactionContext } from "../../../../../shared/types/db-context";
import { IPaymentMethodRepository, PaymentMethod } from "../../domain";
import { HTTPException } from "hono/http-exception";

export class GetPaymentMethodsUseCase {
    constructor(private readonly repository: IPaymentMethodRepository) { }

    async execute(tenantId: string, tx: TransactionContext, enabledOnly: boolean = false): Promise<PaymentMethod[]> {
        if (enabledOnly) {
            return await this.repository.findEnabled(tenantId, tx);
        }
        return await this.repository.findAll(tenantId, tx);
    }
}

export class GetPaymentMethodByIdUseCase {
    constructor(private readonly repository: IPaymentMethodRepository) { }

    async execute(tenantId: string, id: string, tx: TransactionContext): Promise<PaymentMethod> {
        const pm = await this.repository.findById(tenantId, id, tx);
        if (!pm) {
            throw new HTTPException(404, { message: "Payment method not found" });
        }
        return pm;
    }
}
