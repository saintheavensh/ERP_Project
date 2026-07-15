# B05-INV-008

# Supplier Return

---

# Purpose

Defines supplier return processes and inventory impacts.

---

# Business Philosophy

Defective inventory should not remain available.

Supplier returns must preserve inventory accuracy.

---

# Core Principle

Returned inventory must be traceable to its source batch.

---

# Return Sources

Examples:

* Dead On Arrival
* Wrong Product
* Manufacturing Defect
* Quality Failure

---

# Supplier Return Workflow

```text id="supret001"
Receive Inventory
↓
Defect Identified
↓
Return Request
↓
Inventory Removal
↓
Await Replacement
```

---

# Inventory Impact

When returned:

```text id="supret002"
Stock Out
```

must occur.

---

# Batch Tracking

System must record:

* Original Batch
* Original Supplier
* Quantity Returned

---

# Example

Batch:

```text id="supret003"
LCD-RN12-001
```

Qty:

```text id="supret004"
20
```

Returned:

```text id="supret005"
2
```

Remaining:

```text id="supret006"
18
```

---

# Replacement Workflow

```text id="supret007"
Supplier Replacement
↓
Receiving
↓
New Batch Creation
```

---

# Replacement Batch Rule

Replacement inventory creates:

```text id="supret008"
New Batch
```

Never reuse old batches.

---

# Credit Note Scenario

Supported.

Example:

Supplier issues:

```text id="supret009"
Credit Balance
```

instead of replacement.

Inventory remains removed.

---

# Partial Returns

Supported.

---

# Full Batch Returns

Supported.

---

# Return Rejection

If supplier rejects return:

Management action required.

Inventory remains removed unless manually restored.

---

# Reporting Requirements

Support:

* Supplier Return Rate
* Supplier Defect Rate
* Return Quantity
* Replacement Quantity
* Credit Note Tracking

---

# Supplier Performance Metrics

Future KPI:

```text id="supret010"
Supplier Quality Score
```

---

# Summary

* Supplier returns reduce stock.
* Returns must reference original batches.
* Replacement creates new batches.
* Credit notes supported.
* Supplier quality reporting supported.

---

# End Of Document
