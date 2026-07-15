---

document_id: B05-CORE-004
title: Status Management Framework
version: 1.0.0
last_updated: 2026-06-27
author: Universal Service ERP Team
----------------------------------

# Status Management Framework

## Purpose

This document defines the status management principles used throughout the Universal Service ERP.

The framework establishes a consistent approach for representing, controlling, tracking, and governing business entity states across all business modules.

---

# Overview

A status represents the current operational condition of a business entity.

Statuses provide visibility into business processes and allow users to understand where an entity currently exists within its lifecycle.

Examples:

* Service Order Status
* Purchase Order Status
* Sales Invoice Status
* Inventory Status
* Warranty Status
* Payment Status

---

# Objectives

The Status Management Framework is designed to:

* Standardize status definitions.
* Improve operational visibility.
* Support workflow governance.
* Enable process tracking.
* Improve reporting accuracy.
* Reduce process ambiguity.

---

# Core Concepts

## Status

A status represents the current state of a business entity.

Examples:

* Created
* Pending
* Approved
* Processing
* Completed
* Closed

An entity may only have one active status at any given time unless explicitly defined otherwise.

---

## Status Transition

A status transition occurs when an entity moves from one status to another.

Example:

```text id="1qm2af"
Created
    ↓
Approved
```

Transitions should follow predefined business rules.

---

## Status History

Every status change must be recorded.

Historical status records provide:

* Auditability
* Reporting
* Performance analysis
* Process traceability

Status history must never be deleted.

---

## Status Ownership

Each status change should be attributable to:

* User
* System Process
* Automated Workflow

The source of the status change must be recorded.

---

# Standard Status Categories

The platform uses the following generic status categories.

---

## Initial Status

Represents the creation of a business entity.

Examples:

```text id="dh7xmp"
Created
Registered
Submitted
Opened
```

---

## Pending Status

Represents waiting conditions.

Examples:

```text id="d94f9v"
Pending
Waiting Approval
Waiting Payment
Waiting Part
```

---

## Active Status

Represents active work being performed.

Examples:

```text id="hr0gkm"
Processing
Repairing
Receiving
Delivering
```

---

## Review Status

Represents verification or inspection activities.

Examples:

```text id="pgrv72"
Review
Inspection
Quality Control
Validation
```

---

## Completed Status

Represents successful completion.

Examples:

```text id="v0cxtx"
Completed
Resolved
Delivered
Paid
```

---

## Closed Status

Represents the end of the lifecycle.

Examples:

```text id="g5r4z8"
Closed
Archived
Finalized
```

Closed entities should generally be immutable.

---

## Exception Status

Represents abnormal situations.

Examples:

```text id="t7y6nm"
Cancelled
Rejected
Failed
On Hold
Reopened
```

Exception statuses require additional business rules.

---

# Status Governance Rules

## Rule 1

Every business entity must define an initial status.

---

## Rule 2

Every business entity must define at least one terminal status.

Examples:

* Closed
* Cancelled

---

## Rule 3

Status transitions must follow approved workflows.

Direct status jumping should not be allowed unless explicitly authorized.

---

## Rule 4

Every status transition must be recorded.

The following information should be captured:

* Previous Status
* New Status
* Date and Time
* User or Process
* Reason (if applicable)

---

## Rule 5

Historical status records must be immutable.

---

# Example Implementations

## Service Order

```text id="mjlwmv"
Created
    ↓
Diagnosis
    ↓
Waiting Approval
    ↓
Approved
    ↓
Repairing
    ↓
Quality Control
    ↓
Completed
    ↓
Closed
```

---

## Purchase Order

```text id="w7byw7"
Draft
    ↓
Submitted
    ↓
Approved
    ↓
Ordered
    ↓
Received
    ↓
Closed
```

---

## Payment

```text id="vh6my0"
Pending
    ↓
Partially Paid
    ↓
Paid
    ↓
Closed
```

---

## Warranty Claim

```text id="7k5d4t"
Created
    ↓
Validation
    ↓
Approved
    ↓
Repair
    ↓
Completed
    ↓
Closed
```

---

# Reporting Considerations

Status information should support:

* Operational dashboards
* SLA monitoring
* Bottleneck analysis
* Workload analysis
* Lifecycle duration reporting
* Performance measurement

---

# Relationship to Other Frameworks

This framework works together with:

* Business Lifecycle Framework
* Business Transactions
* Business Workflow Framework
* Business Rules Framework
* Business Events Framework

The Status Management Framework defines the state model used by all operational processes.

---

# Summary

The Status Management Framework establishes a standardized method for defining, managing, tracking, and auditing business entity states across the Universal Service ERP.

All business modules should implement their status models using the principles defined in this framework.
