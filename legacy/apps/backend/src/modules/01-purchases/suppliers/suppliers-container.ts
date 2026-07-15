import { TransactionContext } from "../../../shared/types/db-context";
import { inventoryAuthority } from "../../02-inventory/inventory/inventory-container";
import { SupplierRepositoryAdapter } from "./infrastructure";
import {
    GetSuppliersUseCase,
    CreateSupplierUseCase,
    UpdateSupplierUseCase,
    DeleteSupplierUseCase,
    LinkCategoryUseCase,
    UnlinkCategoryUseCase,
    GetSupplierCategoriesUseCase,
    GetMappedProductVariantsUseCase,
    MapProductVariantUseCase,
    UnmapProductVariantUseCase
} from "./application";

// Adapters
const supplierRepository = new SupplierRepositoryAdapter();

// Use Cases
const getSuppliersUC = new GetSuppliersUseCase(supplierRepository);
const createSupplierUC = new CreateSupplierUseCase(supplierRepository);
const updateSupplierUC = new UpdateSupplierUseCase(supplierRepository);
const deleteSupplierUC = new DeleteSupplierUseCase(supplierRepository);
const linkCategoryUC = new LinkCategoryUseCase(supplierRepository);
const unlinkCategoryUC = new UnlinkCategoryUseCase(supplierRepository);
const getSupplierCategoriesUC = new GetSupplierCategoriesUseCase(supplierRepository);
const getMappedProductVariantsUC = new GetMappedProductVariantsUseCase(supplierRepository);
const mapProductVariantUC = new MapProductVariantUseCase(supplierRepository);
const unmapProductVariantUC = new UnmapProductVariantUseCase(supplierRepository);

/**
 * SuppliersService — Facade for external and presentation layers.
 */
export class SuppliersFacade {
    async getAll(tenantId: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getSuppliersUC.execute(tenantId, tx)
        );
    }

    async getLinkedCategories(tenantId: string, supplierId: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getSupplierCategoriesUC.execute(tenantId, supplierId, tx)
        );
    }

    async create(tenantId: string, data: any) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await createSupplierUC.execute(tenantId, data, tx)
        );
    }

    async update(tenantId: string, id: string, data: any) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await updateSupplierUC.execute(tenantId, id, data, tx)
        );
    }

    async delete(tenantId: string, id: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await deleteSupplierUC.execute(tenantId, id, tx)
        );
    }

    async linkCategory(tenantId: string, supplierId: string, categoryId: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await linkCategoryUC.execute(tenantId, supplierId, categoryId, tx)
        );
    }

    async unlinkCategory(tenantId: string, supplierId: string, categoryId: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await unlinkCategoryUC.execute(tenantId, supplierId, categoryId, tx)
        );
    }

    async getMappedProductVariants(tenantId: string, supplierId: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await getMappedProductVariantsUC.execute(tenantId, supplierId, tx)
        );
    }

    async mapProductVariant(tenantId: string, supplierId: string, productId: string, variantId?: string | null) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await mapProductVariantUC.execute(tenantId, supplierId, productId, variantId, tx)
        );
    }

    async unmapProductVariant(tenantId: string, supplierId: string, productId: string, variantId?: string | null) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => await unmapProductVariantUC.execute(tenantId, supplierId, productId, variantId, tx)
        );
    }
}

/** Singleton instance */
export const suppliersFacade = new SuppliersFacade();

export {
    getSuppliersUC,
    createSupplierUC,
    updateSupplierUC,
    deleteSupplierUC,
    linkCategoryUC,
    unlinkCategoryUC,
    getSupplierCategoriesUC,
    getMappedProductVariantsUC,
    mapProductVariantUC,
    unmapProductVariantUC
};
