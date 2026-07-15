// Categories Feature Module
export { CategoriesController } from "./categories.controller.svelte";
export { CategoriesService } from "./categories.service";
export type { CreateCategoryInput } from "./categories.service";
export type { Category, CategoryFormData, CategoryVariantTemplate } from "./categories.types";

// Components
export { default as CategoryDialog } from "./components/CategoryDialog.svelte";
export { default as CategoryHeader } from "./components/CategoryHeader.svelte";
export { default as CategoryList } from "./components/CategoryList.svelte";

