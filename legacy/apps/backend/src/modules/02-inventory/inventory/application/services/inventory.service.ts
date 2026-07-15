/**
 * Inventory service facade — wraps stock use cases.
 * tenantId is MANDATORY on all methods.
 *
 * SEALED: Every database operation routes through InventoryTransactionAuthority.
 *   - Methods called from controllers → authority.execute() (creates new tx)
 *   - Methods called from cross-module with existing tx → authority.executeWithExistingTx()
 *   - No direct useCase.execute(tx) bypass remains
 */
import type { DeductStockFIFOInput, DeductStockFIFOOutput, AddStockFromPurchaseVerificationInput, AddStockFromPurchaseVerificationOutput, ReverseStockInput } from "@domain/stock.types";
import type { ProductBatchEntity, IBatchRepository } from "@domain/batch-repository.port";
import type { DeductStockFIFOUseCase } from "@application/use-cases/deduct-stock-fifo.use-case";
import type { AddStockFromPurchaseUseCase } from "@application/use-cases/add-stock-from-purchase.use-case";
import type { ReverseStockUseCase } from "@application/use-cases/reverse-stock.use-case";
import type { GetLastBatchUseCase } from "@application/use-cases/get-last-batch.use-case";
import type { ReduceBatchStockUseCase } from "@application/use-cases/reduce-batch-stock.use-case";
import type { RecordDeadPhonePurchaseUseCase } from "@application/use-cases/record-dead-phone-purchase.use-case";
import type { RecordTestLogUseCase } from "@application/use-cases/record-test-log.use-case";
import type { HarvestPartUseCase } from "@application/use-cases/harvest-part.use-case";
import type { ForfeitServiceDeviceUseCase } from "@application/use-cases/forfeit-service-device.use-case";
import type { InventoryTransactionAuthority } from "./inventory-transaction-authority";
import type { TransactionContext } from "@shared/types/db-context";
import type { IGamblingRepository, DeadPhonePurchase, GamblingFilters } from "@domain/repositories/gambling-repository.port";
import type { IKanibalRepository, ForfeitedDevice, KanibalFilters } from "@domain/repositories/kanibal-repository.port";
import type { RecordDeadPhonePurchaseInput } from "@application/use-cases/record-dead-phone-purchase.use-case";
import type { RecordTestLogInput } from "@application/use-cases/record-test-log.use-case";
import type { HarvestPartInput } from "@application/use-cases/harvest-part.use-case";
import type { ForfeitServiceDeviceInput } from "@application/use-cases/forfeit-service-device.use-case";

export class InventoryService {
    constructor(
        private readonly deductStockFIFOUC: DeductStockFIFOUseCase,
        private readonly addStockFromPurchaseUC: AddStockFromPurchaseUseCase,
        private readonly reverseStockUC: ReverseStockUseCase,
        private readonly getLastBatchUC: GetLastBatchUseCase,
        private readonly reduceBatchStockUC: ReduceBatchStockUseCase,
        private readonly batchRepository: IBatchRepository,
        private readonly recordDeadPhoneUC: RecordDeadPhonePurchaseUseCase,
        private readonly recordTestLogUC: RecordTestLogUseCase,
        private readonly harvestPartUC: HarvestPartUseCase,
        private readonly forfeitServiceDeviceUC: ForfeitServiceDeviceUseCase,
        private readonly gamblingRepo: IGamblingRepository,
        private readonly kanibalRepo: IKanibalRepository,
        private readonly getProductsService: () => IProductsServiceProxy,
        private readonly inventoryAuthority: InventoryTransactionAuthority
    ) { }

    // ─── Cross-module methods (tx may come from external caller) ──────

    /**
     * SEALED: If tx provided → executeWithExistingTx (validates tenant, logs).
     * If no tx → execute (creates root tx, validates tenant, logs).
     */
    async deductStockFIFO(input: DeductStockFIFOInput, tx?: TransactionContext, tenantId?: string): Promise<DeductStockFIFOOutput> {
        const tid = this.requireTenantId(tenantId, tx);
        if (tx) {
            return this.inventoryAuthority.executeWithExistingTx(
                tx, { tenantId: tid },
                (innerTx) => this.deductStockFIFOUC.execute(input, innerTx, tid)
            );
        }
        return this.inventoryAuthority.execute(
            { tenantId: tid },
            (innerTx: TransactionContext) => this.deductStockFIFOUC.execute(input, innerTx, tid)
        );
    }

