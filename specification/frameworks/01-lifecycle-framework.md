# Lifecycle Framework

## Purpose
Standardize how entities transition between states across all modules.

## Pattern
Every major entity has a **status field** managed by defined lifecycle rules:

```
[Initial State] → [Active States...] → [Terminal State]
```

## Entity Lifecycles

### Service Ticket
```
intake → diagnosis → estimation → customer_approval → repair_in_progress
    → quality_control → completed → closed
    ↳ cancelled (from any non-terminal state)
```

### Inventory Item
```
active → discontinued
    ↳ out_of_stock (system-managed based on stock levels)
```

### Purchase Order
```
draft → submitted → partially_received → fully_received
    ↳ cancelled
```

### POS Transaction
```
draft → finalized → paid → partially_paid
    ↳ voided (requires approval)
```

### Customer
```
new → active → inactive
```

### Warranty Record
```
active → claimed → resolved
    ↳ expired (system-managed based on end_date)
    ↳ voided
```

## Rules
1. All state transitions are logged in the respective history table (append-only)
2. Terminal states (closed, cancelled, expired) are irreversible
3. Flow Engine controls Service Ticket transitions; other entities use simpler state machines
4. Every transition records: who (actor), when, from_state, to_state, reason (optional)
