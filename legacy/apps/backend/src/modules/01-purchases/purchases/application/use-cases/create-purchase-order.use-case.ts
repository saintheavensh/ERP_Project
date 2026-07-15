import { IPurchaseRepository, IActivityLogger, INotificationGateway, IPurchaseVariantPolicyGateway } from "../../domain/purchase-repository.port";
import { PurchaseOrder, PurchaseItem } from "../../domain/entities/purchase.entity";
import { TransactionContext } from "../../../../../shared/types/db-context";

export interface CreatePurchaseOrderDto {
    supplierId: string;
    userId: string;
    referenceNumber?: string;
    notes?: string;
    date?: string;
    items: {
        productId: string;
        variant?: string;
        qtyOrdered: number;
        estimatedBuyPrice?: number;
        targetSellPrice?: number;
    }[];
}

export class CreatePurchaseOrderUseCase {
    constructor(
        private purchaseRepo: IPurchaseRepository,
        private activityLogger: IActivityLogger,
        private notificationGateway: INotificationGateway,
        private variantPolicyGateway: IPurchaseVariantPolicyGateway
    ) { }

    async execute(tenantId: string, dto: CreatePurchaseOrderDto, tx: TransactionContext): Promise<{ message: string; id: string }> {
        const runInternal = async () => {
            const purchaseId = "PO-" + Date.now().toString();
            const totalAmount = dto.items.reduce((sum, item) => sum + ((item.estimatedBuyPrice || 0) * item.qtyOrdered), 0);
            const purchaseDate = dto.date ? new Date(dto.date) : new Date();

            // 1. Validation (Variant availability for supplier via policy gateway)
            for (const item of dto.items) {
                if (item.variant) {
                    await this.variantPolicyGateway.ensureVariantAllowedForSupplier(
                        tenantId,
                        {
                            productId: item.productId,
                            variantName: item.variant,
                            supplierId: dto.supplierId
                        },
                        tx
                    );
                }
            }

            // 2. Map to Domain
            const items = dto.items.map(i => new PurchaseItem({
                productId: i.productId,
                variantId: i.variant,
                qtyOrdered: i.qtyOrdered,
                qtyReceived: 0,
                buyPrice: i.estimatedBuyPrice || 0,
                sellPrice: i.targetSellPrice || 0
            }));

            const purchase = new PurchaseOrder({
                id: purchaseId,
                supplierId: dto.supplierId,
                userId: dto.userId,
                totalAmount: totalAmount,
                status: "ORDERED",
                items: items,
                date: purchaseDate,
                referenceNumber: dto.referenceNumber,
                notes: dto.notes
            });

            // 3. Save
            await this.purchaseRepo.save(tenantId, purchase, tx);

            // 4. Activity Log
            await this.activityLogger.log(
                tenantId,
                {
                    userId: dto.userId,
                    action: "CREATE",
                    entityType: "purchase_order",
                    entityId: purchaseId,
                    description: `Created Purchase Order ${purchaseId}`
                },
                tx
            );

            // 5. Notification
            await this.notificationGateway.notifyPurchaseOrderCreated(
                tenantId,
                {
                    purchaseId,
                    userId: dto.userId,
                    supplierId: dto.supplierId
                },
                tx
            );

            return { message: "Order created successfully", id: purchaseId };
        };

        return await runInternal();
    }
}
