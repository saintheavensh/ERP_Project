import { BrandRepositoryAdapter } from "./infrastructure";
import {
    GetBrandsUseCase,
    CreateBrandUseCase,
    UpdateBrandUseCase,
    DeleteBrandUseCase
} from "./application";

// Adapters
const brandRepository = new BrandRepositoryAdapter();

// Use Cases
const getBrandsUseCase = new GetBrandsUseCase(brandRepository);
const createBrandUseCase = new CreateBrandUseCase(brandRepository);
const updateBrandUseCase = new UpdateBrandUseCase(brandRepository);
const deleteBrandUseCase = new DeleteBrandUseCase(brandRepository);

import { inventoryAuthority } from "../inventory/inventory-container";
import { TransactionContext } from "../../../shared/types/db-context";

import { Brand } from "./domain";

/**
 * BrandsFacade — Single entry point for the Brands module.
 * Wires internal use cases and provides a clean interface for external layers.
 */
export class BrandsFacade {
    async getAll(tenantId: string, tx?: TransactionContext): Promise<Brand[]> {
        if (tx) {
            return await inventoryAuthority.executeWithExistingTx(tx, { tenantId }, async (currentTx: TransactionContext) => {
                return await getBrandsUseCase.execute(currentTx);
            });
        }
        return await inventoryAuthority.execute({ tenantId }, async (currentTx: TransactionContext) => {
            return await getBrandsUseCase.execute(currentTx);
        });
    }

    async create(tenantId: string, data: any, tx?: TransactionContext): Promise<Brand[]> {
        if (tx) {
            return await inventoryAuthority.executeWithExistingTx(tx, { tenantId }, async (currentTx: TransactionContext) => {
                return await createBrandUseCase.execute(data, currentTx);
            });
        }
        return await inventoryAuthority.execute({ tenantId }, async (currentTx: TransactionContext) => {
            return await createBrandUseCase.execute(data, currentTx);
        });
    }

    async update(tenantId: string, id: string, data: any, tx?: TransactionContext): Promise<Brand[]> {
        if (tx) {
            return await inventoryAuthority.executeWithExistingTx(tx, { tenantId }, async (currentTx: TransactionContext) => {
                return await updateBrandUseCase.execute(id, data, currentTx);
            });
        }
        return await inventoryAuthority.execute({ tenantId }, async (currentTx: TransactionContext) => {
            return await updateBrandUseCase.execute(id, data, currentTx);
        });
    }

    async delete(tenantId: string, id: string, tx?: TransactionContext): Promise<Brand[]> {
        if (tx) {
            return await inventoryAuthority.executeWithExistingTx(tx, { tenantId }, async (currentTx: TransactionContext) => {
                return await deleteBrandUseCase.execute(id, currentTx);
            });
        }
        return await inventoryAuthority.execute({ tenantId }, async (currentTx: TransactionContext) => {
            return await deleteBrandUseCase.execute(id, currentTx);
        });
    }

    // Direct repository access if needed for read operations without complex logic
    async findById(tenantId: string, id: string, tx?: TransactionContext): Promise<Brand | null> {
        if (tx) {
            return await inventoryAuthority.executeWithExistingTx(tx, { tenantId }, async (currentTx: TransactionContext) => {
                return await brandRepository.findById(id, currentTx);
            });
        }
        return await inventoryAuthority.execute({ tenantId }, async (currentTx: TransactionContext) => {
            return await brandRepository.findById(id, currentTx);
        });
    }

    async findByName(tenantId: string, name: string, tx?: TransactionContext): Promise<Brand | null> {
        if (tx) {
            return await inventoryAuthority.executeWithExistingTx(tx, { tenantId }, async (currentTx: TransactionContext) => {
                return await brandRepository.findByName(name, currentTx);
            });
        }
        return await inventoryAuthority.execute({ tenantId }, async (currentTx: TransactionContext) => {
            return await brandRepository.findByName(name, currentTx);
        });
    }
}

/** Singleton instance */
export const brandsFacade = new BrandsFacade();
