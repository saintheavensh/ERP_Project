# B05-PUR-004

# Goods Receiving Management

## Purpose

Defines receiving processes, partial receiving, backorder tracking, inventory updates, and receiving verification.

---

# Business Philosophy

Receiving confirms what actually arrives, not what was ordered.

Inventory and financial records must be based on received quantities.

---

# Receiving Workflow

```text id="gr001"
Purchase Order
↓
Goods Arrive
↓
Verification
↓
Receiving
↓
Inventory Update
```

---

# Receiving Types

### Full Receiving

Entire order received.

---

### Partial Receiving

Only part of the order received.

Supported.

---

# Partial Receiving Example

```text id="gr002"
Ordered = 100
Received = 60
Outstanding = 40
```

---

# Backorder Management

Outstanding quantities automatically become:

```text id="gr003"
Backorder
```

until:

* Received
* Cancelled
* Closed

---

# Receiving Information

Supports:

* Supplier
* Product
* Ordered Qty
* Received Qty
* Outstanding Qty
* Receiving Date
* Receiver

---

# Inventory Integration

Only received quantities update inventory.

---

# Finance Integration

Only received quantities may generate payable obligations.

---

# Receiving Status

### Pending

---

### Partially Received

---

### Fully Received

---

### Closed

---

# Audit Trail

Track:

* Receiver
* Date
* Quantities
* Notes

---

# Summary

Goods Receiving ensures inventory and financial accuracy through verified receiving processes.

---

# End Of Document
