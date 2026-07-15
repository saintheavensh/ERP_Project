# Products Module

## Overview
Manages product catalog including CRUD operations, status management, and product categorization.

## Domain Entities
- **Product**: Core product entity with business rules
- **Price**: Value object for monetary values (integer-based)
- **Sku**: Value object for SKU validation
- **ProductStatus**: Enum for product lifecycle (DRAFT, ACTIVE, INACTIVE)

## Available Facades
```typescript
interface ProductsFacade {
    createProduct(dto: CreateProductDTO): Promise<Result<ProductDTO>>;
    getProductById(id: string): Promise<Result<ProductDTO>>;
    getProductBySku(sku: string): Promise<Result<ProductDTO>>;
    updateProduct(id: string, dto: UpdateProductDTO): Promise<Result<ProductDTO>>;
    deleteProduct(id: string): Promise<Result<boolean>>;
    activateProduct(id: string): Promise<Result<ProductDTO>>;
    deactivateProduct(id: string): Promise<Result<ProductDTO>>;
}
```

## Database Schema
Tables:
- `products`: Main product data
- `product_variants`: Product variations
- `product_batches`: Stock batches for FIFO

## Events Published
- `ProductCreated`: When new product is created
- `ProductUpdated`: When product is modified
- `ProductDeleted`: When product is deleted
- `ProductActivated`: When product status becomes ACTIVE

## Dependencies
- `Categories` module (for category validation)
- `Inventory` module (for stock tracking)

## Testing
```bash
# Run unit tests
bun test src/modules/products/domain

# Run integration tests
bun test src/modules/products/infrastructure

# Run all product tests
bun test src/modules/products
```

## Example Usage
```typescript
import { productsFacade } from './products-container';

// Create a product
const result = await productsFacade.createProduct({
    sku: "SKU-123",
    name: "Sample Product",
    price: 10000,
    categoryId: "uuid"
});

if (result.isSuccess) {
    console.log('Product created:', result.getValue());
}
```
