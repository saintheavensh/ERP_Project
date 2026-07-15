/**
 * Re-export shared Category type
 */
export type { Category } from "@repo/shared";

/**
 * Input type for creating a category
 */
export interface CreateCategoryInput {
    name: string;
    description?: string;
    parentId?: string | null;
    variants?: string[];
}

/**
 * Category form data for UI
 */
export interface CategoryFormData {
    id: string | null;
    name: string;
    description: string;
    parentId: string | null;
}

/**
 * Category variant template
 */
export interface CategoryVariantTemplate {
    id: number;
    name: string;
    supplierId?: string;
    categoryId: string;
}
