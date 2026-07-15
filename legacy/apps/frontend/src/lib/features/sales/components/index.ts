// Sales Feature Module
export { SalesController } from "./sales.controller.svelte";
export { SalesService } from "./sales.service";
export type {
    CartItem,
    PaymentEntry,
    CreateSaleInput,
    CreateSaleResponse,
    SalesProduct,
    SalesProductVariant,
} from "./sales.types";

// Submodules
export * from "./customers";
export * from "./purchases";

// Components
export { default as PaymentDialog } from "./PaymentDialog.svelte";
export { default as ProductCard } from "./ProductCard.svelte";
export { default as ProductCatalog } from "./ProductCatalog.svelte";
export { default as SalesCart } from "./SalesCart.svelte";
export { default as SalesHeader } from "./SalesHeader.svelte";


