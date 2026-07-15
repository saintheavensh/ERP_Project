# B05-INV-005

# Stock Movement

---

# Purpose

Defines all inventory movements inside Universal Service ERP.

---

# Business Philosophy

Every stock movement must be recorded.

No stock may move without a transaction.

---

# Core Principle

Inventory movement equals physical movement.

---

# Movement Categories

---

## Stock In

Inventory enters system.

Examples:

* Purchase Receiving
* Supplier Replacement
* Customer Return Restock
* Adjustment Increase

---

## Stock Out

Inventory leaves system.

Examples:

* Service
* Warranty
* Sales
* Supplier Return
* Scrap

---

## Internal Movement

Inventory remains inside system.

Examples:

* Reservation
* Branch Transfer
* Warehouse Transfer

Future support.

---

# Official Movement Types

---

## Purchase Receiving

```text
IN
```

Creates stock.

---

## Service Consumption

```text
OUT
```

Consumes stock.

---

## Warranty Consumption

```text
OUT
```

Consumes stock.

Warranty Cost recorded separately.

---

## Sales Consumption

```text
OUT
```

Consumes stock.

Revenue generated.

---

## Supplier Return

```text
OUT
```

Inventory removed.

Awaiting replacement.

---

## Customer Return

```text
IN
```

Conditional.

Must pass inspection.

---

## Stock Adjustment Increase

```text
IN
```

Correction.

---

## Stock Adjustment Decrease

```text
OUT
```

Correction.

---

## Scrap

```text
OUT
```

Permanent removal.

---

# Mandatory Movement Data

Every movement requires:

* Product
* Batch
* Quantity
* Date
* User
* Movement Type
* Reference Number

---

# Audit Trail

Every movement must create:

```text
Inventory Ledger Entry
```

---

# Inventory Ledger

Permanent history.

Cannot be deleted.

---

# Service Integration

Flow:

```text
Service
↓
Sparepart Usage
↓
FIFO
↓
Stock Out
```

---

# Warranty Integration

Flow:

```text
Warranty Claim
↓
Repair
↓
FIFO
↓
Stock Out
```

---

# Purchasing Integration

Flow:

```text
Purchase
↓
Receiving
↓
Batch Creation
↓
Stock In
```

---

# Reporting Requirements

Support:

* Stock In Report
* Stock Out Report
* Movement History
* Product Ledger
* Batch Ledger

---

# Validation Rules

---

## Rule 1

No movement without batch.

---

## Rule 2

No movement without quantity.

---

## Rule 3

No negative inventory.

---

## Rule 4

No deletion of movement history.

---

# Summary

* All inventory movements require audit trails.
* All movements must identify batches.
* Stock In and Stock Out are fully traceable.
* Inventory ledger is permanent.
* Service, Warranty and Sales consume inventory through the same movement engine.

---

# End Of Document
