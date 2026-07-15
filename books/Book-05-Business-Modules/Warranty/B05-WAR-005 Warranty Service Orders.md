# B05-WAR-005

# Warranty Service Orders

## Purpose

Defines operational handling of approved warranty claims.

---

# Business Philosophy

Warranty repairs should follow the same operational controls as standard repairs.

---

# Official Decision

Warranty claims generate:

```text id="wso001"
Warranty Service Orders
```

---

# Workflow

```text id="wso002"
Warranty Claim
↓
Approved
↓
Warranty Service Order
↓
Repair
↓
QC
↓
Close
```

---

# Service Order Types

Supports:

### Normal Service Order

---

### Warranty Service Order

---

# Linked Records

Warranty Service Orders maintain links to:

* Original Service Order
* Original Repair
* Warranty Claim

---

# Cost Handling

Supports:

### Fully Covered

Customer pays nothing.

---

### Partially Covered

Customer pays only non-covered items.

---

### Not Covered

Converted to standard repair.

---

# Inventory Integration

Warranty repairs may consume inventory.

All usage remains traceable.

---

# Technician Integration

Technicians process warranty jobs using normal workflows.

---

# Summary

Warranty Service Orders ensure warranty repairs remain operationally controlled and auditable.

---

# End Of Document
