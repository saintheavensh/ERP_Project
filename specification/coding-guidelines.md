# Coding Guidelines & Standards

> **MANDATORY RULE:** All AI Agents MUST adhere strictly to these guidelines.
> Do not guess, do not hallucinate, and do not use alternative architectural patterns.
> If a decision is already documented in `specification/`, follow it — do not override.
> Consistency across agents is the highest priority.

---

## 1. Naming Conventions

| What | Convention | Example |
|------|-----------|---------|
| Files & Directories | `kebab-case` | `service-tickets.ts`, `flow-engine/` |
| Variables & Functions | `camelCase` | `getUserById`, `ticketStatus` |
| Types, Interfaces, Enums | `PascalCase` | `ServiceTicket`, `FlowTemplate` |
| Global Constants | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT`, `DEFAULT_PAGE_SIZE` |
| Database Tables | `snake_case` (plural) | `service_tickets`, `inventory_items` |
| Database Columns | `snake_case` | `created_at`, `tenant_id` |
| API Route Paths | `kebab-case` (plural, resource-based) | `/v1/service-tickets`, `/v1/purchase-orders` |
| Environment Variables | `UPPER_SNAKE_CASE` | `DATABASE_URL`, `JWT_SECRET` |

---

## 2. Project Architecture (Modular)

All business logic MUST be isolated within its respective domain module.
Do not dump everything into a single massive file.
Do not create arbitrary folder structures — follow this exact layout.

### Backend Structure (Hono)

```text
flowserv-api/
├─ src/
│  ├─ db/
│  │  ├─ schema.ts          # Drizzle schema (single source of truth for DB)
│  │  ├─ connection.ts      # Database connection setup
│  │  └─ seed.ts            # Seed data for development
│  ├─ middleware/
│  │  ├─ auth.ts            # JWT verification, extract tenant_id
│  │  ├─ rbac.ts            # requirePermission('ticket.approve_quote')
│  │  ├─ tenant-scope.ts    # Auto-filter queries by tenant_id
│  │  ├─ audit.ts           # Record all mutations to audit_logs
│  │  └─ error-handler.ts   # Global error handler (standardized response)
│  ├─ modules/
│  │  ├─ tickets/
│  │  │  ├─ routes.ts       # Hono route definitions (thin — delegate to service)
│  │  │  ├─ service.ts      # Business logic (testable, no HTTP concerns)
│  │  │  └─ types.ts        # Zod schemas + TypeScript types for this module
│  │  ├─ inventory/
│  │  │  ├─ routes.ts
│  │  │  ├─ service.ts
│  │  │  └─ types.ts
│  │  ├─ pos/
│  │  ├─ finance/
│  │  ├─ customers/
│  │  ├─ devices/
│  │  ├─ suppliers/
│  │  ├─ purchasing/
│  │  ├─ warranty/
│  │  └─ rbac/
│  ├─ flow-engine/
│  │  ├─ engine.ts          # Core: validate transitions, emit events
│  │  ├─ types.ts           # FlowTemplate, FlowNode, FlowTransition types
│  │  └─ events.ts          # Event bus (internal pub/sub)
│  ├─ lib/
│  │  ├─ response.ts        # Standardized API response helper
│  │  ├─ pagination.ts      # Cursor-based pagination helper
│  │  └─ idempotency.ts     # Idempotency-Key handling
│  └─ index.ts              # Entry point — mount all module routers
├─ drizzle.config.ts
├─ package.json
└─ tsconfig.json
```

### Frontend Structure (SvelteKit)

```text
flowserv-web/
├─ src/
│  ├─ lib/
│  │  ├─ components/        # Reusable UI components (shadcn-svelte)
│  │  │  ├─ ui/             # Base UI primitives (button, input, dialog)
│  │  │  └─ domain/         # Domain-specific components (ticket-card, stock-badge)
│  │  ├─ stores/            # Svelte stores (state management)
│  │  └─ api/               # Typed API clients (one file per module)
│  │     ├─ client.ts       # Base fetch wrapper with auth headers
│  │     ├─ tickets.ts      # Ticket API functions
│  │     └─ inventory.ts    # Inventory API functions
│  └─ routes/               # Pages grouped by domain
│     ├─ (auth)/            # Login, register (no sidebar)
│     ├─ (app)/             # Authenticated pages (with sidebar)
│     │  ├─ dashboard/
│     │  ├─ tickets/
│     │  ├─ inventory/
│     │  ├─ pos/
│     │  ├─ finance/
│     │  └─ admin/
│     │     ├─ flow-templates/
│     │     └─ roles/
│     └─ portal/            # Customer portal (magic link, no sidebar)
```

---

## 3. API Design Standards

> These rules are derived from `docs/09-api-design.md` and are **FINAL decisions**.

### 3.1 RESTful Resource-Based Routes

```text
GET    /v1/tickets              → List (with pagination)
POST   /v1/tickets              → Create
GET    /v1/tickets/:id          → Get detail
PATCH  /v1/tickets/:id          → Update
POST   /v1/tickets/:id/transition  → State transition (non-CRUD action = sub-resource)
```

- Always use `/v1/` prefix.
- Resource names are **plural** and **kebab-case**.
- Non-CRUD actions use sub-resources, not verbs in the URL.

### 3.2 Standardized Response Envelope

**ALL responses MUST use this envelope. No exceptions.**

```typescript
// src/lib/response.ts

