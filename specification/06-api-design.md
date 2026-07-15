# API Design Principles

> This document defines **high-level principles & contracts**, not a full OpenAPI spec. All AI agents must follow these rules from day one.

## General Principles

1. **RESTful, resource-based** — `/v1/tickets`, `/v1/inventory-items`, `/v1/purchase-orders`. Non-CRUD actions use sub-resources: `POST /v1/tickets/{id}/transition`.
2. **Tenant scoping via token, not URL/body** — `tenant_id` is extracted from JWT claim, NEVER trusted from client-sent parameters.
3. **Explicit versioning** — prefix `/v1/...` from the start.
4. **Consistent response envelope** — see Response Format section below.
5. **Idempotency for critical actions** — endpoints like "consume part" or "collect payment" MUST accept `Idempotency-Key` header.
6. **Consistent pagination** — cursor-based for high-volume list endpoints.

## Response Envelope

**ALL API responses MUST use this structure. No exceptions.**

```typescript
interface ApiResponse<T> {
  data: T | null;
  meta: {
    request_id: string;
    timestamp: string;
    next_cursor?: string;    // pagination
    has_more?: boolean;       // pagination
  };
  error: {
    code: string;
    message: string;
    details?: unknown[];
  } | null;
}
```

## Core Endpoints

| Method | Endpoint | Function |
|--------|----------|----------|
| `POST` | `/v1/tickets` | Create new Service Ticket (Intake) |
| `POST` | `/v1/tickets/{id}/transition` | Move to next node (with Transition Rule + permission validation) |
| `GET` | `/v1/tickets/{id}` | Ticket detail + current stage + cost breakdown |
| `POST` | `/v1/tickets/{id}/approval-requests` | Send approval request to customer |
| `POST` | `/v1/inventory-items/{id}/reserve` | Reserve stock for ticket/POS |
| `POST` | `/v1/inventory-items/{id}/consume` | Consume/deduct stock (hard deduction) |
| `POST` | `/v1/purchase-orders` | Create new PO |
| `POST` | `/v1/pos-transactions` | Create POS transaction (linked or standalone) |
| `POST` | `/v1/pos-transactions/{id}/payments` | Record payment (partial/full) |
| `GET` | `/v1/finance/reports/job-costing` | Per-ticket margin report |
| `GET/POST` | `/v1/flow-templates` | Manage Flow Templates (admin) |
| `GET/POST` | `/v1/roles`, `/v1/permissions` | Manage RBAC |

## Example Payload: Ticket Stage Transition

**Request:**
```json
POST /v1/tickets/TCK-00123/transition
{
  "to_node": "customer_approval",
  "actor_id": "usr_456",
  "notes": "Estimated cost $350, waiting for customer approval"
}
```

**Response:**
```json
{
  "data": {
    "ticket_id": "TCK-00123",
    "current_node": "customer_approval",
    "events_emitted": ["approval.requested"]
  },
  "meta": { "request_id": "req_789", "timestamp": "2026-07-15T12:00:00Z" },
  "error": null
}
```

## HTTP Status Codes

| Code | When to Use |
|------|-------------|
| `200` | Successful GET, PATCH |
| `201` | Successful POST (resource created) |
| `204` | Successful DELETE (no content) |
| `400` | Malformed request / Zod validation failure |
| `401` | Missing or invalid JWT token |
| `403` | Valid token but insufficient permission (include which permission is missing) |
| `404` | Resource not found |
| `409` | State conflict (e.g., invalid stage transition) |
| `422` | Business rule violation (e.g., insufficient stock) |
| `500` | Unexpected server error |

## Error Response Example

```json
{
  "data": null,
  "meta": { "request_id": "req_789", "timestamp": "2026-07-15T12:00:00Z" },
  "error": {
    "code": "TRANSITION_NOT_ALLOWED",
    "message": "Cannot transition to this stage from current stage"
  }
}
```

## Webhook/Event Contract (External Integrations)

Every internal event can be exposed as a webhook to third-party systems:

```json
{
  "event": "parts.consumed",
  "tenant_id": "tnt_001",
  "occurred_at": "2026-07-15T10:15:00Z",
  "payload": {
    "ticket_id": "TCK-00123",
    "inventory_item_id": "ITM-778",
    "quantity": 1,
    "cost_basis": 85000
  }
}
```

## Rules for AI Agents

- Always use the response envelope defined above.
- Never return a different JSON structure per endpoint.
- Permission check failures MUST return 403 with the specific permission code that's missing.
