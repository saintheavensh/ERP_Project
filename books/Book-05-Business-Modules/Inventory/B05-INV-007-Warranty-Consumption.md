# B05-INV-007

# Warranty Consumption

---

# Purpose

Defines inventory behavior during warranty repairs.

---

# Business Philosophy

Warranty repairs still consume inventory.

Inventory must reflect physical usage.

Warranty is a financial classification, not an inventory exception.

---

# Core Principle

Official rule:

```text id="war001"
Warranty Repairs Consume Inventory
```

---

# Example

Original Service:

```text id="war002"
LCD Replacement
```

Customer returns within warranty period.

LCD replaced again.

Inventory must decrease again.

---

# Warranty Workflow

```text id="war003"
Warranty Claim
↓
Inspection
↓
Approval
↓
Warranty Repair
↓
Sparepart Usage
↓
FIFO Consumption
↓
QC
↓
Complete
```

---

# Warranty Cost

Inventory cost generated during warranty repairs is classified as:

```text id="war004"
Warranty Cost
```

Not:

```text id="war005"
Sales Revenue
```

---

# Original Service Link

Every warranty claim must reference:

```text id="war006"
Original Service Order
```

---

# Required Traceability

System must know:

* Original Technician
* Original Sparepart
* Original Batch
* Original Supplier

---

# FIFO Rules

Warranty repairs use:

```text id="war007"
Normal FIFO
```

No special inventory logic.

---

# Warranty Replacement Scenario

Example:

```text id="war008"
LCD
Batch A
```

used originally.

Warranty repair may consume:

```text id="war009"
Batch B
```

if FIFO requires it.

---

# Warranty Reporting

Support:

* Warranty Cost
* Warranty Consumption
* Warranty Sparepart Analysis
* Warranty By Supplier
* Warranty By Technician

---

# Supplier Quality Analysis

System should support future analysis:

```text id="war010"
Supplier
↓
Warranty Rate
```

---

# Technician Quality Analysis

System should support future analysis:

```text id="war011"
Technician
↓
Warranty Rate
```

---

# Financial Impact

Warranty repairs generate:

```text id="war012"
Expense
```

not

```text id="war013"
Revenue
```

---

# Summary

* Warranty consumes inventory.
* FIFO remains unchanged.
* Original service must be linked.
* Warranty cost tracked separately.
* Warranty performance reporting supported.

---

# End Of Document