interface ApiResponse<T> {
  data: T | null;
  meta: {
    request_id: string;
    timestamp: string;
  };
  error: {
    code: string;
    message: string;
    details?: unknown[];
  } | null;
}
```

**Success example:**
```json
{
  "data": { "ticket_id": "TCK-00123", "current_node": "diagnosis" },
  "meta": { "request_id": "req_abc123", "timestamp": "2026-07-15T12:00:00Z" },
  "error": null
}
```

**Error example:**
```json
{
  "data": null,
  "meta": { "request_id": "req_abc123", "timestamp": "2026-07-15T12:00:00Z" },
  "error": { "code": "TRANSITION_NOT_ALLOWED", "message": "Cannot transition from current stage" }
}
```

### 3.3 HTTP Status Codes (Strict Mapping)

| Code | When to use |
|------|-------------|
| `200` | Successful GET, PATCH |
| `201` | Successful POST (resource created) |
| `204` | Successful DELETE (no content) |
| `400` | Malformed request / validation failure (Zod) |
| `401` | Missing or invalid JWT token |
| `403` | Valid token but insufficient permission (include which permission is missing) |
| `404` | Resource not found |
| `409` | State conflict (e.g., trying to transition to an invalid stage) |
| `422` | Business rule violation (e.g., insufficient stock) |
| `500` | Unexpected server error |

### 3.4 Idempotency

Critical mutation endpoints MUST accept an `Idempotency-Key` header to prevent double execution on network retry:
- `POST /v1/inventory-items/:id/consume` (stock deduction)
- `POST /v1/pos-transactions/:id/payments` (payment)
- `POST /v1/tickets/:id/transition` (state change)

### 3.5 Pagination (Cursor-Based)

For list endpoints with potentially large results, use cursor-based pagination:

```json
{
  "data": [...],
  "meta": {
    "request_id": "req_abc",
    "timestamp": "...",
    "next_cursor": "eyJpZCI6MTAwfQ==",
    "has_more": true
  },
  "error": null
}
```

Request: `GET /v1/stock-movements?cursor=eyJpZCI6MTAwfQ==&limit=50`

### 3.6 Tenant Scoping

- `tenant_id` is ALWAYS extracted from JWT claim — **NEVER** from request body or URL params.
- Every database query MUST include tenant_id filter.
- Response must never contain data from another tenant.

---

## 4. Validation (Strict Schema)

- Use `Zod` for EVERY endpoint input. Never trust client input.
- Use `drizzle-zod` to auto-generate Zod schemas from Drizzle schema (Single Source of Truth).
- Do NOT write manual `if (!req.body.name)` checks. Let Zod handle it.

**Pattern for each module's `types.ts`:**

```typescript
// modules/tickets/types.ts
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { serviceTickets } from '../../db/schema';
import { z } from 'zod';

// Auto-generated from DB schema
export const insertTicketSchema = createInsertSchema(serviceTickets);
export const selectTicketSchema = createSelectSchema(serviceTickets);

// Custom schemas for specific endpoints
export const createTicketInput = insertTicketSchema.pick({
  customerId: true,
  deviceId: true,
  reportedComplaint: true,
}).extend({
  branchId: z.string().uuid(),
});

export type CreateTicketInput = z.infer<typeof createTicketInput>;
```

**Pattern for route validation:**

```typescript
// modules/tickets/routes.ts
import { zValidator } from '@hono/zod-validator';
import { createTicketInput } from './types';

