---

document_id: B05-DEV-005
title: Device Ownership
version: 1.0.0
last_updated: 2026-06-27
author: Universal Service ERP Team
----------------------------------

# Device Ownership

## Purpose

This document defines device ownership management within the Universal Service ERP.

The objective is to maintain accurate relationships between customers and devices while preserving historical records and supporting real-world service shop operations.

---

# Overview

A device is normally associated with a customer.

However, device ownership may change over time.

Examples:

* Device sold to another person.
* Family members sharing devices.
* Device brought by a representative.
* Device ownership transferred.

The platform must preserve device history regardless of ownership changes.

---

# Objectives

The Device Ownership Framework is designed to:

* Track current ownership.
* Preserve historical ownership.
* Support device traceability.
* Support warranty verification.
* Support service history continuity.
* Reflect real-world ownership scenarios.

---

# Ownership Principles

## Principle 1

A device may have multiple owners throughout its lifetime.

---

## Principle 2

A device should maintain a single device history.

---

## Principle 3

Ownership changes must not destroy historical records.

---

## Principle 4

The person delivering a device may not be the owner.

---

# Basic Ownership Model

Relationship:

```text id="do1"
Customer
      ↓
Owns
      ↓
Device
```

This represents the current ownership relationship.

---

# Current Owner Concept

Each device should have:

```text id="do2"
Current Owner
```

Example:

```text id="do3"
Samsung A54
Current Owner:
Budi
```

The current owner is the primary customer associated with the device.

---

# Historical Ownership Concept

Ownership history should remain available.

Example:

```text id="do4"
2025
Owner:
Andi
```

```text id="do5"
2027
Owner:
Budi
```

The platform should preserve both records.

---

# Ownership Transfer Scenario

Example:

```text id="do6"
Customer A
      ↓
Device
```

Later:

```text id="do7"
Customer B
      ↓
Same Device
```

The system should update:

```text id="do8"
Current Owner
```

while preserving historical ownership information.

---

# Device History Preservation

Ownership transfer must not affect:

* Service History
* Warranty History
* Diagnosis History
* Technician History
* Spare Part History

All historical records remain attached to the device.

---

# Representative Scenario

Real-world example:

```text id="do9"
Phone Owner:
Wife
```

Device delivered by:

```text id="do10"
Husband
```

The platform should allow service intake without requiring ownership transfer.

---

# Family Ownership Scenario

Example:

```text id="do11"
Parent
      ↓
Registers Device
```

Later:

```text id="do12"
Child
      ↓
Uses Device
```

Operations should continue normally.

---

# Unknown Ownership Scenario

Sometimes ownership cannot be verified.

Example:

```text id="do13"
Second-Hand Device
```

or

```text id="do14"
Customer Does Not Know Original Owner
```

The platform should still allow registration.

---

# Ownership Verification

Ownership may be verified using:

* Phone Number
* Customer Records
* Device History
* Unlock Pattern
* Device Access

Verification should remain flexible.

---

# Pickup Verification

When collecting a repaired device:

The following may be accepted:

```text id="do15"
Customer Knows Device Unlock Pattern
```

or

```text id="do16"
Customer Provides Identification
```

depending on business policy.

---

# Ownership Change Audit

Ownership changes should record:

* Previous Owner
* New Owner
* Change Date
* Employee

This maintains accountability.

---

# Device-Customer Relationships

One customer may own:

```text id="do17"
Many Devices
```

Example:

```text id="do18"
Customer
 ├── Device A
 ├── Device B
 └── Device C
```

---

# Ownership Search

Users should be able to locate devices using:

* Current Owner
* Historical Owner
* Phone Number
* IMEI
* Device Model

---

# Ownership Timeline Example

```text id="do19"
2025
Owner:
Andi

2026
Battery Repair

2027
Ownership Transfer

2028
Owner:
Budi

2029
LCD Repair
```

The device history remains uninterrupted.

---

# Governance Rules

## Rule 1

Ownership changes must not affect device history.

---

## Rule 2

Current ownership should remain visible.

---

## Rule 3

Historical ownership should remain visible.

---

## Rule 4

Ownership verification should remain practical and flexible.

---

## Rule 5

Representatives should be allowed to deliver devices.

---

# Relationship to Other Modules

This module works together with:

* Customer Module
* Device Module
* Service Module
* Warranty Module
* Reporting Module

Device Ownership ensures that customer-device relationships remain accurate while preserving complete historical traceability.

---

# Summary

Device Ownership defines how devices are associated with customers throughout their lifetime.

The framework supports ownership transfers, representatives, shared devices, and long-term historical tracking while preserving service, warranty, and repair histories.
