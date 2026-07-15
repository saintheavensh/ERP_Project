# B05-INV-006

# Service Consumption

---

# Purpose

This document defines how inventory is consumed during service operations.

---

# Business Philosophy

Inventory is consumed only when spareparts are actually used.

Creating a Service Order does not consume inventory.

Diagnosis does not consume inventory.

Customer approval does not consume inventory.

Inventory consumption occurs only when spareparts are physically installed.

---

# Core Principle

Official rule:

```text id="svccons001"
Service Order
≠
Inventory Consumption
```

---

# Inventory Consumption Trigger

Inventory is consumed when:

```text id="svccons002"
Sparepart Installed
```

or

```text id="svccons003"
Sparepart Confirmed Used
```

---

# Service Workflow

```text id="svccons004"
Customer Intake
↓
Diagnosis
↓
Estimate
↓
Approval
↓
Repair
↓
Sparepart Recording
↓
FIFO Consumption
↓
QC
↓
Completed
```

---

# Quick Service Workflow

Official rule:

Technicians may complete repairs before recording spareparts.

Example:

```text id="svccons005"
Screen Replacement
10 Minutes
```

Workflow:

```text id="svccons006"
Repair
↓
Testing
↓
Record Spareparts
↓
Inventory Consumption
```

---

# Deferred Sparepart Recording

Supported.

Purpose:

Reduce technician workload.

---

# Completion Validation

Before service completion:

System must verify:

```text id="svccons007"
All Used Spareparts Recorded
```

If not:

```text id="svccons008"
Warning
```

or

```text id="svccons009"
Block
```

Configuration controlled by business settings.

---

# FIFO Integration

All service consumption follows:

```text id="svccons010"
FIFO Engine
```

Technicians do not select batches.

System selects automatically.

---

# Multi Sparepart Usage

Supported.

Example:

```text id="svccons011"
LCD
Battery
Charging Port
```

Each item generates separate inventory movements.

---

# Additional Damage Scenario

Example:

Initial diagnosis:

```text id="svccons012"
LCD Replacement
```

After disassembly:

```text id="svccons013"
LCD
+
Backlight IC
```

Workflow:

```text id="svccons014"
Pause Repair
↓
Customer Confirmation
↓
Continue Repair
```

Inventory consumed only after approval.

---

# Cancellation Before Consumption

Allowed.

No inventory impact.

---

# Cancellation After Consumption

Allowed.

Requires management decision.

Inventory remains consumed.

Financial adjustment handled separately.

---

# Reporting Requirements

Support:

* Sparepart Usage By Service
* Sparepart Usage By Technician
* Cost Per Service
* Consumption Trends

---

# Summary

* Service Orders do not consume stock.
* Sparepart installation consumes stock.
* FIFO mandatory.
* Deferred recording supported.
* Additional damage requires approval.
* Consumption history permanent.

---

# End Of Document
