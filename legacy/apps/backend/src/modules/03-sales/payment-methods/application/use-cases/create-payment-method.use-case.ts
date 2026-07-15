import { TransactionContext } from "../../../../../shared/types/db-context";
import { IPaymentMethodRepository, IAccountGateway, PaymentMethod, PaymentMethodInput } from "../../domain";

export class CreatePaymentMethodUseCase {
    constructor(
        private readonly repository: IPaymentMethodRepository,
        private readonly accountGateway: IAccountGateway
    ) { }

    async execute(tenantId: string, input: PaymentMethodInput, tx: TransactionContext): Promise<PaymentMethod> {
        const id = `PM-${Date.now()}`;

        // Auto-link or create account
        const accountId = await this.accountGateway.ensureAccount(
            tenantId,
            input.name,
            input.type,
            tx,
            input.accountId
        );

        return await this.repository.create(tenantId, {
            id,
            name: input.name,
            type: input.type,
            icon: input.icon,
            accountId,
            feeConfig: input.feeConfig,
            enabled: true,
        }, tx);
    }
}
