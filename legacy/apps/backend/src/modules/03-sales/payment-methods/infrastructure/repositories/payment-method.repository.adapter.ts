import { eq, asc, and } from "drizzle-orm";
import { TransactionContext } from "../../../../../shared/types/db-context";
import { paymentMethods, paymentVariants } from "../../../../../shared/infrastructure/database/schema";
import { IPaymentMethodRepository, PaymentMethod } from "../../domain";

export class PaymentMethodRepositoryAdapter implements IPaymentMethodRepository {
    async findAll(tenantId: string, tx: TransactionContext): Promise<PaymentMethod[]> {
        return await tx.query.paymentMethods.findMany({
            where: eq(paymentMethods.tenantId, tenantId),
            with: { variants: true },
            orderBy: [asc(paymentMethods.createdAt)],
        }) as PaymentMethod[];
    }

    async findEnabled(tenantId: string, tx: TransactionContext): Promise<PaymentMethod[]> {
        return await tx.query.paymentMethods.findMany({
            where: and(eq(paymentMethods.tenantId, tenantId), eq(paymentMethods.enabled, true)),
            with: {
                variants: {
                    where: eq(paymentVariants.enabled, true),
                },
            },
            orderBy: [asc(paymentMethods.createdAt)],
        }) as PaymentMethod[];
    }

    async findById(tenantId: string, id: string, tx: TransactionContext): Promise<PaymentMethod | null> {
        const result = await tx.query.paymentMethods.findFirst({
            where: and(eq(paymentMethods.tenantId, tenantId), eq(paymentMethods.id, id)),
            with: { variants: true },
        });
        return (result as PaymentMethod) || null;
    }

    async create(tenantId: string, data: any, tx: TransactionContext): Promise<PaymentMethod> {
        await tx.insert(paymentMethods).values({ ...data, tenantId });
        return (await this.findById(tenantId, data.id, tx)) as PaymentMethod;
    }

    async update(tenantId: string, id: string, data: any, tx: TransactionContext): Promise<PaymentMethod> {
        await tx.update(paymentMethods)
            .set(data)
            .where(and(eq(paymentMethods.tenantId, tenantId), eq(paymentMethods.id, id)));
        return (await this.findById(tenantId, id, tx)) as PaymentMethod;
    }

    async createVariant(tenantId: string, data: any, tx: TransactionContext): Promise<void> {
        await tx.insert(paymentVariants).values({ ...data, tenantId });
    }

    async updateVariant(tenantId: string, id: string, data: any, tx: TransactionContext): Promise<void> {
        await tx.update(paymentVariants)
            .set(data)
            .where(and(eq(paymentVariants.tenantId, tenantId), eq(paymentVariants.id, id)));
    }

    async findVariantById(tenantId: string, id: string, tx: TransactionContext): Promise<any> {
        return await tx.query.paymentVariants.findFirst({
            where: and(eq(paymentVariants.tenantId, tenantId), eq(paymentVariants.id, id))
        });
    }
}
