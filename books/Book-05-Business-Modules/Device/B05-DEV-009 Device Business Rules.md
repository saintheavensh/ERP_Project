---

document_id: B05-DEV-009
title: Device Business Rules
version: 1.0.0
last_updated: 2026-06-27
author: Universal Service ERP Team
----------------------------------

# Device Business Rules

## Purpose

This document defines the business rules governing device management within the Universal Service ERP.

The objective is to ensure consistent device handling, accurate traceability, reliable service history management, and operational control across all modules.

---

# Overview

Devices are core business entities.

Every repair, diagnosis, warranty claim, technician activity, and service event ultimately relates to a device.

These rules define how devices are created, identified, tracked, updated, and managed throughout their lifecycle.

---

# Device Registration Rules

## Rule 1

Every device entering the shop should be registered.

Examples:

* Diagnosis Only
* Repair Request
* Warranty Claim
* Inspection

Registration should occur regardless of repair outcome.

---

## Rule 2

A device record should be created before repair approval.

Registration occurs during:

```text id="dbr1"
Service Intake
```

---

## Rule 3

Device records should remain available even when repairs are canceled.

---

# Device Identification Rules

## Rule 4

The system should attempt identification before creating a new device.

Search order:

```text id="dbr2"
IMEI
```

↓

```text id="dbr3"
Serial Number
```

↓

```text id="dbr4"
Customer Device History
```

---

## Rule 5

Duplicate device records should be avoided whenever possible.

---

## Rule 6

Identification failures should not block operations.

---

# IMEI Rules

## Rule 7

IMEI should be recorded whenever available.

---

## Rule 8

Dual SIM devices should support:

```text id="dbr5"
IMEI 1
```

and

```text id="dbr6"
IMEI 2
```

---

## Rule 9

Either IMEI should be searchable.

---

# Ownership Rules

## Rule 10

A device may have multiple owners throughout its lifetime.

---

## Rule 11

Ownership changes must not affect device history.

---

## Rule 12

The current owner should remain visible.

---

## Rule 13

Ownership history should remain available.

---

# Service History Rules

## Rule 14

Every service event should become part of device history.

Examples:

* Diagnosis
* Repair
* Inspection
* Warranty Repair
* Cancellation

---

## Rule 15

Canceled services should remain visible.

---

## Rule 16

Diagnosis history should remain visible.

---

# Warranty Rules

## Rule 17

Warranty events should remain attached to devices.

---

## Rule 18

Warranty claims should remain permanently available.

---

## Rule 19

Warranty rejections should remain permanently available.

---

# Status Rules

## Rule 20

Device Status must remain separate from Service Status.

---

## Rule 21

A device should only have one active Device Status.

---

## Rule 22

Status changes should be auditable.

---

# Device Lifecycle Rules

## Rule 23

A device should maintain a permanent identity.

Preferred principle:

```text id="dbr7"
1 IMEI
=
1 Device
```

whenever identification is possible.

---

## Rule 24

A device may participate in multiple services over time.

Example:

```text id="dbr8"
2026
Battery Repair
```

```text id="dbr9"
2027
LCD Repair
```

```text id="dbr10"
2028
Charging Repair
```

All events remain attached to the same device.

---

# Device History Rules

## Rule 25

Device history should never be physically deleted.

---

## Rule 26

Historical service events should remain visible.

---

## Rule 27

Historical warranty events should remain visible.

---

## Rule 28

Historical ownership information should remain visible.

---

# Search Rules

## Rule 29

Users should be able to search devices using:

* IMEI
* IMEI 2
* Serial Number
* Customer Name
* Phone Number
* Brand
* Model

---

## Rule 30

Search should support partial matches whenever practical.

---

# Intake Rules

## Rule 31

Devices that do not proceed to repair should still remain recorded.

---

## Rule 32

The reason for cancellation should be recorded whenever available.

Examples:

```text id="dbr11"
Price Too Expensive
```

```text id="dbr12"
No Spare Part
```

```text id="dbr13"
Customer Declined
```

```text id="dbr14"
No Response
```

---

# Reporting Rules

## Rule 33

The system should support reporting of:

* Total Devices
* New Devices
* Returning Devices
* Canceled Repairs
* Warranty Claims

---

## Rule 34

Device reporting should support business intelligence analysis.

---

# Audit Rules

## Rule 35

The following actions should be auditable:

* Device Creation
* Device Updates
* Ownership Changes
* Status Changes
* Device Merges

---

# Security Rules

## Rule 36

Only authorized users may modify device records.

---

## Rule 37

Critical ownership changes should be logged.

---

# Governance Rules

## Rule 38

Device history takes priority over data cleanup.

---

## Rule 39

Device traceability should be preserved.

---

## Rule 40

Operational flexibility should not compromise historical integrity.

---

# Relationship to Other Modules

This module governs interactions with:

* Customer Module
* Service Module
* Warranty Module
* Technician Module
* Inventory Module
* Reporting Module

Device Business Rules establish the operational standards for device management throughout the ERP.

---

# Summary

Device Business Rules define how devices are identified, registered, tracked, updated, searched, and managed.

The framework ensures complete traceability, preserves historical integrity, supports warranty validation, and enables long-term visibility into the lifecycle of every device handled by the business.
