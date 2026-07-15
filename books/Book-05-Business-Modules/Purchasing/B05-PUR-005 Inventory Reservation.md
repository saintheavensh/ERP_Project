# B05-PUR-005

# Inventory Reservation Management

## Purpose

Defines reservation of inventory for Service Orders and purchasing-driven allocation.

---

# Business Philosophy

Reserved inventory protects customer commitments.

---

# Reservation Sources

Supports:

### Waiting Parts

---

### Approved Service Orders

---

### Special Customer Orders

---

# Reservation Workflow

```text id="ir001"
Part Received
↓
Reservation Created
↓
Assigned To Service Order
```

---

# Automatic Reservation

Supported.

When a Waiting Parts Purchase Request is fulfilled:

```text id="ir002"
Receiving
↓
Auto Reservation
↓
Service Order
```

---

# Reservation Rules

Reserved inventory:

* Cannot be sold
* Cannot be used by other Service Orders
* Requires authorization for reassignment

---

# Reservation Status

### Reserved

---

### Consumed

---

### Released

---

### Cancelled

---

# Visibility

Visible to:

* Service
* Inventory
* Purchasing

---

# Summary

Inventory Reservation ensures purchased parts reach intended Service Orders.

---

# End Of Document
