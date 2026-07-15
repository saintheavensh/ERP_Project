# B05-INV-010

# Stock Adjustment

---

# Purpose

Defines inventory correction procedures.

---

# Business Philosophy

Inventory corrections must be controlled.

Inventory adjustments are exceptions, not normal operations.

---

# Core Principle

Official rule:

```text id="adj001"
Every Adjustment Requires A Reason
```

---

# Supported Adjustment Types

---

## Increase

Examples:

* Counting Error
* Migration Error
* Approved Correction

---

## Decrease

Examples:

* Lost Item
* Damage
* Theft
* Counting Error

---

# Adjustment Workflow

```text id="adj002"
Identify Discrepancy
↓
Review
↓
Approval
↓
Adjustment
↓
Audit Record
```

---

# Mandatory Fields

System must capture:

* Product
* Batch
* Quantity
* Adjustment Type
* Reason
* User
* Timestamp

---

# Adjustment Categories

---

## Loss

Example:

```text id="adj003"
Missing Inventory
```

---

## Damage

Example:

```text id="adj004"
Broken LCD
```

---

## Theft

Example:

```text id="adj005"
Inventory Theft
```

---

## Administrative Error

Example:

```text id="adj006"
Incorrect Quantity Entry
```

---

# Approval Rules

Small adjustments:

Configurable.

Large adjustments:

Owner approval recommended.

---

# Batch Rules

Adjustments must affect:

```text id="adj007"
Specific Batch
```

never anonymous inventory.

---

# Inventory Impact

Increase:

```text id="adj008"
Stock In
```

Decrease:

```text id="adj009"
Stock Out
```

---

# Financial Impact

Adjustments may create:

* Inventory Gain
* Inventory Loss

Future finance integration required.

---

# Reporting Requirements

Support:

* Adjustment History
* Loss Analysis
* Damage Analysis
* Theft Analysis
* Adjustment By User

---

# Summary

* Adjustments are exceptions.
* Every adjustment requires a reason.
* Batch tracking mandatory.
* Audit trail mandatory.
* Financial impact supported.

---

# End Of Document
