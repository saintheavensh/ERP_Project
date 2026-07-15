# B05-TECH-007

# External Purchase Workflow

## Purpose

Defines technician-driven spare part purchases outside normal purchasing channels.

---

# Business Philosophy

In repair businesses, urgent spare parts may need to be sourced from nearby suppliers or partner stores.

The system must support this workflow while maintaining inventory and financial accuracy.

---

# Supported Scenarios

Examples:

* Emergency Repair
* Same-Day Repair
* Rare Spare Part
* Local Supplier Purchase

---

# Workflow

```text id="ep001"
Service Order
↓
Waiting Parts
↓
Technician Finds Part
↓
External Purchase
↓
Part Received
↓
Repair Continues
```

---

# Purchase Sources

Supports:

### Nearby Repair Shops

---

### Local Suppliers

---

### Marketplace Sellers

---

### Partner Stores

---

# Required Information

Supports:

* Service Order
* Spare Part
* Quantity
* Supplier Name
* Purchase Cost
* Receipt Image
* Notes

---

# Inventory Integration

Purchased parts must enter inventory.

---

# Inventory Workflow

```text id="ep002"
External Purchase
↓
Temporary Receiving
↓
Reserved Inventory
↓
Service Order Usage
```

---

# Financial Integration

Connected to:

* Expense Management
* Reimbursement
* Purchasing History

---

# Audit Trail

Track:

* Technician
* Supplier
* Amount
* Service Order
* Date

---

# Summary

External Purchase Workflow supports urgent technician purchases while preserving inventory and financial control.

---

# End Of Document
