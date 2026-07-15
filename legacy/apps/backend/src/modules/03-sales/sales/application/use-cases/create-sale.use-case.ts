import { TransactionContext } from "../../../../../shared/types/db-context";
import {
    ISaleRepository,
    IAccountingGateway,
    IMemberGateway,
    ISettingsGateway,
    IApprovalGateway,
    CreateSaleInput,
    PaymentMethodType,
    PaymentStatus
} from "../../domain";
import { HTTPException } from "hono/http-exception";
import { multiplyMoney, computeNetAmount } from "../../../../../shared/utils/money";
import { GetProductStockUseCase } from "../../../../02-inventory/inventory/application/use-cases/get-product-stock.use-case";
import type { IProductRepository } from "../../../../02-inventory/products/domain/ports/IProductRepository";
import type { IInventoryTransactionService } from "../../../../02-inventory/inventory/application/services/inventory-transaction.service";

// Domain errors for stock validation
export class ProductNotFoundError extends Error {
    constructor(productId: string) { super(`Product with ID ${productId} not found`); this.name = "ProductNotFoundError"; }
}
export class ProductInactiveError extends Error {
    constructor(productId: string) { super(`Product with ID ${productId} is inactive`); this.name = "ProductInactiveError"; }
}
export class InsufficientStockError extends Error {
    constructor(productId: string, available: number, requested: number) {
        super(`Insufficient stock for product ${productId}. Available: ${available}, Requested: ${requested}`);
        this.name = "InsufficientStockError";
    }
}
export class InvalidQuantityError extends Error {
    constructor(productId: string) { super(`Quantity must be > 0 for product ${productId}`); this.name = "InvalidQuantityError"; }
}

export class CreateSaleUseCase {
    constructor(
        private readonly repository: ISaleRepository,
        private readonly accountingGateway: IAccountingGateway,
        private readonly memberGateway: IMemberGateway,
        private readonly settingsGateway: ISettingsGateway,
        private readonly approvalGateway: IApprovalGateway,
        private readonly getProductStockUseCase: GetProductStockUseCase,
        private readonly productRepo: IProductRepository,
        private readonly inventoryTransactionService: IInventoryTransactionService
    ) { }

