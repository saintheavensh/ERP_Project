---

document_id: B05-SVC-010
title: Service Cancellation
version: 1.0.0
last_updated: 2026-06-27
author: Universal Service ERP Team
----------------------------------

# Service Cancellation

## Purpose

This document defines cancellation processes within the Universal Service ERP.

The objective is to standardize how abandoned, rejected, expired, and terminated services are handled while preserving business intelligence and historical records.

---

# Overview

Not every service request becomes a completed repair.

A service may be canceled at multiple stages of the service lifecycle.

Cancellation records provide operational, financial, and business analysis data.

---

# Core Principle

```text id="sc1"
Canceled
≠
Deleted
```

Canceled records must remain available for reporting and auditing.

---

# Objectives

The Service Cancellation Framework is designed to:

* Preserve historical records.
* Track lost opportunities.
* Track customer behavior.
* Track operational problems.
* Support business reporting.
* Prevent data loss.

---

# Cancellation Lifecycle

Cancellation may occur during:

```text id="sc2"
Intake
```

or

```text id="sc3"
Service Order
```

or

```text id="sc4"
Ready For Pickup
```

stages.

---

# Cancellation Categories

The platform should support:

```text id="sc5"
Intake Cancellation
```

```text id="sc6"
Service Cancellation
```

```text id="sc7"
Abandoned Collection
```

---

# Intake Cancellation

Definition:

A customer request never becomes a Service Order.

Example:

```text id="sc8"
INT
↓
Estimate
↓
Rejected
```

---

# Service Cancellation

Definition:

A Service Order exists but repair cannot continue.

Example:

```text id="sc9"
SVC
↓
Estimate Revision
↓
Rejected
↓
Canceled
```

---

# Abandoned Collection

Definition:

Repair is completed but the device is never collected.

Example:

```text id="sc10"
Ready For Pickup
↓
No Response
↓
Canceled
```

---

# Cancellation Structure

Each cancellation should contain:

* Cancellation Category
* Cancellation Reason
* Cancellation Date
* Cancellation Notes
* Recorded By

---

# Cancellation Categories

## Category

```text id="sc11"
Customer Decision
```

Examples:

* Too Expensive
* Changed Mind
* Purchased New Device
* No Longer Needed

---

## Category

```text id="sc12"
Communication Failure
```

Examples:

* No Response
* Cannot Contact Customer
* Approval Expired

---

## Category

```text id="sc13"
Technical Issue
```

Examples:

* Device Beyond Repair
* Additional Damage Found
* Repair Not Feasible

---

## Category

```text id="sc14"
Parts Availability
```

Examples:

* Spare Part Unavailable
* Supplier Unable To Deliver

---

## Category

```text id="sc15"
Collection Failure
```

Examples:

* Device Never Collected
* Customer Missing For Collection

---

# Cancellation Reasons

The platform should support configurable reasons.

Examples:

```text id="sc16"
Too Expensive
```

```text id="sc17"
Estimate Revision Rejected
```

```text id="sc18"
No Response
```

```text id="sc19"
Device Beyond Repair
```

```text id="sc20"
Spare Part Unavailable
```

```text id="sc21"
Customer Requested Cancellation
```

---

# Estimate Revision Rejection

Example:

Initial estimate:

```text id="sc22"
Rp150.000
```

Approved.

---

Later:

```text id="sc23"
Additional Damage Found
```

New estimate:

```text id="sc24"
Rp450.000
```

Customer rejects.

Result:

```text id="sc25"
Service Canceled
```

---

# Automatic Cancellation

The platform should support automatic cancellation rules.

---

# Automatic Cancellation Triggers

Examples:

```text id="sc26"
Approval Expired
```

```text id="sc27"
No Response
```

```text id="sc28"
Collection Expired
```

---

# Waiting Approval Timeout

Example:

```text id="sc29"
Waiting Approval
```

↓

```text id="sc30"
No Response
```

↓

```text id="sc31"
Automatic Cancellation
```

after business-defined periods.

---

# Ready For Pickup Timeout

Example:

```text id="sc32"
Ready For Pickup
```

↓

```text id="sc33"
No Collection
```

↓

```text id="sc34"
Automatic Cancellation
```

according to business policy.

---

# Spare Part Handling

Special rules apply when spare parts have already been installed.

---

# No Installed Parts

Example:

```text id="sc35"
Diagnosis Only
```

↓

```text id="sc36"
Canceled
```

No inventory impact.

---

# Installed Parts Scenario

Example:

```text id="sc37"
LCD Installed
```

↓

```text id="sc38"
Customer Rejects Repair
```

The business must determine the final disposition of installed parts.

---

# Installed Part Resolution

Possible outcomes:

```text id="sc39"
Parts Removed
```

or

```text id="sc40"
Parts Consumed
```

depending on business policy.

---

# Device Custody

Canceled devices may remain under business custody temporarily.

The system should track:

* Custody Status
* Collection Attempts
* Storage Period

---

# Customer Recovery

Canceled services may be reopened.

Example:

```text id="sc41"
Canceled
```

↓

```text id="sc42"
Customer Returns
```

↓

```text id="sc43"
Reopen Service
```

if business policy allows.

---

# Reporting Requirements

The platform should support reports such as:

```text id="sc44"
Cancellation By Reason
```

```text id="sc45"
Cancellation By Technician
```

```text id="sc46"
Cancellation By Category
```

```text id="sc47"
Cancellation Trend
```

---

# Business Intelligence

Examples:

```text id="sc48"
Too Expensive
80 Cases
```

```text id="sc49"
No Response
25 Cases
```

```text id="sc50"
Spare Part Unavailable
15 Cases
```

These reports help improve pricing, communication, and inventory planning.

---

# Search Capabilities

Users should be able to search cancellations by:

* Customer
* Device
* Technician
* Category
* Reason
* Date Range

---

# Audit Requirements

The following should remain auditable:

* Cancellation Events
* Cancellation Reasons
* Reopening Events
* Automatic Cancellations

---

# Governance Rules

## Rule 1

Canceled records must never be deleted.

---

## Rule 2

Every cancellation must contain a category and reason.

---

## Rule 3

Automatic cancellations must remain visible.

---

## Rule 4

Installed spare parts require resolution before final cancellation.

---

## Rule 5

Cancellation reporting is mandatory for business analysis.

---

# Relationship to Other Modules

This module works together with:

* Service Intake
* Service Orders
* Service Approval
* Inventory Module
* Customer Module
* Reporting Module

Service Cancellation provides structured handling of unsuccessful service outcomes while preserving valuable business information.

---

# Summary

Service Cancellation defines how abandoned, rejected, expired, and terminated service requests are managed.

The framework supports cancellation categories, cancellation reasons, automatic cancellation rules, spare part handling, business reporting, and historical preservation to ensure complete visibility into unsuccessful repair opportunities.