    async addStockFromPurchaseVerification(
        input: AddStockFromPurchaseVerificationInput,
        tx?: TransactionContext,
        tenantId?: string
    ): Promise<AddStockFromPurchaseVerificationOutput> {
        const tid = this.requireTenantId(tenantId, tx);
        if (tx) {
            return this.inventoryAuthority.executeWithExistingTx(
                tx, { tenantId: tid },
                (innerTx) => this.addStockFromPurchaseUC.execute(input, innerTx, tid)
            );
        }
        return this.inventoryAuthority.execute(
            { tenantId: tid },
            (innerTx: TransactionContext) => this.addStockFromPurchaseUC.execute(input, innerTx, tid)
        );
    }

    async reverseStockFromPurchaseDeletion(input: ReverseStockInput, tx?: TransactionContext, tenantId?: string): Promise<void> {
        const tid = this.requireTenantId(tenantId, tx);
        if (tx) {
            return this.inventoryAuthority.executeWithExistingTx(
                tx, { tenantId: tid },
                (innerTx) => this.reverseStockUC.execute(input, innerTx, tid)
            );
        }
        return this.inventoryAuthority.execute(
            { tenantId: tid },
            (innerTx: TransactionContext) => this.reverseStockUC.execute(input, innerTx, tid)
        );
    }

    async getLastBatchByProduct(productId: string, tx?: TransactionContext, tenantId?: string): Promise<ProductBatchEntity | null> {
        const tid = this.requireTenantId(tenantId, tx);
        if (tx) {
            return this.inventoryAuthority.executeWithExistingTx(
                tx, { tenantId: tid },
                (innerTx) => this.getLastBatchUC.execute(productId, innerTx)
            );
        }
        return this.inventoryAuthority.execute(
            { tenantId: tid },
            (innerTx: TransactionContext) => this.getLastBatchUC.execute(productId, innerTx)
        );
    }

    async getBatchById(batchId: string, tx?: TransactionContext, tenantId?: string): Promise<ProductBatchEntity | null> {
        const tid = this.requireTenantId(tenantId, tx);
        if (tx) {
            return this.inventoryAuthority.executeWithExistingTx(
                tx, { tenantId: tid },
                (innerTx) => this.batchRepository.findById(batchId, innerTx)
            );
        }
        return this.inventoryAuthority.execute(
            { tenantId: tid },
            (innerTx: TransactionContext) => this.batchRepository.findById(batchId, innerTx)
        );
    }

    // ─── Controller-only methods (always create root tx) ──────────────

    async reduceStock(batchId: string, qty: number, tenantId: string): Promise<void> {
        return this.inventoryAuthority.execute(
            { tenantId },
            (tx: TransactionContext) => this.reduceBatchStockUC.execute(batchId, qty, tx, tenantId)
        );
    }

    async recordDeadPhonePurchase(input: RecordDeadPhonePurchaseInput, tenantId: string): Promise<DeadPhonePurchase> {
        return this.inventoryAuthority.execute(
            { tenantId },
            (tx: TransactionContext) => this.recordDeadPhoneUC.execute(input, tx, tenantId)
        );
    }

    async recordTestLog(input: RecordTestLogInput, tenantId: string): Promise<unknown> {
        return this.inventoryAuthority.execute(
            { tenantId },
            (tx: TransactionContext) => this.recordTestLogUC.execute(input, tx, tenantId)
        );
    }

    async harvestPart(input: HarvestPartInput, tenantId: string): Promise<unknown> {
        return this.inventoryAuthority.execute(
            { tenantId },
            (tx: TransactionContext) => this.harvestPartUC.execute(input, tx, tenantId)
        );
    }

    async forfeitServiceDevice(input: ForfeitServiceDeviceInput, tenantId: string): Promise<ForfeitedDevice> {
        return this.inventoryAuthority.execute(
            { tenantId },
            (tx: TransactionContext) => this.forfeitServiceDeviceUC.execute(input, tx, tenantId)
        );
    }

