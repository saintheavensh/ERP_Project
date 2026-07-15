# B05-INV-004

# Batch Management

---

# Purpose

This document defines batch creation, tracking and lifecycle management.

---

# Business Philosophy

Inventory is never stored as anonymous quantities.

Every inventory unit belongs to a batch.

---

# Core Principle

Every receiving transaction creates a batch.

No exceptions.

---

# Batch Definition

A batch represents:

```text
Product
+
Supplier
+
Purchase Cost
+
Purchase Date
+
Quantity
```

---

# Example

```text
LCD-RN12-001
```

Contains:

```text
Product:
LCD Redmi Note 12

Supplier:
ABC Mobile Parts

Cost:
100,000

Qty:
20
```

---

# Batch Information

Mandatory fields:

* Batch ID
* Product
* Supplier
* Purchase Date
* Cost
* Initial Qty
* Remaining Qty

---

# Batch Creation

Flow:

```text
Purchase
↓
Receiving
↓
Batch Creation
```

---

# Batch Consumption

Flow:

```text
Batch
↓
FIFO Engine
↓
Consumption
```

---

# Batch Closure

When:

```text
Remaining Qty = 0
```

Status:

```text
Closed
```

---

# Batch Reopening

Not allowed.

---

# Supplier Relationship

Every batch belongs to one supplier.

---

# Warranty Tracking

Warranty claims must retain:

* Original Batch
* Original Supplier

for reporting.

---

# Return Tracking

Supplier returns must identify:

* Source Batch
* Source Supplier

---

# Batch History

Every batch stores:

* Creation History
* Consumption History
* Return History
* Adjustment History

---

# Batch Deletion

Never allowed.

---

# Reporting Requirements

Support:

* Open Batches
* Closed Batches
* Supplier Analysis
* Cost Analysis
* Aging Analysis

---

# Summary

* Every stock belongs to a batch
* Every batch belongs to a supplier
* Batch deletion prohibited
* Batch history permanent

---

# End Of Document
