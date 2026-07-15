---

document_id: B05-SVC-006
title: Service Approval
version: 1.0.0
last_updated: 2026-06-27
author: Universal Service ERP Team
----------------------------------

# Service Approval

## Purpose

This document defines the approval process within the Universal Service ERP.

The objective is to ensure that repair activities requiring customer consent are properly authorized before work proceeds.

---

# Overview

Approval represents customer authorization for:

* Repair Execution
* Cost Acceptance
* Time Acceptance
* Estimate Revisions

A service may require multiple approvals throughout its lifecycle.

---

# Core Principle

```text id="sa1"
No Approval
No Repair
```

Repair activities requiring customer consent must not proceed without approval.

---

# Objectives

The Service Approval Framework is designed to:

* Protect customers.
* Protect technicians.
* Protect the business.
* Document customer decisions.
* Track estimate revisions.

---

# Approval Lifecycle

Standard flow:

```text id="sa2"
Diagnosis
      ↓
Estimate
      ↓
Approval Request
      ↓
Customer Decision
```

---

# Approval Types

The platform should support:

```text id="sa3"
Initial Approval
```

and

```text id="sa4"
Revision Approval
```

---

# Initial Approval

Purpose:

```text id="sa5"
Authorize Initial Repair
```

This approval converts:

```text id="sa6"
Intake
```

into

```text id="sa7"
Service Order
```

---

# Initial Approval Flow

```text id="sa8"
INT
      ↓
Estimate V1
      ↓
Approved
      ↓
SVC
```

---

# Initial Rejection

Customer may reject.

Result:

```text id="sa9"
No Service Order Created
```

The Intake remains available for reporting.

---

# Revision Approval

Purpose:

```text id="sa10"
Authorize Estimate Changes
```

Revision approval occurs after a Service Order already exists.

---

# Revision Approval Example

Initial Estimate:

```text id="sa11"
Rp150.000
```

Approved.

---

Later:

```text id="sa12"
Additional Damage Found
```

New Estimate:

```text id="sa13"
Rp450.000
```

Customer approval required again.

---

# Revision Approval Flow

```text id="sa14"
Service Order
      ↓
New Diagnosis
      ↓
Estimate Revision
      ↓
Approval Request
      ↓
Customer Decision
```

---

# Customer Decisions

Customers may:

```text id="sa15"
Approve
```

or

```text id="sa16"
Reject
```

---

# Approval Channels

Approval may be obtained through:

* In Person
* Telephone
* Messaging Applications
* Other Business Channels

The approval method should be recorded.

---

# Approval Recording

The system should record:

* Approval Date
* Approval Time
* Approved Amount
* Estimated Completion Date
* Approval Method
* Employee Recording Approval

---

# Price Approval

Customers approve:

```text id="sa17"
Repair Cost
```

for a specific estimate version.

---

# Time Approval

Customers also approve:

```text id="sa18"
Estimated Completion Time
```

when provided.

---

# Approval Versioning

Example:

```text id="sa19"
Estimate V1
Approved
```

↓

```text id="sa20"
Estimate V2
Approved
```

↓

```text id="sa21"
Estimate V3
Rejected
```

All approval history should remain available.

---

# Pending Approval Status

Example:

```text id="sa22"
Waiting Customer Approval
```

The service should not proceed beyond the approval boundary.

---

# No Response Scenario

Example:

```text id="sa23"
Approval Requested
```

↓

```text id="sa24"
No Customer Response
```

↓

```text id="sa25"
Follow-Up Period
```

↓

```text id="sa26"
Automatic Cancellation
```

according to business rules.

---

# Automatic Cancellation

Examples:

* No Response
* Unreachable Customer
* Approval Expired

The cancellation reason should be recorded.

---

# Approval Expiration

The business may define:

```text id="sa27"
Approval Expiration Period
```

Example:

```text id="sa28"
7 Days
```

or

```text id="sa29"
14 Days
```

depending on policy.

---

# Customer Phone Updates

If a customer originally provides no phone number but later contacts the business regarding the repair:

```text id="sa30"
Phone Number May Be Added
```

to the customer profile.

The new number becomes part of future communication records.

---

# Approval Audit Trail

The platform should maintain:

* Approval History
* Rejection History
* Estimate History
* Communication History

---

# Service Continuation Rules

The service may continue only when:

```text id="sa31"
Latest Estimate
=
Approved
```

---

# Service Stop Rules

The service should stop when:

```text id="sa32"
Latest Estimate
=
Rejected
```

until further action is taken.

---

# Technician Protection

Approval history protects technicians by providing evidence that:

* Cost was disclosed.
* Time estimate was disclosed.
* Customer accepted the proposal.

---

# Business Protection

Approval history protects the business against disputes involving:

* Pricing
* Additional Damage
* Repair Scope
* Completion Time

---

# Search Capabilities

Users should be able to search approval records by:

* Service Order
* Customer
* Approval Status
* Estimate Version
* Date Range

---

# Audit Requirements

The following should remain auditable:

* Approval Requests
* Approval Responses
* Rejections
* Approval Expirations
* Automatic Cancellations

---

# Governance Rules

## Rule 1

Repair work requiring approval must not proceed without approval.

---

## Rule 2

Estimate revisions require a new approval.

---

## Rule 3

Approval history must never be deleted.

---

## Rule 4

The latest approved estimate governs repair execution.

---

## Rule 5

No response may result in automatic cancellation according to business policy.

---

# Relationship to Other Modules

This module works together with:

* Service Intake
* Service Orders
* Service Diagnosis
* Service Estimation
* Service Cancellation
* Customer Module

Service Approval provides the authorization layer for repair activities and estimate changes.

---

# Summary

Service Approval defines how customer authorization is obtained, recorded, versioned, and audited throughout the repair lifecycle.

The framework supports both initial approvals and estimate revision approvals while protecting customers, technicians, and the business.
