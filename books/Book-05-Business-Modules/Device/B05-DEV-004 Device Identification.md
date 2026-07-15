---

document_id: B05-DEV-004
title: Device Identification
version: 1.0.0
last_updated: 2026-06-27
author: Universal Service ERP Team
----------------------------------

# Device Identification

## Purpose

This document defines how devices are uniquely identified within the Universal Service ERP.

The objective is to prevent duplicate device records, improve traceability, support repair history tracking, and maintain long-term device identity.

---

# Overview

A device may return to the business many times throughout its lifetime.

To maintain a complete history, the platform must be able to identify whether a device has been seen before.

Device identification allows the system to determine:

```text id="di1"
Existing Device
```

or

```text id="di2"
New Device
```

before creating records.

---

# Objectives

The Device Identification Framework is designed to:

* Prevent duplicate devices.
* Maintain service history.
* Maintain warranty history.
* Improve customer support.
* Support repeat repair analysis.
* Improve reporting accuracy.

---

# Identification Principles

## Principle 1

One physical device should correspond to one device record whenever identification is possible.

---

## Principle 2

Device history should remain attached to the device.

---

## Principle 3

Identification should not block operations.

---

## Principle 4

The system should support incomplete device information.

---

# Device Identity Priority

The platform should identify devices using the following priority order:

```text id="di3"
Priority 1
IMEI
```

```text id="di4"
Priority 2
Serial Number
```

```text id="di5"
Priority 3
Customer Device History
```

```text id="di6"
Priority 4
Manual Verification
```

---

# IMEI Identification

IMEI is the preferred identifier for mobile devices.

Example:

```text id="di7"
IMEI:
123456789012345
```

The platform should search for existing matches before creating a new device.

---

# Dual SIM Devices

Some devices contain:

```text id="di8"
IMEI 1
```

and

```text id="di9"
IMEI 2
```

Example:

```text id="di10"
IMEI1:
123456789012345

IMEI2:
123456789012346
```

Both values should be stored.

Either IMEI should be searchable.

---

# Serial Number Identification

For devices without IMEI:

```text id="di11"
Serial Number
```

may be used.

Examples:

* Laptop
* Tablet
* Smart Watch

---

# Customer Device History Matching

If IMEI is unavailable:

The system may search:

```text id="di12"
Customer
```

*

```text id="di13"
Brand
```

*

```text id="di14"
Model
```

to identify possible matches.

---

# Manual Verification

Employees may determine:

```text id="di15"
Same Device
```

or

```text id="di16"
Different Device
```

when automatic matching is inconclusive.

---

# Identification Examples

Example:

```text id="di17"
Customer:
Budi

Device:
Samsung A54

IMEI:
123456789012345
```

Match found:

```text id="di18"
Reuse Existing Device Record
```

---

Example:

```text id="di19"
Customer:
Budi

Device:
Samsung A54

IMEI:
NULL
```

Potential match:

```text id="di20"
Manual Verification Required
```

---

# Duplicate Detection

The platform should warn users when:

```text id="di21"
Same IMEI Found
```

or

```text id="di22"
Same Serial Number Found
```

Warnings help prevent duplicate records.

---

# Identification Failure Scenario

Sometimes:

```text id="di23"
IMEI Missing
```

and

```text id="di24"
Serial Number Missing
```

In these situations:

```text id="di25"
Temporary Device Identification
```

may be used.

Operations should continue.

---

# Device Record Continuity

The purpose of identification is to maintain:

```text id="di26"
One Device
      ↓
Many Services
```

rather than:

```text id="di27"
Many Duplicate Devices
```

---

# Device History Preservation

When a device is identified successfully:

The following histories remain connected:

* Service History
* Warranty History
* Technician History
* Spare Part History
* Diagnosis History

---

# Search Capabilities

Users should be able to search devices using:

* IMEI
* IMEI 2
* Serial Number
* Customer Name
* Phone Number
* Brand
* Model

---

# Audit Requirements

The following should remain auditable:

* Device Creation
* Device Matching
* Device Merge
* Device Updates

---

# Governance Rules

## Rule 1

IMEI should be used whenever available.

---

## Rule 2

Duplicate device records should be avoided.

---

## Rule 3

Identification should not interrupt service intake.

---

## Rule 4

Manual verification should be allowed.

---

## Rule 5

Device history must remain traceable.

---

# Relationship to Other Modules

This module works together with:

* Customer Module
* Service Intake
* Service Module
* Warranty Module
* Reporting Module

Device Identification ensures continuity of all device-related records throughout the ERP.

---

# Summary

Device Identification establishes how devices are recognized, matched, and reused within the Universal Service ERP.

The framework prioritizes IMEI-based identification while remaining flexible enough to support incomplete data and real-world service shop workflows.
