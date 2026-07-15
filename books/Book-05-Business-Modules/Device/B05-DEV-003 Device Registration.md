---

document_id: B05-DEV-003
title: Device Registration
version: 1.0.0
last_updated: 2026-06-27
author: Universal Service ERP Team
----------------------------------

# Device Registration

## Purpose

This document defines how devices are registered within the Universal Service ERP.

The objective is to ensure every device that enters the business can be identified, tracked, analyzed, and reported regardless of whether the repair ultimately proceeds.

---

# Overview

A device record should be created as early as possible.

Device registration occurs during:

```text id="dr1"
Service Intake
```

before repair approval decisions are made.

This allows the business to track:

* Approved Repairs
* Rejected Repairs
* Diagnostic Activities
* Lost Opportunities
* Customer Decisions

---

# Objectives

The Device Registration Framework is designed to:

* Create permanent device records.
* Improve traceability.
* Support diagnosis history.
* Support warranty validation.
* Measure conversion rates.
* Measure lost business opportunities.

---

# Registration Principle

Core principle:

```text id="dr2"
Every Device Entering The Shop
Should Be Registered
```

regardless of repair outcome.

---

# Registration Workflow

Standard flow:

```text id="dr3"
Customer Arrives
        ↓
Device Intake
        ↓
Device Search
        ↓
Existing?
 ├── Yes
 │      ↓
 │ Reuse Device Record
 │
 └── No
        ↓
   Create Device Record
```

---

# Registration Timing

Device registration occurs before:

```text id="dr4"
Diagnosis
```

and before:

```text id="dr5"
Repair Approval
```

This ensures complete operational visibility.

---

# Required Registration Data

Minimum requirements:

| Field       | Required |
| ----------- | -------- |
| Device Type | Yes      |
| Brand       | Yes      |
| Model       | Yes      |
| Customer    | Yes      |
| Intake Date | Yes      |

---

# Optional Registration Data

Optional fields:

* IMEI
* Serial Number
* Color
* Storage Capacity
* Notes
* Device Condition

The absence of optional fields must not block registration.

---

# Device Search Before Registration

The system should search:

```text id="dr6"
IMEI
```

then

```text id="dr7"
Serial Number
```

then

```text id="dr8"
Customer Device History
```

before creating a new device.

---

# Existing Device Scenario

Example:

```text id="dr9"
Samsung A54
IMEI:
123456789012345
```

already exists.

The platform should reuse:

```text id="dr10"
Existing Device Record
```

rather than creating a duplicate.

---

# New Device Scenario

Example:

```text id="dr11"
New Customer
```

or

```text id="dr12"
New Device
```

The platform creates:

```text id="dr13"
New Device Record
```

---

# Diagnostic-Only Scenario

Example:

```text id="dr14"
Customer Requests Inspection
```

Technician diagnoses:

```text id="dr15"
LCD Damaged
```

Estimate:

```text id="dr16"
Rp 1.500.000
```

Customer declines repair.

Result:

```text id="dr17"
Device Record Remains
```

and diagnosis history remains available.

---

# Service Rejection Tracking

Examples:

```text id="dr18"
Canceled - Price
```

```text id="dr19"
Canceled - No Sparepart
```

```text id="dr20"
Canceled - Customer Declined
```

```text id="dr21"
Canceled - No Response
```

These outcomes should remain linked to the device.

---

# Business Intelligence Benefits

The platform should support analysis such as:

```text id="dr22"
How Many Devices Entered?
```

```text id="dr23"
How Many Became Repairs?
```

```text id="dr24"
How Many Were Rejected?
```

```text id="dr25"
Why Were Repairs Lost?
```

---

# Device Intake Information

Registration may include:

```text id="dr26"
Reported Complaint
```

Example:

```text id="dr27"
No Charging
```

```text id="dr28"
LCD Blank
```

```text id="dr29"
Bootloop
```

These complaints become part of device history.

---

# Registration Audit Trail

The system should record:

* Intake Employee
* Intake Date
* Registration Source
* Device Changes

All registration activities should be auditable.

---

# Device Record Persistence

Once created:

```text id="dr30"
Device Record
```

should never be physically deleted.

Even if:

```text id="dr31"
Repair Rejected
```

or

```text id="dr32"
Device Never Returns
```

the record remains available.

---

# Governance Rules

## Rule 1

Every incoming device should be registered.

---

## Rule 2

Device registration occurs before repair approval.

---

## Rule 3

Rejected repairs should remain visible.

---

## Rule 4

Device history should remain permanent.

---

## Rule 5

Device records should not be physically deleted.

---

# Relationship to Other Modules

This module works together with:

* Customer Module
* Service Intake
* Service Module
* Warranty Module
* Reporting Module

Device Registration acts as the first operational step in the device lifecycle.

---

# Summary

Device Registration establishes permanent device records at the earliest stage of customer interaction.

By registering all incoming devices, the platform gains complete visibility into repair conversions, rejected repairs, diagnostic activities, and long-term device history.
