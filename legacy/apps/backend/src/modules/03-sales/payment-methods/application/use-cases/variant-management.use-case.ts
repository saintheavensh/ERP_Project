import { TransactionContext } from "../../../../../shared/types/db-context";
import { IPaymentMethodRepository, IAccountGateway, PaymentVariantInput, PaymentMethod } from "../../domain";
import { HTTPException } from "hono/http-exception";

export class VariantManagementUseCase {
    constructor(
        private readonly repository: IPaymentMethodRepository,
        private readonly accountGateway: IAccountGateway
    ) { }

    async addVariant(tenantId: string, methodId: string, input: PaymentVariantInput, tx: TransactionContext): Promise<PaymentMethod> {
        const pm = await this.repository.findById(tenantId, methodId, tx);
        if (!pm) {
            throw new HTTPException(404, { message: "Payment method not found" });
        }

        const id = `PV-${Date.now()}`;

        // Auto-link or create account for variant (e.g. Bank BCA - Rekening Utama)
        const accountId = await this.accountGateway.ensureAccount(
            tenantId,
            input.name,
            "transfer",
            tx,
            input.accountId
        );

        await this.repository.createVariant(tenantId, {
            id,
            methodId,
            name: input.name,
            accountNumber: input.accountNumber,
            accountHolder: input.accountHolder,
            accountId,
            enabled: true,
        }, tx);

        return await this.repository.findById(tenantId, methodId, tx) as PaymentMethod;
    }

    async updateVariant(tenantId: string, variantId: string, data: any, tx: TransactionContext): Promise<void> {
        await this.repository.updateVariant(tenantId, variantId, data, tx);
    }

    async disableVariant(tenantId: string, variantId: string, tx: TransactionContext): Promise<void> {
        await this.repository.updateVariant(tenantId, variantId, { enabled: false }, tx);
    }
}
