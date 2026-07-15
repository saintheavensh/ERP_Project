import { TransactionContext } from "../../../../../shared/types/db-context";
import { IPurchaseRepository } from "../../domain/purchase-repository.port";
import { ISupplierRepository } from "../../../suppliers/domain/repositories/supplier.repository";
import { IProductRepository } from "../../../../02-inventory/products/domain/ports/IProductRepository";
import { Result } from "../../../../../shared/core/Result";
import { RecordStockMovementUseCase } from "../../../../02-inventory/inventory/application/use-cases/record-stock-movement.use-case";
import { PurchaseOrder, PurchaseStatus, PurchaseItem, PurchaseItemProps } from "../../domain/entities/purchase.entity";
import { generateId, ID_PREFIX } from "../../../../../shared/utils/validation/IdGenerator";

export interface CreatePurchaseInput {
    supplierId: string;
    userId?: string;
    items: {
        productId: string;
        variantId?: string;
        qtyOrdered: number;
        buyPrice: number;
        sellPrice: number;
    }[];
    notes?: string;
    referenceNumber?: string;
}

export class CreatePurchaseUseCase {
    constructor(
        private purchaseRepo: IPurchaseRepository,
        private supplierRepo: ISupplierRepository,
        private productRepo: IProductRepository,
        private recordStockMovementUseCase: RecordStockMovementUseCase
    ) { }

    async execute(tenantId: string, data: CreatePurchaseInput, tx: TransactionContext): Promise<Result<PurchaseOrder>> {
        // 1. Validate Supplier exists and is active
        const supplierResult = await this.supplierRepo.findById(tenantId, data.supplierId, tx);
        if (!supplierResult || supplierResult.isActive === false) {
            return Result.fail(`Supplier with ID ${data.supplierId} not found or inactive`);
        }

        let totalAmount = 0;

        // 2. Validate Products and prepare Items DTO
        const processedItems: PurchaseItemProps[] = [];
        for (const itemInput of data.items) {
            if (itemInput.qtyOrdered <= 0) {
                return Result.fail(`Order quantity for Product ${itemInput.productId} must be > 0`);
            }

            // Retrieve via Row-Level lock to avoid race conditions.
            const productResult = await this.productRepo.findByIdForUpdate(itemInput.productId, tx);
            if (productResult.isFailure) {
                return Result.fail(`Product with ID ${itemInput.productId} not found`);
            }

            const product = productResult.getValue();
            if (!product.isActive) {
                return Result.fail(`Product with ID ${itemInput.productId} is inactive and cannot be purchased`);
            }

            processedItems.push({
                productId: itemInput.productId,
                qtyOrdered: itemInput.qtyOrdered,
                qtyReceived: 0,
                buyPrice: itemInput.buyPrice,
                sellPrice: itemInput.sellPrice,
                variantId: itemInput.variantId
            });

            totalAmount += (itemInput.qtyOrdered * itemInput.buyPrice);
        }

        // 3. Create the Domain Entity
        const purchase = new PurchaseOrder({
            id: generateId(ID_PREFIX.PURCHASE),
            supplierId: data.supplierId,
            userId: data.userId,
            totalAmount,
            status: "ORDERED" as PurchaseStatus,
            items: processedItems.map(p => new PurchaseItem(p)),
            notes: data.notes,
            referenceNumber: data.referenceNumber,
            date: new Date()
        });

        // 4. Save via Repository
        await this.purchaseRepo.save(tenantId, purchase, tx);

        // 5. Update Stock via immutable ledger
        for (const item of processedItems) {
            const movementResult = await this.recordStockMovementUseCase.execute({
                productId: item.productId,
                type: "IN",
                referenceType: "PURCHASE",
                referenceId: purchase.id,
                quantity: item.qtyOrdered
            }, tx);

            if (movementResult.isFailure) {
                return Result.fail(`Failed to assign stock ledger for product ${item.productId}: ${movementResult.error}`);
            }
        }

        return Result.ok(purchase);
    }
}
