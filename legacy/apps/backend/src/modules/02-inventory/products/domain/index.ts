// Entities
export { Product } from "./entities/Product.entity";

// Value Objects
export { Price } from "./value-objects/Price.vo";
export { Sku } from "./value-objects/Sku.vo";
export { ProductStatus, Status } from "./value-objects/ProductStatus.vo";

// Services
export { ProductValidationService } from "./services/ProductValidationService";

// Ports
export type { IProductRepository } from "./ports/IProductRepository";
export type { IInventoryGateway } from "./ports/IInventoryGateway";
