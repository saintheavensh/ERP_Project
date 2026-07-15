# Event Framework

## Purpose
Define how business events flow between modules to maintain the single-source-of-truth architecture.

## Architecture

```
[Module Action] → emit(event) → [Event Bus] → [Subscriber 1]
                                             → [Subscriber 2]
                                             → [Subscriber N]
```

## Core Events

| Event | Emitter | Subscribers | Action |
|-------|---------|-------------|--------|
| `ticket.created` | Service | Dashboard | Update ticket count |
| `ticket.transitioned` | Flow Engine | Dashboard, Notification | Update board, notify assigned tech |
| `ticket.completed` | Service | Warranty, POS | Create warranty record, create invoice |
| `parts.reserved` | Service | Inventory | Soft-lock stock |
| `parts.consumed` | Service | Inventory, Finance | Hard deduct stock, post COGS |
| `parts.released` | Service | Inventory | Release soft-lock |
| `payment.received` | POS | Finance | Post revenue to ledger |
| `payment.refunded` | POS | Finance | Post reversal to ledger |
| `stock.low` | Inventory | Dashboard, Notification | Alert: low stock |
| `stock.received` | Inventory | Service (waiting parts) | Notify technicians waiting for parts |
| `po.received` | Purchasing | Inventory | Create FIFO batches |
| `approval.requested` | Any | Notification | Notify approver |
| `approval.decided` | Any | Service/Requester | Proceed or reject flow |

## Rules
1. Events are processed asynchronously (do not block the emitting action)
2. Subscribers must be idempotent (handle duplicate events gracefully)
3. Failed subscriber processing must not affect other subscribers
4. All events include: `tenant_id`, `timestamp`, `actor_id`, `payload`
5. Events can optionally be exposed as webhooks for external integrations (Phase 2)
