# API Documentation

## Base URL
- Development: `http://localhost:3000/api`
- Production: `https://api.coba.com/api`

## Authentication
Most endpoints require authentication using a JWT token in the Authorization header:
```text
Authorization: Bearer <your-jwt-token>
```

## Error Handling
All errors follow a consistent format:
```json
{
    "error": "Human readable error message or code"
}
```
Validation errors using Zod typically attach field issues implicitly or return `400 Bad Request`.

## Modules

### Products Module
Base path: `/products`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get paginated products | No |
| GET | `/{id}` | Get product by ID | No |
| GET | `/stats` | Get product statistics | No |
| POST | `/` | Create product | Yes (inventory.manage) |
| PUT | `/{id}` | Update product | Yes (inventory.manage) |
| DELETE | `/{id}` | Delete product | Yes (inventory.manage) |
| GET | `/searchproduct` | Search query param `?q=` | Yes |
| GET | `/{id}/variants` | Get variants for product | No |
| POST | `/variants` | Create variant | Yes (inventory.manage) |
| PUT | `/variants/{id}` | Update variant | Yes (inventory.manage) |
| DELETE | `/variants/{id}` | Delete variant | Yes (inventory.manage) |

[Continue for other modules like Auth, Orders, etc...]

## Pagination
List endpoints typically inherit search parameters but handle pagination as dictated by the request context.
Supported standard URL query params:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `sortBy`: Field to sort by
- `sortOrder`: `asc` or `desc`

Response format:
```json
{
    "data": [...],
    "meta": {
        "page": 1,
        "limit": 20,
        "totalItems": 100,
        "totalPages": 5,
        "hasNext": true,
        "hasPrev": false
    }
}
```

## OpenAPI UI
Live interactive documentation is accessible at the `/api-docs` path.