    async getDeadPhones(tenantId: string, filters?: GamblingFilters): Promise<DeadPhonePurchase[]> {
        return this.inventoryAuthority.execute(
            { tenantId },
            (tx: TransactionContext) => this.gamblingRepo.findAll(tx, filters)
        );
    }

    async getForfeitedDevices(tenantId: string, filters?: KanibalFilters): Promise<ForfeitedDevice[]> {
        return this.inventoryAuthority.execute(
            { tenantId },
            (tx: TransactionContext) => this.kanibalRepo.findForfeitedDevices(tx, filters)
        );
    }

    // ─── Products proxy (no tx needed — routed through ProductsFacade) ─

    async getAllProducts(tenantId: string, ...args: unknown[]) { return this.getProductsService().getAllProducts(tenantId, ...args); }
    async getProductById(tenantId: string, productId: string) { return this.getProductsService().getProduct(tenantId, productId); }
    async createProduct(tenantId: string, data: unknown) { return this.getProductsService().createProduct(tenantId, data); }
    async updateProduct(tenantId: string, id: string, data: unknown) { return this.getProductsService().updateProduct(tenantId, id, data); }
    async deleteProduct(tenantId: string, id: string) { return this.getProductsService().deleteProduct(tenantId, id); }
    async getSupplierVariants(tenantId: string, supplierId: string) { return this.getProductsService().getSupplierVariants(tenantId, supplierId); }
    async createVariant(tenantId: string, data: unknown) { return this.getProductsService().createVariant(tenantId, data); }
    async updateVariant(tenantId: string, id: string, data: unknown) { return this.getProductsService().updateVariant(tenantId, id, data); }
    async getProductVariants(tenantId: string, productId: string, supplierId?: string) { return this.getProductsService().getProductVariants(tenantId, productId, supplierId); }
    async deleteVariant(tenantId: string, variantId: string) { return this.getProductsService().deleteVariant(tenantId, variantId); }
    async bulkUpdateMinStock(tenantId: string, updates: unknown) { return this.getProductsService().bulkUpdateMinStock(tenantId, updates); }
    async getProductCountByCategory(tenantId: string) { return this.getProductsService().getProductCountByCategory(tenantId); }
    async getStats(tenantId: string) { return this.getProductsService().getStats(tenantId); }
    async searchProduct(tenantId: string, q: string) { return this.getProductsService().searchProduct(tenantId, q); }
    async printLabel(tenantId: string, data: unknown) { return this.getProductsService().printLabel(tenantId, data); }

    // ─── Internal helper ──────────────────────────────────────────────

    /**
     * Resolves tenantId from explicit param or tx metadata. Throws if missing.
     */
    private requireTenantId(tenantId?: string, tx?: TransactionContext): string {
        if (tenantId) return tenantId;
        const txTid = (tx as Record<string, unknown> | undefined)?.tenantId;
        if (typeof txTid === "string" && txTid.length > 0) return txTid;
        throw new Error("InventoryService: tenantId is required");
    }
}

/**
 * Minimal typed interface for cross-module ProductsService proxy methods.
 */
export interface IProductsServiceProxy {
    getAllProducts(tenantId: string, ...args: unknown[]): Promise<unknown>;
    getProduct(tenantId: string, id: string): Promise<unknown>;
    createProduct(tenantId: string, data: unknown): Promise<unknown>;
    updateProduct(tenantId: string, id: string, data: unknown): Promise<unknown>;
    deleteProduct(tenantId: string, id: string): Promise<unknown>;
    getSupplierVariants(tenantId: string, supplierId: string): Promise<unknown>;
    createVariant(tenantId: string, data: unknown): Promise<unknown>;
    updateVariant(tenantId: string, id: string, data: unknown): Promise<unknown>;
    getProductVariants(tenantId: string, productId: string, supplierId?: string): Promise<unknown>;
    deleteVariant(tenantId: string, variantId: string): Promise<unknown>;
    bulkUpdateMinStock(tenantId: string, updates: unknown): Promise<unknown>;
    getProductCountByCategory(tenantId: string): Promise<unknown>;
    getStats(tenantId: string): Promise<unknown>;
    searchProduct(tenantId: string, q: string): Promise<unknown>;
    printLabel(tenantId: string, data: unknown): Promise<unknown>;
}
