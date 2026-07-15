import { TransactionContext } from "../../../../../shared/types/db-context";
import { IPurchasePaymentRepository, IPurchaseRepository, IAccountingGateway } from "../../domain/purchase-repository.port";
import { InventoryService } from "../../../../02-inventory/inventory/application/services/inventory.service";
import { notifications, productVariants } from "../../../../../shared/infrastructure/database/schema";
import { eq, and } from "drizzle-orm";
import { computeNetAmount, multiplyMoney } from "../../../../../shared/utils/money";

export interface VerifyAndCompletePurchaseDto {
    purchaseId: string;
    userId: string;
    items: {
        productId: string;
        variant?: string;
        buyPrice: number;
        sellPrice: number;
    }[];
    options?: {
        shippingFee?: number;
        shippingExpenseAccountId?: string;
        discountAmount?: number;
        referenceNumber?: string;
        paymentDueDate?: Date;
        payment?: {
            method: string;
            amount: number;
            accountId?: string;
            proofImage?: string;
        };
    };
}

export class VerifyAndCompletePurchaseUseCase {
    constructor(
        private purchaseRepo: IPurchaseRepository,
        private paymentRepo: IPurchasePaymentRepository,
        private inventoryService: InventoryService,
        private accountingGateway: IAccountingGateway
    ) { }

    async execute(tenantId: string, dto: VerifyAndCompletePurchaseDto, tx: TransactionContext): Promise<{ message: string; id: string }> {
        const runInternal = async () => {
            const purchase = await this.purchaseRepo.findById(tenantId, dto.purchaseId, tx);
            if (!purchase) {
                throw new Error(`Purchase order ${dto.purchaseId} not found`);
            }

            // Guard: Idempotency (Strict Rule)
            if (purchase.status === "COMPLETED" || purchase.status === "VERIFIED") {
                throw new Error(`Purchase order ${dto.purchaseId} is already verified or completed.`);
            }

            // Guard: Lifecycle (RECEIVED -> VERIFIED/COMPLETED)
            if (purchase.status !== "RECEIVED") {
                throw new Error(`Purchase order must be in RECEIVED status to be completed. Current status: ${purchase.status}`);
            }

            // PR-2: Mandatory 1:1 – every PO item with qtyReceived > 0 must be in verification payload
            const receivedItemsInPO = purchase.items.filter(i => i.qtyReceived > 0);
            for (const pi of receivedItemsInPO) {
                const inPayload = dto.items.some(item => item.productId === pi.productId && (item.variant || null) === (pi.variantId || null));
                if (!inPayload) {
                    throw new Error(`Incomplete verification: PO item for product ${pi.productId} with qtyReceived > 0 must be included`);
                }
            }

            let totalGoodsAmount = 0;
            const verificationInputItems: any[] = [];

            // Update Domain Entity Pricing and Collect for Inventory
            for (const item of dto.items) {
                const poItem = purchase.items.find(i => i.productId === item.productId && i.variantId === (item.variant || undefined));
                if (!poItem) continue;

                poItem.updatePricing(item.buyPrice, item.sellPrice);
                totalGoodsAmount += multiplyMoney(item.buyPrice, poItem.qtyReceived);

                if (poItem.qtyReceived <= 0) continue;

                let variantId: string | null = null;
                if (item.variant) {
                    const variant = await tx.query.productVariants.findFirst({
                        where: and(eq(productVariants.productId, item.productId), eq(productVariants.name, item.variant))
                    });
                    variantId = variant?.id || null;
                }

                verificationInputItems.push({
                    purchaseItemId: poItem.id, // Using props.id if it's there, or we need a stable ID
                    productId: item.productId,
                    variantId: variantId,
                    buyPrice: item.buyPrice,
                    sellPrice: item.sellPrice,
                    qtyReceived: poItem.qtyReceived
                });
            }

            // Inventory Integration
            const { allocations } = await this.inventoryService.addStockFromPurchaseVerification({
                purchaseId: purchase.id,
                supplierId: purchase.supplierId,
                items: verificationInputItems
            }, tx, tenantId);

            // Update batch IDs on items
            for (const a of allocations) {
                const item = purchase.items.find(i => i.id === a.purchaseItemId);
                if (item) {
                    item.updateBatchId(a.batchId);
                }
            }

            const shipping = dto.options?.shippingFee || 0;
            const discount = dto.options?.discountAmount || 0;
            const finalTotal = computeNetAmount(totalGoodsAmount, shipping, discount);

            // Domain state transition
            purchase.verify(dto.userId, dto.items.map(i => ({ productId: i.productId, variantId: i.variant, buyPrice: i.buyPrice, sellPrice: i.sellPrice })), {
                shippingFee: shipping,
                discountAmount: discount,
                shippingExpenseAccountId: dto.options?.shippingExpenseAccountId,
                referenceNumber: dto.options?.referenceNumber,
                paymentDueDate: dto.options?.paymentDueDate
            });

            // Save state
            await this.purchaseRepo.save(tenantId, purchase, tx);

            // Record Payment if provided
            if (dto.options?.payment && dto.options.payment.amount > 0) {
                await this.paymentRepo.savePayment(tenantId, {
                    purchaseId: purchase.id,
                    supplierId: purchase.supplierId,
                    amount: dto.options.payment.amount,
                    method: dto.options.payment.method,
                    accountId: dto.options.payment.accountId || null,
                    proofImage: dto.options.payment.proofImage || null,
                    createdBy: dto.userId,
                    createdAt: new Date()
                }, tx);
            }

            // Accounting Journal
            const journalLines = [
                { accountId: "1-3000", debit: totalGoodsAmount, credit: 0, description: `Inventory Increase ${purchase.id}` },
                { accountId: "2-1000", debit: 0, credit: finalTotal, description: `Accounts Payable ${purchase.id}` }
            ];

            if (shipping > 0) {
                journalLines.push({
                    accountId: dto.options?.shippingExpenseAccountId || "5-2000",
                    debit: shipping,
                    credit: 0,
                    description: `Shipping Fee ${purchase.id}`
                });
            }

            if (discount > 0) {
                journalLines.push({
                    accountId: "1-3000",
                    debit: 0,
                    credit: discount,
                    description: `Purchase Discount ${purchase.id}`
                });
            }

            await this.accountingGateway.createJournal(tenantId, {
                description: `Verify Pembelian ${purchase.id}`,
                referenceType: "purchase",
                referenceId: purchase.id,
                lines: journalLines,
                isAutoGenerated: true
            }, dto.userId, tx);

            // High Spend Alert
            if (totalGoodsAmount > 5000000) {
                await tx.insert(notifications).values({
                    tenantId,
                    userId: "user-owner-001", // Default owner placeholder
                    type: "spend_alert",
                    title: "High Spend Alert",
                    message: `Purchase Order ${purchase.id} finalized with high value: ${totalGoodsAmount}`,
                    entityType: "purchase",
                    entityId: purchase.id,
                });
            }

            return { message: "Purchase verified and stock updated", id: purchase.id };
        };

        return await runInternal();
    }
}
