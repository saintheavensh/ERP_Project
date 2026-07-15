import { TransactionContext } from "../../../../../shared/types/db-context";

export interface CategoryEntity {
    id: string;
    name: string;
    description?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CreateCategoryInput {
    id?: string;
    name: string;
    description?: string | null;
    parentId?: string | null;
}

export interface UpdateCategoryInput {
    name?: string;
    description?: string | null;
}

export interface VariantTemplateEntity {
    id: string;
    categoryId: string;
    name: string;
    supplierId?: string | null;
}

export interface ICategoryRepository {
    findAll(tx: TransactionContext): Promise<CategoryEntity[]>;
    findById(id: string, tx: TransactionContext): Promise<CategoryEntity | null>;
    create(data: CreateCategoryInput, tx: TransactionContext): Promise<CategoryEntity>;
    update(id: string, data: UpdateCategoryInput, tx: TransactionContext): Promise<CategoryEntity>;
    delete(id: string, tx: TransactionContext): Promise<void>;

    // Variant Template Operations
    addVariantTemplate(categoryId: string, name: string, tx: TransactionContext, supplierId?: string): Promise<VariantTemplateEntity>;
    removeVariantTemplate(id: string, tx: TransactionContext): Promise<void>;
    propagateVariantToProducts(categoryId: string, variantName: string, tx: TransactionContext, supplierId?: string): Promise<void>;
}
