# B05-PUR-003

# Purchase Order Management

## Purpose

Defines supplier purchase orders and purchasing commitments.

---

# Business Philosophy

Purchase Orders represent official purchasing commitments.

---

# Purchase Order Sources

Generated from:

### Approved Purchase Requests

---

### Direct Purchases

Authorized direct purchasing.

---

# Workflow

```text id="po001"
Approved PR
↓
Purchase Order
↓
Supplier
↓
Receiving
```

---

# Purchase Order Information

Supports:

* Supplier
* Products
* Quantities
* Costs
* Payment Terms

---

# Supplier Integration

Supports:

* Multiple Suppliers
* Preferred Suppliers
* Supplier Recommendations

---

# Purchase Order Status

### Draft

---

### Sent

---

### Partially Received

---

### Fully Received

---

### Closed

---

### Cancelled

---

# Financial Integration

Purchase Orders do not create accounting entries.

Accounting occurs during receiving and payment events.

---

# Audit Trail

Track:

* Creator
* Approver
* Supplier
* Status Changes

---

# Summary

Purchase Orders formalize purchasing commitments with suppliers.

---

# End Of Document