app.post('/v1/tickets',
  authMiddleware,
  requirePermission('ticket.create'),
  zValidator('json', createTicketInput),
  async (c) => {
    const input = c.req.valid('json');
    const tenantId = c.get('tenantId'); // from auth middleware
    const result = await ticketService.create(tenantId, input);
    return c.json(successResponse(result), 201);
  }
);
```

---

## 5. Database & Integrity

- **Relational Integrity:** Prioritize Foreign Keys. Do not rely solely on application logic.
- **Multi-Tenancy:** EVERY query MUST include `where(eq(table.tenantId, currentTenantId))`. Never leak data across tenants.
- **Atomic Transactions:** For multi-table operations (e.g., creating a ticket AND reserving stock), wrap in `db.transaction()`. If one fails, everything rolls back.
- **No ORM Magic:** Use Drizzle. Write queries that clearly map to standard SQL.
- **Schema changes:** Use `npx drizzle-kit push` during development. No migration files until production.

---

## 6. Module File Responsibilities

Each module has exactly 3 files. Do not add more without good reason.

| File | Responsibility | Depends On |
|------|---------------|------------|
| `routes.ts` | HTTP layer: parse request, call service, return response | `service.ts`, `types.ts`, middleware |
| `service.ts` | Business logic: validation, DB queries, event emission | `types.ts`, `db/schema.ts`, `flow-engine/` |
| `types.ts` | Zod schemas + TypeScript types for this module | `db/schema.ts` |

**Rules:**
- `routes.ts` must be **thin** — no business logic, only delegation to `service.ts`.
- `service.ts` must be **testable** — no HTTP imports, receives plain typed arguments.
- `types.ts` must derive from Drizzle schema where possible.

---

## 7. Import Conventions

```typescript
// 1. External packages first
import { Hono } from 'hono';
import { z } from 'zod';

// 2. Internal shared modules (middleware, lib, db)
import { authMiddleware } from '../../middleware/auth';
import { db } from '../../db/connection';

// 3. Module-local imports last
import { ticketService } from './service';
import { createTicketInput } from './types';
```

- Use relative imports within the project.
- Group imports by: external → shared internal → local.
- No circular imports between modules. If two modules need each other, use the event bus.

---

## 8. Error Handling

- Use a global error handler middleware (`src/middleware/error-handler.ts`).
- Business logic in `service.ts` should throw typed errors:

```typescript
// Example custom error
export class BusinessError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 422,
    public details?: unknown[]
  ) {
    super(message);
  }
}

// Usage in service.ts
throw new BusinessError('INSUFFICIENT_STOCK', 'Not enough stock for this item', 422);
throw new BusinessError('TRANSITION_NOT_ALLOWED', 'Cannot move to this stage', 409);
```

- The global error handler catches these and formats them into the standard envelope.

---

## 9. Testing Standards

### Test File Location
Tests live next to the code they test:
```text
modules/tickets/
├─ routes.ts
├─ service.ts
├─ types.ts
└─ __tests__/
   ├─ service.test.ts    # Unit tests for business logic
   └─ routes.test.ts     # Integration tests for API endpoints
```

### What MUST be tested
- **Flow Engine:** Every transition rule, invalid transitions, permission checks.
- **FIFO Batch Logic:** Batch splitting, consumption order, cost calculation.
- **Finance Ledger:** COGS posting accuracy, margin calculation.
- **RBAC:** 403 on unauthorized access, tenant isolation.

### Test Pattern
```typescript
import { describe, it, expect } from 'vitest';
import { ticketService } from '../service';

describe('ticketService.create', () => {
  it('should create a ticket with valid input', async () => {
    // Arrange
    const input = { customerId: '...', deviceId: '...', reportedComplaint: 'LCD Blank' };
    // Act
    const result = await ticketService.create('tenant-1', input);
    // Assert
    expect(result.ticketId).toBeDefined();
    expect(result.currentNode).toBe('intake');
  });

  it('should reject if customer does not belong to tenant', async () => {
    // ...
  });
});
```

---

## 10. Incremental Coding & Logic Explanation

- **Incremental Edits:** When modifying existing files, use targeted edits. Do NOT rewrite the entire file unless building from scratch.
- **Explain Complex Logic:** For complex algorithms (FIFO batch calculation, Flow Engine transition validation, commission calculation), include 1-2 lines of comments explaining the **WHY**, not just the how.

```typescript
// FIFO: consume oldest batch first to ensure accurate COGS per supplier
const batches = await db.query.inventoryBatches.findMany({
  where: eq(inventoryBatches.itemId, itemId),
  orderBy: asc(inventoryBatches.receivedAt), // oldest first = FIFO
});
```

---

## 11. Verification Checklist (Run After Every Feature)

After writing any code or completing any feature, the AI Agent MUST verify:

- [ ] **Compiles?** — Does TypeScript compile without errors?
- [ ] **Tenant filter?** — Does every DB query include `tenantId` filter?
- [ ] **Validation?** — Is input validated with Zod before reaching business logic?
- [ ] **Error handling?** — Are error cases handled? (not found, unauthorized, invalid state)
- [ ] **Response format?** — Does the response match `{ data, meta, error }` envelope?
- [ ] **Tests?** — Do existing tests still pass? Are new tests needed?
- [ ] **Idempotency?** — For critical mutations, is `Idempotency-Key` supported?
- [ ] **No hardcoded values?** — Are magic strings/numbers extracted to constants or config?
- [ ] **PHASES.md updated?** — Is the completed task marked `[x]`?
