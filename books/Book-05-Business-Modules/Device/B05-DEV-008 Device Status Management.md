---

document_id: B05-DEV-008
title: Device Status Management
version: 1.0.0
last_updated: 2026-06-27
author: Universal Service ERP Team
----------------------------------

# Device Status Management

## Purpose

This document defines device status management within the Universal Service ERP.

The objective is to track the current physical state and location of a device while keeping it separate from service workflow status.

---

# Overview

A device and a service order represent different business entities.

Therefore:

```text id="dsm1"
Device Status
≠
Service Status
```

Device Status answers:

```text id="dsm2"
Where is the device now?
```

Service Status answers:

```text id="dsm3"
What is happening to the repair?
```

These concepts must remain separate.

---

# Objectives

The Device Status Framework is designed to:

* Track device location.
* Track device custody.
* Improve operational visibility.
* Prevent lost devices.
* Improve accountability.
* Support service workflows.

---

# Device Status Principles

## Principle 1

Device Status represents the current physical condition of the device within business operations.

---

## Principle 2

Device Status should not replace Service Status.

---

## Principle 3

A device should only have one active Device Status at a time.

---

## Principle 4

Status changes should be auditable.

---

# Device Status Lifecycle

Example:

```text id="dsm4"
Received
      ↓
Waiting Diagnosis
      ↓
With Technician
      ↓
Waiting Customer Decision
      ↓
In Repair
      ↓
Ready For Pickup
      ↓
Delivered
```

---

# Device Status Definitions

## Received

```text id="dsm5"
Received
```

The device has been accepted by the business.

The device is physically inside the shop.

---

## Waiting Diagnosis

```text id="dsm6"
Waiting Diagnosis
```

The device is waiting for technician inspection.

---

## With Technician

```text id="dsm7"
With Technician
```

The device is currently assigned to a technician.

---

## Waiting Customer Decision

```text id="dsm8"
Waiting Customer Decision
```

Diagnosis is complete.

The business is waiting for customer approval or rejection.

---

## Waiting Spare Part

```text id="dsm9"
Waiting Spare Part
```

Repair cannot proceed because required parts are unavailable.

---

## In Repair

```text id="dsm10"
In Repair
```

Repair activities are currently being performed.

---

## Quality Control

```text id="dsm11"
Quality Control
```

Repair has finished.

Testing and verification are being performed.

---

## Ready For Pickup

```text id="dsm12"
Ready For Pickup
```

The device is completed and waiting for collection.

---

## Delivered

```text id="dsm13"
Delivered
```

The device has been returned to the customer.

---

## Canceled

```text id="dsm14"
Canceled
```

The service process ended without repair completion.

Examples:

* Price Rejected
* No Response
* No Spare Part
* Customer Declined

---

# Device Custody Tracking

The platform should track:

```text id="dsm15"
Who Has The Device?
```

Examples:

```text id="dsm16"
Front Desk
```

```text id="dsm17"
Technician
```

```text id="dsm18"
Storage Area
```

---

# Device Location Tracking

The platform may track:

```text id="dsm19"
Front Counter
```

```text id="dsm20"
Repair Desk
```

```text id="dsm21"
Parts Waiting Area
```

```text id="dsm22"
Pickup Shelf
```

This helps prevent misplaced devices.

---

# Device Status History

Example:

```text id="dsm23"
08:00
Received

08:30
Waiting Diagnosis

09:00
With Technician

09:30
Waiting Customer Decision

10:00
In Repair

11:00
Ready For Pickup
```

All status changes should remain visible.

---

# Device Status vs Service Status

Example:

Device Status:

```text id="dsm24"
Ready For Pickup
```

Service Status:

```text id="dsm25"
Completed
```

These are related but not identical.

---

# Automatic Status Changes

Certain actions may trigger status updates.

Example:

```text id="dsm26"
Technician Starts Repair
```

Result:

```text id="dsm27"
Device Status:
In Repair
```

---

Example:

```text id="dsm28"
Repair Completed
```

Result:

```text id="dsm29"
Device Status:
Quality Control
```

---

# Device Recovery Scenario

Example:

```text id="dsm30"
No Customer Response
```

After business-defined timeout:

```text id="dsm31"
Device Status:
Canceled
```

The device record remains available.

---

# Search and Filtering

Users should be able to search devices by:

* Device Status
* Technician
* Customer
* IMEI
* Date Range

---

# Audit Requirements

The following should remain auditable:

* Status Changes
* Custody Changes
* Location Changes
* Manual Overrides

---

# Governance Rules

## Rule 1

Device Status and Service Status must remain separate.

---

## Rule 2

Only one active Device Status may exist at a time.

---

## Rule 3

All status changes should be logged.

---

## Rule 4

Device custody should remain traceable.

---

## Rule 5

Device history should never be deleted.

---

# Relationship to Other Modules

This module works together with:

* Device Module
* Service Module
* Technician Module
* Inventory Module
* Reporting Module

Device Status Management provides operational visibility into where devices are and who is responsible for them.

---

# Summary

Device Status Management tracks the physical and operational state of devices throughout their lifecycle.

By separating Device Status from Service Status, the platform maintains clearer workflows, stronger traceability, and more accurate operational reporting.
