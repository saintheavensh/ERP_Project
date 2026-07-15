---

document_id: B05-SVC-005
title: Service Estimation
version: 1.0.0
last_updated: 2026-06-27
author: Universal Service ERP Team
----------------------------------

# Service Estimation

## Purpose

This document defines the Service Estimation framework within the Universal Service ERP.

The objective is to provide structured cost estimates, repair recommendations, spare part requirements, and completion time estimates before repair activities begin.

---

# Overview

Service Estimation is the process of determining:

* Estimated Repair Cost
* Estimated Labor Cost
* Estimated Spare Part Cost
* Estimated Completion Time
* Repair Feasibility

Estimation occurs after diagnosis and before customer approval.

---

# Core Principle

```text id="se1"
Estimate First
Repair Later
```

No repair should proceed without an estimate.

---

# Objectives

The Service Estimation Framework is designed to:

* Support customer decision making.
* Improve pricing consistency.
* Protect business profitability.
* Support technician planning.
* Support completion forecasting.

---

# Estimation Components

An estimate may contain:

* Repair Categories
* Labor Charges
* Spare Part Charges
* Estimated Completion Time
* Technician Notes

---

# Estimate Lifecycle

```text id="se2"
Diagnosis
      ↓
Estimate
      ↓
Customer Approval
      ↓
Repair
```

---

# Estimate Versions

Estimates may change.

Examples:

```text id="se3"
Estimate V1
```

↓

```text id="se4"
Estimate V2
```

↓

```text id="se5"
Estimate V3
```

Historical versions should remain visible.

---

# Estimate Version Example

Initial estimate:

```text id="se6"
Charging Port
Rp150.000
```

After disassembly:

```text id="se7"
Charging Port
+
Charging IC
```

New estimate:

```text id="se8"
Rp450.000
```

Customer approval required again.

---

# Service Categories

The system should support predefined:

```text id="se9"
Service Categories
```

Examples:

* LCD Replacement
* Battery Replacement
* Charging Repair
* Software Flashing
* CPU Repair
* EMMC Repair

---

# Service Category Pricing

Each category may define:

```text id="se10"
Minimum Selling Price
```

Example:

| Category            | Minimum Price |
| ------------------- | ------------- |
| LCD Replacement     | Rp180.000     |
| Battery Replacement | Rp80.000      |
| Charging Repair     | Rp100.000     |

---

# Profit Protection

The platform should prevent:

```text id="se11"
Selling Below Cost
```

unless authorized.

---

# Spare Part Validation

If spare parts exist:

```text id="se12"
Selling Price
<
Cost Price
```

should be blocked.

Owner authorization required.

---

# Service Validation

If service pricing exists:

```text id="se13"
Selling Price
<
Minimum Service Price
```

should be blocked.

Owner authorization required.

---

# Multi-Repair Estimation

A service may contain multiple repair categories.

Example:

```text id="se14"
LCD Replacement
+
Battery Replacement
```

Total estimate:

```text id="se15"
Category A
+
Category B
=
Total
```

---

# Multi-Repair Principle

By default:

```text id="se16"
Each Repair Category
Contributes Independently
```

to the estimate.

---

# Spare Part Estimation

The estimate may include:

* Part Name
* Quantity
* Cost
* Selling Price

Example:

```text id="se17"
LCD
1 pcs
```

```text id="se18"
Battery
1 pcs
```

---

# Labor Estimation

The estimate may include:

```text id="se19"
Labor Charge
```

independent from spare parts.

---

# Time Estimation

Each estimate should contain:

```text id="se20"
Estimated Completion Time
```

---

# Examples

```text id="se21"
LCD Replacement
1 Day
```

```text id="se22"
CPU Repair
3 Days
```

```text id="se23"
EMMC Repair
4 Days
```

---

# Estimated Completion Date

The system may calculate:

```text id="se24"
Date Received
+
Estimated Duration
=
Estimated Completion Date
```

Example:

```text id="se25"
Received:
10 July

Duration:
4 Days

Estimated Completion:
14 July
```

---

# Technician Planning

Estimated completion dates should support:

* Technician Work Queue
* Technician Calendar
* Service Scheduling

---

# Delay Management

Not all delays are technician failures.

Examples:

```text id="se26"
Waiting Spare Part
```

```text id="se27"
Customer Approval Pending
```

```text id="se28"
Additional Damage Found
```

```text id="se29"
External Vendor Delay
```

---

# Estimate Revision Triggers

Examples:

* Additional Damage
* Additional Spare Parts
* New Findings
* Customer Requests

---

# Additional Damage Scenario

Example:

```text id="se30"
Diagnosis V1
```

↓

```text id="se31"
Repair Started
```

↓

```text id="se32"
Additional Damage Found
```

↓

```text id="se33"
Estimate Revised
```

↓

```text id="se34"
Customer Approval Required
```

---

# Repair Feasibility

Estimation may indicate:

```text id="se35"
Recommended
```

or

```text id="se36"
Not Recommended
```

based on economic or technical considerations.

---

# Customer Visibility

Customers should receive:

* Estimated Cost
* Estimated Completion Time
* Estimate Revision Notices

---

# Search Capabilities

Users should be able to search estimates by:

* Service Order
* Customer
* Technician
* Estimate Version
* Date Range

---

# Audit Requirements

The following should remain auditable:

* Estimate Creation
* Estimate Changes
* Price Changes
* Time Changes
* Approval Requests

---

# Governance Rules

## Rule 1

Every Service Order should have an estimate.

---

## Rule 2

Estimate revisions must remain visible.

---

## Rule 3

Estimate revisions require approval before continuation.

---

## Rule 4

Selling below minimum rules should be restricted.

---

## Rule 5

Time estimates should support planning and performance tracking.

---

# Relationship to Other Modules

This module works together with:

* Service Diagnosis
* Service Approval
* Technician Module
* Inventory Module
* Scheduling Module
* Reporting Module

Service Estimation provides the financial and scheduling foundation for repair execution.

---

# Summary

Service Estimation defines how repair costs, labor charges, spare part charges, and completion time forecasts are calculated and managed.

The framework supports estimate revisions, profitability protection, technician scheduling, customer communication, and performance measurement.
