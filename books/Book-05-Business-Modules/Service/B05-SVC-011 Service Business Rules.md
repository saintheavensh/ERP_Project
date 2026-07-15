---

document_id: B05-SVC-011
title: Service Business Rules
version: 1.0.0
last_updated: 2026-06-27
author: Universal Service ERP Team
----------------------------------

# Service Business Rules

## Purpose

This document defines the operational business rules governing the Service Module within the Universal Service ERP.

These rules provide consistent behavior across all service-related workflows.

---

# Overview

Service operations involve:

* Customer Registration
* Device Intake
* Diagnosis
* Estimation
* Approval
* Repair Execution
* Quality Control
* Completion
* Cancellation

The rules in this document apply across all service stages.

---

# Core Principle

```text
Business Rules
Override Workflow Convenience
```

Operational consistency and data integrity take priority over speed when conflicts occur.

---

# Customer Rules

## Customer Phone Number

Phone number is:

```text
Optional
```

during customer registration.

Customers may be registered without a phone number.

---

# Customer Identification Priority

When searching for customers:

Priority order:

```text
1. Phone Number
2. Customer Name
3. Device IMEI
```

---

# Phone Number Rule

If a phone number exists:

```text
Phone Number
=
Primary Customer Identifier
```

---

# Customer Without Phone Number

Customers may still:

* Create Service Requests
* Approve Repairs
* Collect Devices
* Receive Warranty

without providing a phone number.

---

# Phone Number Acquisition Rule

If a customer originally has no phone number and later contacts the business using:

* WhatsApp
* Telephone
* Messaging Services

the business may update:

```text
Customer Phone Number
```

into the customer profile.

---

# Customer Name Rule

Customer names may be:

* Legal Names
* Nicknames
* Common Names

Formal legal names are not mandatory.

---

# Duplicate Customer Prevention

The platform should attempt duplicate detection using:

* Phone Number
* Name Similarity
* Device History

while allowing manual override.

---

# Device Intake Rules

## Intake Before Service Order

Every repair begins with:

```text
Service Intake
```

not Service Order creation.

---

# Intake Number Rule

Example:

```text
INT-20260709-0001
```

must be generated before approval.

---

# Service Order Rule

A Service Order may only be created after:

```text
Diagnosis
+
Estimate
+
Approval
```

---

# Service Number Rule

Example:

```text
SVC-20260709-0001
```

must be generated after approval.

---

# Diagnosis Rules

## Diagnosis Is Not Final

Initial diagnosis may change.

Additional findings discovered after disassembly are valid.

---

# Additional Damage Rule

If additional damage is discovered:

```text
Estimate Revision
Required
```

---

# Estimation Rules

## Estimate Before Repair

Repair requiring approval must not proceed without an estimate.

---

# Estimate Versioning

The platform should support:

```text
Estimate V1
Estimate V2
Estimate V3
```

and future revisions.

Historical estimates must remain visible.

---

# Pricing Rules

## Minimum Service Price

Service categories may define:

```text
Minimum Selling Price
```

---

# Below Minimum Rule

The platform should block:

```text
Selling Price
<
Minimum Service Price
```

unless authorized.

---

# Spare Part Cost Protection

The platform should block:

```text
Selling Price
<
Part Cost
```

unless authorized.

---

# Approval Rules

## Initial Approval

Required to create a Service Order.

---

# Revision Approval

Required when estimate changes.

---

# Approval Rule

```text
No Approval
No Repair
```

---

# Execution Rules

## Deferred Spare Part Recording

Technicians may:

```text
Start Repair First
```

and

```text
Record Parts Later
```

during repair.

---

# Completion Validation

Services using spare parts cannot be completed until all consumed parts are recorded.

---

# Additional Damage Rule

Repair must pause when:

```text
Estimate Revision
Pending Approval
```

---

# Scheduling Rules

## Estimated Completion Date

Every Service Order should support:

```text
Estimated Completion Date
```

---

# Technician Calendar

Service Orders should appear in technician schedules.

---

# Technician Performance Rules

Technician performance should measure:

* Completion Rate
* On-Time Rate
* QC Pass Rate

---

# Excluded Delays

The following should not negatively affect technician performance:

```text
Waiting Spare Part
```

```text
Waiting Approval
```

```text
Additional Damage
```

```text
External Vendor Delay
```

---

# Quality Control Rules

## QC Requirement

Repairs should pass QC before completion.

---

# QC Modes

Supported modes:

```text
Self
```

```text
Independent
```

```text
Either
```

configured through system settings.

---

# Completion Rules

## Ready For Pickup

Ready For Pickup does not equal completion.

---

# Device Release Verification

The business should verify customer identity before releasing a device.

---

# Accepted Verification Methods

Examples:

* Service Receipt
* Device Unlock
* Government Identification

---

# Unlock Rule

If a customer successfully unlocks the device:

```text
Unlock Verification
```

may be considered sufficient according to business policy.

---

# Warranty Rule

Warranty begins after:

```text
Completed
```

status is reached.

---

# Cancellation Rules

## Canceled Does Not Mean Deleted

Canceled services must remain visible.

---

# Cancellation Classification

Every cancellation should contain:

* Category
* Reason

---

# Automatic Cancellation

The system may automatically cancel:

* Approval Expired
* No Response
* Collection Expired

according to business policy.

---

# Reporting Rules

The platform should support reporting for:

* Service Volume
* Service Revenue
* Technician Performance
* Cancellation Analysis
* Service Categories
* Spare Part Usage

---

# Audit Rules

The following records must never be deleted:

* Intake Records
* Service Orders
* Estimates
* Approvals
* QC Records
* Completion Records
* Cancellation Records

---

# Historical Integrity Rule

The platform should prioritize:

```text
Historical Preservation
```

over physical deletion.

Soft deletion and status changes are preferred.

---

# Governance Rules

## Rule 1

Every repair begins with an Intake.

---

## Rule 2

Every Service Order requires approval.

---

## Rule 3

Estimate revisions require approval.

---

## Rule 4

Phone numbers are optional.

---

## Rule 5

If available, phone numbers become the primary customer identifier.

---

## Rule 6

Spare parts may be recorded after repair starts but before completion.

---

## Rule 7

QC mode must be configurable.

---

## Rule 8

Canceled records must never be deleted.

---

## Rule 9

Historical records must remain auditable.

---

# Relationship to Other Modules

This document governs:

* Customer Module
* Device Module
* Service Module
* Inventory Module
* Technician Module
* Reporting Module
* Warranty Module

---

# Summary

Service Business Rules establish the operational policies that govern all service workflows.

These rules ensure consistency, protect profitability, support technician productivity, preserve historical data, and provide a flexible framework suitable for both small repair shops and larger service organizations.
