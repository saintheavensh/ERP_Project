import { TransactionContext } from "../../../../../shared/types/db-context";
import { ICustomerRepository, Customer } from "../../domain";
import { HTTPException } from "hono/http-exception";
import { eq } from "drizzle-orm";
import { sales, salePayments } from "../../../../../shared/infrastructure/database/schema";

export interface ProcessPaymentDto {
    customerId: string;
    amount: number;
    method: "cash" | "transfer" | "qris";
    notes?: string;
    saleId?: string;
    proofImage?: string;
}

export class ProcessCustomerPaymentUseCase {
    constructor(
        private readonly repository: ICustomerRepository
    ) { }

    async execute(tenantId: string, dto: ProcessPaymentDto, tx: TransactionContext): Promise<Customer> {
        const customer = await this.repository.findById(tenantId, dto.customerId, tx);
        if (!customer) {
            throw new HTTPException(404, { message: "Customer not found" });
        }

        const currentDebt = customer.debt || 0;
        if (dto.amount > currentDebt) {
            throw new HTTPException(400, { message: `Payment (${dto.amount}) exceeds total debt (${currentDebt})` });
        }

        // 1. If saleId provided, validate and update Sale
        if (dto.saleId) {
            const sale = await tx.query.sales.findFirst({
                where: eq(sales.id, dto.saleId)
            });

            if (!sale) throw new HTTPException(404, { message: "Invoice not found" });
            if (sale.paymentStatus === 'paid') throw new HTTPException(400, { message: "Invoice already paid" });

            // Add Payment Record
            await tx.insert(salePayments).values({
                saleId: dto.saleId,
                method: dto.method,
                amount: dto.amount,
                reference: dto.notes,
                proofImage: dto.proofImage,
                tenantId
            });

            // Update Sale Status
            const allPayments = await tx.query.salePayments.findMany({
                where: eq(salePayments.saleId, dto.saleId)
            });

            const totalPaidReal = allPayments
                .filter((p: any) => p.method !== 'tempo')
                .reduce((sum: number, p: any) => sum + p.amount, 0);

            let status: "paid" | "partial" | "unpaid" = "unpaid";
            if (totalPaidReal >= sale.totalAmount) {
                status = "paid";
            } else if (totalPaidReal > 0) {
                status = "partial";
            }

            await tx.update(sales).set({ paymentStatus: status }).where(eq(sales.id, dto.saleId));
        }

        // 2. Reduce Member Debt
        const newDebt = currentDebt - dto.amount;
        return await this.repository.update(tenantId, dto.customerId, { debt: newDebt }, tx);
    }
}
