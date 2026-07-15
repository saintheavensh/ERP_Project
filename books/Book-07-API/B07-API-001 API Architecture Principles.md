---
document_id: B07-API-001
title: API Architecture Principles
version: 1.0.0
last_updated: 2026-07-04
author: Universal Service ERP Team
---

# API Architecture Principles

## Purpose
This document outlines the core technical standards for all Backend Endpoints. The API must be built using **Hono** as the web framework, **Zod** for request validation, and strict **TypeScript** for type safety.

---

# 1. Standardized JSON Response

All endpoints MUST return a consistent JSON structure. This prevents the Frontend from having to guess the response shape.

## Success Response
```typescript
{
  "success": true,
  "data": { ... }, // Payload
  "message": "Optional success message"
}
```

## Error Response
```typescript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR", // e.g., NOT_FOUND, UNAUTHORIZED
    "details": [ ... ] // Array of specific Zod errors
  },
  "message": "Human readable error message"
}
```

---

# 2. Input Validation (Zod)

Every `POST`, `PUT`, or `PATCH` request MUST be validated using Zod middleware before reaching the controller logic. 
* Never trust client data.
* Never manually parse body fields without a Zod schema.

**Example Zod Schema (Hono standard):**
```typescript
const CreateCustomerSchema = z.object({
  full_name: z.string().min(3),
  phone: z.string().optional(),
  email: z.string().email().optional()
});
```

---

# 3. HTTP Methods & Status Codes

* `GET`: Retrieve data (200 OK)
* `POST`: Create a new record (201 Created)
* `PUT`: Completely replace a record (200 OK)
* `PATCH`: Partially update a record (200 OK)
* `DELETE`: Soft-delete a record (200 OK)

*Note: Physical deletion is prohibited as per business rules. `DELETE` methods actually perform a `PATCH` under the hood to set `deleted_at`.*
