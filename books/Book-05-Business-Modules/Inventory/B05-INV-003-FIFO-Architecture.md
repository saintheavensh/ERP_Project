# B05-INV-003

# FIFO Architecture

---

# Purpose

This document defines the official FIFO (First In First Out) inventory costing and consumption model used throughout Universal Service ERP.

FIFO is the only supported inventory costing method.

---

# Business Philosophy

The oldest inventory must always be consumed first.

Inventory cost must follow actual purchase history.

Profit calculations must reflect actual inventory costs.

---

# Core Principle

Universal Service ERP uses:

```text
FIFO
First In First Out
```

for:

* Service Consumption
* Warranty Consumption
* Sales Consumption

---

# Why FIFO

Reasons:

* Easier auditing
* Easier supplier tracking
* Accurate profit calculation
* Suitable for repair businesses

---

# Example

Purchase:

Batch A

```text
10 pcs
100,000
```

Batch B

```text
20 pcs
120,000
```

Stock:

```text
A = 10
B = 20
```

---

Customer uses:

```text
5 pcs
```

System consumes:

```text
Batch A
```

Remaining:

```text
A = 5
B = 20
```

---

# FIFO Selection Rules

Priority:

```text
Oldest Batch
↓
Oldest Purchase Date
↓
Lowest Batch Sequence
```

---

# Partial Consumption

Allowed.

Example:

Batch:

```text
10 pcs
```

Usage:

```text
4 pcs
```

Remaining:

```text
6 pcs
```

---

# Multi Batch Consumption

Allowed.

Example:

Need:

```text
15 pcs
```

Available:

```text
Batch A = 10
Batch B = 20
```

Result:

```text
A = 10 used
B = 5 used
```

---

# Cost Calculation

Cost always follows consumed batches.

Example:

```text
10 pcs @100,000
5 pcs @120,000
```

Total Cost:

```text
1,600,000
```

---

# Warranty FIFO

Warranty repairs follow FIFO.

No special batch selection.

---

# Sales FIFO

Sales follow FIFO.

No manual batch selection.

---

# Service FIFO

Service repairs follow FIFO.

Technicians do not choose batches.

System chooses automatically.

---

# Manual Override

Default:

```text
Not Allowed
```

Future:

Owner override configurable.

---

# Negative Stock

Not allowed.

Transaction blocked.

---

# Reporting Requirements

Must support:

* FIFO History
* Batch Cost History
* Inventory Valuation
* Consumption Cost Analysis

---

# Summary

* FIFO mandatory
* Oldest batch consumed first
* Multi-batch consumption supported
* Negative stock prohibited
* Service, Warranty and Sales use same FIFO engine

---

# End Of Document
