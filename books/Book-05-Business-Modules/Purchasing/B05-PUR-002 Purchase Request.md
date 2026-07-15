# B05-PUR-002

# Purchase Request Management

## Purpose

Defines purchase request creation, approval, and purchasing demand management.

---

# Business Philosophy

Purchase Requests represent demand, not purchases.

---

# Purchase Request Sources

Supports:

### Waiting Parts

Generated from Service Orders.

---

### Inventory Replenishment

Generated from stock requirements.

---

### Manual Request

Created by authorized users.

---

# Request Workflow

```text id="pr001"
Request
↓
Review
↓
Approval
↓
Purchase Order
```

---

# Multi-Service Support

Supported.

One Purchase Request may support:

```text id="pr002"
SO-001
SO-002
SO-003
SO-004
```

simultaneously.

---

# Request Information

Supports:

* Product
* Quantity
* Reason
* Priority
* Service References

---

# Request Status

### Draft

---

### Pending Approval

---

### Approved

---

### Rejected

---

### Converted To PO

---

# Approval Authority

Configurable.

May include:

* Owner
* Manager
* Purchasing Supervisor

---

# Summary

Purchase Requests manage purchasing demand before supplier engagement.

---

# End Of Document
