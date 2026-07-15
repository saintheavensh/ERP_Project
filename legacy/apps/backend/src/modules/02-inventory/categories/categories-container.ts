import { CategoryRepositoryAdapter } from "./infrastructure";
import {
    GetCategoriesUseCase,
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
    AddVariantTemplateUseCase,
    RemoveVariantTemplateUseCase
} from "./application";

// Adapters
const categoryRepository = new CategoryRepositoryAdapter();

// Use Cases
const getCategoriesUseCase = new GetCategoriesUseCase(categoryRepository);
const createCategoryUseCase = new CreateCategoryUseCase(categoryRepository);
const updateCategoryUseCase = new UpdateCategoryUseCase(categoryRepository);
const deleteCategoryUseCase = new DeleteCategoryUseCase(categoryRepository);
const addVariantTemplateUseCase = new AddVariantTemplateUseCase(categoryRepository);
const removeVariantTemplateUseCase = new RemoveVariantTemplateUseCase(categoryRepository);

import { inventoryAuthority } from "../inventory/inventory-container";
import { TransactionContext } from "../../../shared/types/db-context";

/**
 * CategoriesFacade — Single entry point for the Categories module.
 * Wires internal use cases and provides a clean interface for external layers.
 */
export class CategoriesFacade {
    async getAll(tenantId: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => getCategoriesUseCase.execute(tx)
        );
    }

    async create(tenantId: string, data: any) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => createCategoryUseCase.execute(data, tx)
        );
    }

    async update(tenantId: string, id: string, data: any) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => updateCategoryUseCase.execute(id, data, tx)
        );
    }

    async delete(tenantId: string, id: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => deleteCategoryUseCase.execute(id, tx)
        );
    }

    async addVariantTemplate(tenantId: string, categoryId: string, name: string, supplierId?: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => addVariantTemplateUseCase.execute(categoryId, name, supplierId, tx)
        );
    }

    async removeVariantTemplate(tenantId: string, id: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => removeVariantTemplateUseCase.execute(id, tx)
        );
    }

    async findById(tenantId: string, id: string) {
        return await inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => categoryRepository.findById(id, tx)
        );
    }
}

/** Singleton instance */
export const categoriesFacade = new CategoriesFacade();
