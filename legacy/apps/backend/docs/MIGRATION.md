# Migration Guide: Legacy to Clean Architecture

## Overview
This guide helps developers migrate legacy code to the new Clean Architecture structure.

## Key Changes
1. **Services → Use Cases**: Business logic moved from services to use cases
2. **Direct Imports → Facades**: Cross-module calls now use facades
3. **Schema Centralization → Module Schemas**: Each module owns its schema
4. **Error Strings → Domain Errors**: Standardized error handling

## Migration Steps

### Step 1: Identify Component
Find the legacy component you need to migrate:
- Is it a service? → Create use cases
- Is it a controller? → Move to presentation layer
- Is it a model? → Create domain entity

### Step 2: Create Domain Entity
```typescript
// Legacy model
interface Product {
    id: string;
    name: string;
    price: number;
}

// New domain entity
export class Product extends Entity<ProductProps> {
    // Business logic here
}
```

### Step 3: Create Repository Interface
```typescript
export interface IProductRepository {
    findById(id: string): Promise<Result<Product>>;
    save(product: Product): Promise<Result<void>>;
}
```

### Step 4: Implement Use Case
```typescript
export class GetProductUseCase {
    constructor(
        @inject(TYPES.IProductRepository) private repo: IProductRepository
    ) {}

    async execute(id: string): Promise<Result<ProductDTO>> {
        // Orchestration logic
        const productOrError = await this.repo.findById(id);
        if (productOrError.isFailure) return Result.fail(productOrError.errorValue());
        
        return Result.ok(ProductMapper.toDTO(productOrError.getValue()));
    }
}
```

### Step 5: Add to Container
```typescript
bind<IProductRepository>(TYPES.IProductRepository).to(DrizzleProductRepository);
bind<GetProductUseCase>(GetProductUseCase).toSelf();
```

## Common Pitfalls
- ❌ Don't put business logic in use cases. Use cases should orchestrate.
- ❌ Don't import infrastructure dependencies directly in the domain layer.
- ❌ Don't use strings for domain errors, return objects or wrapped DomainError instances.
- ✅ Use the `Result` type wrapper for all predictable operations.
- ✅ Ensure you `inject` all dependencies.
