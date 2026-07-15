/**
 * Barrel export for all product application use cases.
 */

// DTOs
export { ProductDTO } from "./dtos/ProductDTO";
export { CreateProductDTO } from "./dtos/CreateProductDTO";
export { UpdateProductDTO } from "./dtos/UpdateProductDTO";

// Mappers
export { ProductMapper } from "./mappers/ProductMapper";

// Use Cases
export { CreateProductUseCase } from "./use-cases/CreateProductUseCase";
export { GetProductUseCase } from "./use-cases/GetProductUseCase";
export { UpdateProductUseCase } from "./use-cases/UpdateProductUseCase";
export { ActivateProductUseCase } from "./use-cases/ActivateProductUseCase";
export { DeleteProductUseCase } from "./use-cases/DeleteProductUseCase";

// Facades
export { ProductsFacade } from "./facades/ProductsFacade";
