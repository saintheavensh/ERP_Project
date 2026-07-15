# B05-INV-009

# Customer Return

---

# Purpose

Defines customer return processes and inventory impacts.

---

# Business Philosophy

Returned items must never automatically return to inventory.

Every returned item must be evaluated before inventory decisions are made.

---

# Core Principle

Official rule:

```text id="custret001"
Return
≠
Restock
```

A returned item is not automatically inventory.

---

# Supported Return Sources

Examples:

* Product Defect
* Wrong Product Delivered
* Warranty Exchange
* Customer Complaint
* Owner Approved Return

---

# Customer Return Workflow

```text id="custret002"
Customer Return Request
↓
Inspection
↓
Evaluation
↓
Decision
```

Decision:

```text id="custret003"
Restock
```

or

```text id="custret004"
Scrap
```

or

```text id="custret005"
Supplier Claim
```

---

# Inspection Process

System should record:

* Product Condition
* Packaging Condition
* Physical Damage
* Functional Status

---

# Restock Conditions

Item may return to inventory when:

* Functional
* Sellable
* No damage
* Approved

---

# Restock Workflow

```text id="custret006"
Inspection
↓
Approved
↓
Inventory Return
↓
Available Stock
```

---

# Scrap Workflow

```text id="custret007"
Inspection
↓
Not Sellable
↓
Scrap
```

---

# Supplier Claim Workflow

```text id="custret008"
Inspection
↓
Supplier Defect
↓
Supplier Return Process
```

---

# Inventory Impact

Restock:

```text id="custret009"
Stock In
```

Scrap:

```text id="custret010"
Stock Out
```

Supplier Claim:

Follow supplier return process.

---

# Audit Trail

Must record:

* Customer
* Product
* Quantity
* Reason
* User
* Decision

---

# Reporting Requirements

Support:

* Return Rate
* Return Reasons
* Return Value
* Return By Product
* Return By Supplier

---

# Summary

* Returns require inspection.
* Returns do not automatically become inventory.
* Restock, Scrap, and Supplier Claim supported.
* Full audit trail required.

---

# End Of Document