    async execute(tenantId: string, data: CreateSaleInput, tx: TransactionContext): Promise<{ message: string; id: string; change: number }> {
        const saleId = "SAL-" + Date.now().toString();
        const subtotal = data.items.reduce((sum, item) => sum + multiplyMoney(item.price, item.qty), 0);
        const discountAmount = data.discountAmount || 0;
        const finalAmount = computeNetAmount(subtotal, 0, discountAmount);

        // 0. Approval Check (Discounts)
        if (discountAmount > 0) {
            const discountPercent = (discountAmount / subtotal) * 100;
            const needsApproval = await this.approvalGateway.needsApproval('DISCOUNT', discountPercent, { isPercent: true });

            if (needsApproval) {
                if (!data.approvalId) {
                    throw new HTTPException(400, {
                        message: "Approval required for this discount level.",
                        // @ts-ignore
                        extra: { type: 'APPROVAL_REQUIRED', approvalType: 'DISCOUNT', amount: discountPercent }
                    });
                }
                const isApproved = await this.approvalGateway.isApproved(tenantId, data.approvalId, 'sale', tx);
                if (!isApproved) {
                    throw new HTTPException(400, { message: "Invalid or unapproved approval ID." });
                }
            }
        }

        // 1. Validate Products & Pre-Check Stock (fast-fail guard)
        for (const item of data.items) {
            if (item.qty <= 0) throw new InvalidQuantityError(item.productId);

            const productResult = await this.productRepo.findById(item.productId, tx);
            if (productResult.isFailure) throw new ProductNotFoundError(item.productId);

            const product = productResult.getValue();
            if (!product.isActive) throw new ProductInactiveError(item.productId);

            const stockResult = await this.getProductStockUseCase.execute(item.productId, tx);
            if (stockResult.isSuccess && stockResult.getValue() < item.qty) {
                throw new InsufficientStockError(item.productId, stockResult.getValue(), item.qty);
            }
        }

        // 2. Validate Payments
        const totalPaid = data.payments.reduce((sum, p) => sum + p.amount, 0);
        if (totalPaid < finalAmount) {
            throw new HTTPException(400, { message: `Insufficient payment. Total: ${finalAmount}, Paid: ${totalPaid}` });
        }

        // Determine Payment Status & Method String
        let paymentMethodStr: PaymentMethodType = "mixed";
        if (data.payments.length === 1) {
            const m = data.payments[0]!.method.toLowerCase();
            if (m.includes("cash") || m.includes("tunai")) paymentMethodStr = "cash";
            else if (m.includes("transfer")) paymentMethodStr = "transfer";
            else if (m.includes("qris")) paymentMethodStr = "qris";
            else paymentMethodStr = "mixed";
        }

        const nonTempoAmount = data.payments
            .filter(p => !p.method.toLowerCase().includes("tempo") && p.methodId !== "PM-TEMPO")
            .reduce((sum, p) => sum + p.amount, 0);

        let paymentStatus: PaymentStatus = "paid";
        if (nonTempoAmount >= finalAmount) {
            paymentStatus = "paid";
        } else if (nonTempoAmount > 0) {
            paymentStatus = "partial";
        } else {
            paymentStatus = "unpaid";
        }

        // Execute the main business logic
        // 0. Pre-check: Ensure Register is Open
        const isRegisterOpen = await this.accountingGateway.isRegisterOpen(tenantId, tx);
        if (!isRegisterOpen) {
            throw new HTTPException(400, { message: "Cash Register is closed. Please open a session first." });
        }

        // 1. Row-level locking + stock revalidation inside transaction
        for (const item of data.items) {
            const lockResult = await this.productRepo.findByIdForUpdate(item.productId, tx);
            if (lockResult.isFailure) throw new ProductNotFoundError(item.productId);

            const lockedProduct = lockResult.getValue();
            if (!lockedProduct.isActive) throw new ProductInactiveError(item.productId);

            const stockResult = await this.getProductStockUseCase.execute(item.productId, tx);
            if (stockResult.isSuccess && stockResult.getValue() < item.qty) {
                throw new InsufficientStockError(item.productId, stockResult.getValue(), item.qty);
            }
        }

        // 2. Deduct stock via InventoryTransactionService (FIFO + validation + ledger)
        const { allocations, totalCOGS } = await this.inventoryTransactionService.deductForSale({
            referenceId: saleId,
            items: data.items.map(i => ({
                productId: i.productId,
                variant: i.variant || "",
                quantity: i.qty
            }))
        }, tx);

        // 3. Handle Tempo (Debt)
        const tempoPayment = data.payments.find((p: any) => p.methodId === "PM-TEMPO" || p.method.toLowerCase().includes("tempo"));
        if (tempoPayment) {
            if (!data.memberId) {
                throw new HTTPException(400, { message: "Customer memberId is required for Tempo payments." });
            }
            const member = await this.memberGateway.findById(tenantId, data.memberId, tx);
            if (!member) {
                throw new HTTPException(404, { message: "Customer not found." });
            }

            const currentDebt = member.debt || 0;
            const creditLimit = member.creditLimit || 0;
            if (creditLimit > 0 && (currentDebt + tempoPayment.amount > creditLimit)) {
                throw new HTTPException(400, { message: `Credit limit exceeded. Limit: ${creditLimit}, Current Debt: ${currentDebt}, New: ${tempoPayment.amount}` });
            }

            await this.memberGateway.updateDebt(tenantId, data.memberId, tempoPayment.amount, tx);
        }

        // 4. Create Sale Header
        await this.repository.create(tenantId, {
            id: saleId,
            memberId: data.memberId,
            customerName: data.customerName,
            paymentMethod: paymentMethodStr,
            paymentStatus: paymentStatus,
            userId: data.userId,
            totalAmount: subtotal,
            discountAmount: data.discountAmount || 0,
            notes: data.notes
        }, tx);

        // 5. Insert Payments
        for (const p of data.payments) {
            await this.repository.createPayment(tenantId, {
                saleId: saleId,
                method: p.method,
                methodId: p.methodId,
                variantName: p.variantName,
                variantId: p.variantId,
                amount: p.amount,
                reference: p.reference
            }, tx);
        }

        // 6. Record Allocations as Sale Items
        const priceByItem = new Map<string, number>();
        for (const i of data.items) {
            priceByItem.set(`${i.productId}|${i.variant}`, i.price);
        }
        for (const a of allocations) {
            const unitPrice = priceByItem.get(`${a.productId}|${a.variantName}`) ?? 0;
            await this.repository.createItem(tenantId, {
                saleId,
                productId: a.productId,
                batchId: a.batchId,
                variant: a.variantName || "",
                qty: a.quantity,
                price: unitPrice
            }, tx);
        }

        // 7. Accounting logic
        let debitAccountId = "1-1000";
        if (paymentStatus === "paid") {
            const methodConfig = await this.settingsGateway.getPaymentMethods(tenantId, tx);
            const payment = data.payments[0];
            const methodDef = methodConfig?.methods.find((m: any) => m.id === payment!.methodId || m.name === payment!.method);

            if (methodDef) {
                const variantDef = methodDef.variants?.find((v: any) => v.id === payment!.variantId || v.name === payment!.variantName);
                if (variantDef?.accountId) {
                    debitAccountId = variantDef.accountId;
                } else if (methodDef.accountId) {
                    debitAccountId = methodDef.accountId;
                } else {
                    if (methodDef.type === "cash") debitAccountId = "1-1001";
                    else if (["transfer", "qris", "ewallet"].includes(methodDef.type)) debitAccountId = "1-1000";
                }
            }
        } else {
            debitAccountId = "1-2000"; // Piutang
        }

        const journalLines: any[] = [];
        journalLines.push({
            accountId: debitAccountId,
            debit: finalAmount,
            credit: 0,
            description: paymentStatus === 'paid' ? `Penerimaan ${paymentMethodStr}` : `Piutang Penjualan`
        });
        journalLines.push({
            accountId: "4-1000",
            debit: 0,
            credit: finalAmount,
            description: `Pendapatan ${saleId}`
        });

        if (totalCOGS > 0) {
            journalLines.push({
                accountId: "5-1001",
                debit: totalCOGS,
                credit: 0,
                description: `HPP ${saleId}`
            });
            journalLines.push({
                accountId: "1-3000",
                debit: 0,
                credit: totalCOGS,
                description: `Pengurangan persediaan ${saleId}`
            });
        }

        await this.accountingGateway.createJournal(tenantId, {
            description: `Penjualan ${saleId}`,
            referenceType: "sale",
            referenceId: saleId,
            lines: journalLines,
        }, data.userId, tx);

        // 8. Record in Cash Register
        for (const p of data.payments) {
            const methodLower = p.method.toLowerCase();
            if (methodLower.includes("cash") || methodLower.includes("tunai")) {
                await this.accountingGateway.recordCashTransaction(tenantId, {
                    transactionType: "sale",
                    transactionId: saleId,
                    amount: p.amount,
                    description: `Penjualan ${saleId}`
                }, tx);
            }
        }

        let change = 0;
        if (!data.payments.some(p => p.methodId === "PM-TEMPO" || p.method.toLowerCase().includes("tempo"))) {
            change = Math.max(0, totalPaid - finalAmount);
        }

        return { message: "Sale created", id: saleId, change: change > 0 ? change : 0 };
    }
}
