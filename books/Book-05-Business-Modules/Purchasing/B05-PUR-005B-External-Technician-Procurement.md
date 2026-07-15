# B05-PUR-005B

# External Technician Procurement

---

# Purpose

Defines emergency and external procurement activities performed outside standard supplier purchasing channels.

---

# Business Philosophy

In repair businesses, technicians may need to source spareparts immediately from external sources to avoid service delays.

The system should support this process while maintaining financial and inventory control.

---

# Core Principle

All externally procured spareparts must remain traceable and auditable.

---

# Objectives

The External Technician Procurement process exists to:

* Reduce service delays
* Support emergency sourcing
* Track procurement costs
* Maintain inventory traceability
* Support reimbursement management

---

# External Procurement Sources

Examples:

* Local Sparepart Stores
* Partner Shops
* Marketplace Platforms
* Independent Suppliers
* Emergency Vendors

---

# Workflow

```text
Service Order
↓
Waiting Parts
↓
External Procurement Request
↓
Funding Approval
↓
External Purchase
↓
Receiving
↓
Inventory Batch Creation
↓
Reservation
↓
Service Continuation
```

---

# Funding Sources

Supported funding methods:

```text
Technician Personal Fund
```

```text
Cashier Cash
```

```text
Petty Cash
```

```text
Owner Fund
```

```text
Company Bank Account
```

---

# Procurement Information

Required:

* Procurement Number
* Service Order
* Requested Part
* Quantity
* Purchase Cost
* Procurement Source
* Purchased By
* Funding Source

---

# Supporting Documents

The system should support:

* Receipt Upload
* Invoice Upload
* Purchase Evidence
* Notes

---

# Technician Reimbursement

If a technician uses personal funds:

The system automatically creates:

```text
Technician Reimbursement
```

for the corresponding amount.

---

# Cashier Integration

If company cash is used:

The system creates:

```text
Cash Out Transaction
```

linked to the procurement transaction.

---

# Inventory Integration

Every external purchase must create an inventory batch.

---

# Example

```text
Batch:
EXT-2026-001
```

Source:

```text
Local Sparepart Store
```

---

# Reservation Integration

Received parts should automatically be reserved for the originating Service Order.

---

# Audit Requirements

The system must record:

* Purchaser
* Funding Source
* Purchase Date
* Cost
* Service Order Reference

---

# Reporting

Support:

* External Procurement Cost
* Emergency Purchases
* Technician Reimbursements
* Cash Usage
* Procurement Sources

---

# Summary

External Technician Procurement supports emergency sparepart sourcing while maintaining inventory, financial, and operational accountability.

---

# End Of Document
