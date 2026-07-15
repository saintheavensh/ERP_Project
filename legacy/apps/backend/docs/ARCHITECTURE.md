# Project Architecture

## Clean Architecture Layers

### Domain Layer (`src/*/domain/`)
- Entities with business logic
- Value Objects
- Repository interfaces (ports)
- Domain services
- Domain events

### Application Layer (`src/*/application/`)
- Use cases (orchestration)
- DTOs
- Facades (module entry points)
- Mappers

### Infrastructure Layer (`src/*/infrastructure/`)
- Repository implementations
- External API adapters
- Database schemas
- Caching services

### Presentation Layer (`src/*/presentation/`)
- Controllers
- Routes
- Request/Response schemas
- API documentation

## Module Structure
Each module follows this structure:

```text
module/
├── domain/
│   ├── entities/
│   ├── value-objects/
│   ├── ports/
│   └── services/
├── application/
│   ├── dtos/
│   ├── use-cases/
│   └── facades/
├── infrastructure/
│   ├── persistence/
│   └── adapters/
└── presentation/
    ├── controllers/
    └── routes/
```

## Cross-Module Communication
- Use **Facades** for synchronous calls
- Use **Domain Events** for asynchronous communication
- All cross-module dependencies go through interfaces (ports)

## Error Handling
- All use cases return `Result<T>` type
- Controllers map errors to HTTP responses
- Standard error codes for common scenarios
