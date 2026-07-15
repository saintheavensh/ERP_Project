---

document_id: B05-SVC-003
title: Service Orders
version: 1.0.0
last_updated: 2026-06-27
author: Universal Service ERP Team
----------------------------------

# Service Orders

## Purpose

This document defines Service Orders within the Universal Service ERP.

The objective is to establish the official repair record that is created after customer approval and governs all repair activities until completion or cancellation.

---

# Overview

A Service Order represents an approved repair request.

A Service Order does not exist during intake.

Service Orders are only created after:

```text id="so1"
Diagnosis Completed
```

↓

```text id="so2"
Estimate Prepared
```

↓

```text id="so3"
Customer Approved
```

---

# Core Principle

```text id="so4"
Intake
≠
Service Order
```

and

```text id="so5"
Approved Intake
=
Service Order
```

---

# Objectives

The Service Order Framework is designed to:

* Control repair execution.
* Track repair progress.
* Track technician activities.
* Track spare part consumption.
* Track estimate revisions.
* Track approvals and cancellations.

---

# Service Order Creation

Creation flow:

```text id="so6"
INT-20260709-0001
        ↓
Diagnosis
        ↓
Estimate
        ↓
Approval
        ↓
SVC-20260709-0001
```

---

# Service Order Identifier

Example:

```text id="so7"
SVC-20260709-0001
```

Each Service Order must be unique.

---

# Relationship To Intake

Relationship:

```text id="so8"
1 Intake
        ↓
0 or 1 Service Order
```

An intake may:

* Become a Service Order.
* Be rejected.
* Be canceled.

---

# Service Order Ownership

A Service Order should be linked to:

* Customer
* Device
* Intake Record
* Technician
* Repair Category

---

# Service Order Classification

Service Orders may be classified as:

```text id="so9"
Quick Service
```

or

```text id="so10"
Regular Service
```

---

# Quick Service Definition

```text id="so11"
Customer Waits
```

The customer remains on-site.

---

# Regular Service Definition

```text id="so12"
Customer Leaves Device
```

The device remains under business custody.

---

# Initial Estimate

Every Service Order begins with:

```text id="so13"
Estimate Version 1
```

Example:

```text id="so14"
Charging Repair
Rp150.000
```

---

# Estimate Revision Concept

Diagnosis is not always final.

After opening the device:

```text id="so15"
Additional Damage Found
```

may occur.

---

# Example

Initial diagnosis:

```text id="so16"
Charging Port Damage
```

Estimate:

```text id="so17"
Rp150.000
```

Customer approves.

---

After disassembly:

```text id="so18"
Charging IC Damage Found
```

New estimate:

```text id="so19"
Rp450.000
```

---

# Estimate Versioning

The platform should support:

```text id="so20"
Estimate V1
```

```text id="so21"
Estimate V2
```

```text id="so22"
Estimate V3
```

and future revisions.

Historical versions should remain visible.

---

# Additional Approval

When an estimate changes:

```text id="so23"
Customer Approval Required
```

before work continues.

---

# Approval Types

## Initial Approval

Creates the Service Order.

Example:

```text id="so24"
INT
↓
SVC
```

---

## Revision Approval

Allows repair continuation after estimate changes.

Example:

```text id="so25"
Estimate Revision
↓
Customer Decision
```

---

# Service Execution

After approval:

Activities may include:

* Disassembly
* Testing
* Repair
* Part Replacement
* Reassembly

---

# Spare Part Usage

The Service Order should track:

* Spare Parts Used
* Quantities
* Costs

---

# Technician Assignment

The Service Order should record:

```text id="so26"
Assigned Technician
```

and assignment history.

---

# Service Status Lifecycle

Example:

```text id="so27"
Open
```

↓

```text id="so28"
Diagnosis
```

↓

```text id="so29"
Waiting Approval
```

↓

```text id="so30"
In Repair
```

↓

```text id="so31"
Quality Control
```

↓

```text id="so32"
Completed
```

---

# Service Cancellation

A Service Order may be canceled even after creation.

Example:

```text id="so33"
Estimate Revised
```

↓

```text id="so34"
Customer Rejects
```

↓

```text id="so35"
Canceled
```

---

# Cancellation Examples

Examples:

```text id="so36"
Price Revision Rejected
```

```text id="so37"
No Spare Part Available
```

```text id="so38"
Device Beyond Repair
```

```text id="so39"
Customer Withdraws
```

```text id="so40"
No Response
```

---

# Historical Integrity

Service Orders should never be physically deleted.

Even when:

```text id="so41"
Canceled
```

or

```text id="so42"
Failed
```

the record remains available.

---

# Search Capabilities

Users should be able to search Service Orders by:

* Service Number
* Intake Number
* Customer
* Device
* Technician
* Status
* Date Range

---

# Audit Requirements

The following should remain auditable:

* Service Creation
* Estimate Changes
* Approval Events
* Technician Changes
* Status Changes
* Cancellation Events

---

# Governance Rules

## Rule 1

Service Orders are created only after approval.

---

## Rule 2

Each Service Order must originate from an Intake.

---

## Rule 3

Estimate revisions must be tracked.

---

## Rule 4

Estimate revisions require approval before continuation.

---

## Rule 5

Service Orders may be canceled after creation.

---

## Rule 6

Service Orders must never be physically deleted.

---

# Relationship to Other Modules

This module works together with:

* Service Intake
* Device Module
* Customer Module
* Technician Module
* Inventory Module
* Warranty Module

Service Orders act as the central operational record for all approved repairs.

---

# Summary

Service Orders represent approved repair activities and provide the foundation for repair execution, technician management, estimate tracking, spare part usage, quality control, completion, and cancellation.

The framework supports multiple estimate revisions, multiple approval events, and real-world repair workflows where diagnoses may evolve after device disassembly.
