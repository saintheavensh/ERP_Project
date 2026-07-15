---

document_id: B05-SVC-004
title: Service Diagnosis
version: 1.0.0
last_updated: 2026-06-27
author: Universal Service ERP Team
----------------------------------

# Service Diagnosis

## Purpose

This document defines diagnosis activities within the Universal Service ERP.

The objective is to identify device problems, determine repair requirements, support estimation, and provide technical findings throughout the service lifecycle.

---

# Overview

Diagnosis is the process of evaluating a device to determine:

* Root Cause
* Repair Requirements
* Spare Part Requirements
* Repair Feasibility
* Estimated Cost

Diagnosis may occur multiple times during a service.

---

# Core Principle

```text id="sd1"
Diagnosis
Is Not
Always Final
```

Initial findings may change after further inspection.

---

# Objectives

The Diagnosis Framework is designed to:

* Identify faults.
* Support repair decisions.
* Support estimation.
* Support approval processes.
* Support technician documentation.
* Improve repair accuracy.

---

# Diagnosis Lifecycle

Standard flow:

```text id="sd2"
Complaint
      ↓
Initial Diagnosis
      ↓
Estimate
      ↓
Approval
      ↓
Disassembly
      ↓
Advanced Diagnosis
      ↓
Estimate Revision
      ↓
Approval Revision
```

---

# Diagnosis Types

The platform should support:

```text id="sd3"
Initial Diagnosis
```

and

```text id="sd4"
Advanced Diagnosis
```

---

# Initial Diagnosis

Purpose:

```text id="sd5"
Estimate Before Repair
```

Performed before:

```text id="sd6"
Service Order Creation
```

or immediately before approval.

---

# Initial Diagnosis Activities

Examples:

* Visual Inspection
* Functional Testing
* Customer Interview
* Basic Measurements

---

# Initial Diagnosis Example

Complaint:

```text id="sd7"
No Charging
```

Diagnosis:

```text id="sd8"
Possible Charging Port Damage
```

Estimate:

```text id="sd9"
Rp150.000
```

---

# Initial Diagnosis Limitations

Some defects cannot be confirmed until:

```text id="sd10"
Device Opened
```

or

```text id="sd11"
Component Tested
```

---

# Advanced Diagnosis

Purpose:

```text id="sd12"
Confirm Actual Damage
```

Performed after:

```text id="sd13"
Disassembly
```

or deeper testing.

---

# Advanced Diagnosis Activities

Examples:

* Board Inspection
* Component Testing
* Current Measurement
* Signal Tracing
* Internal Inspection

---

# Advanced Diagnosis Example

Initial Diagnosis:

```text id="sd14"
Charging Port Damage
```

After inspection:

```text id="sd15"
Charging IC Damage
```

```text id="sd16"
PCB Trace Damage
```

New estimate required.

---

# Diagnosis Revision

A diagnosis may be revised.

Example:

```text id="sd17"
Diagnosis V1
```

↓

```text id="sd18"
Diagnosis V2
```

↓

```text id="sd19"
Diagnosis V3
```

Historical versions should remain available.

---

# Diagnosis Findings

Each diagnosis may contain:

* Symptoms
* Findings
* Root Cause
* Recommendations
* Repair Notes

---

# Symptom Recording

Example:

```text id="sd20"
Cannot Charge
```

```text id="sd21"
Screen Flickering
```

```text id="sd22"
No Power
```

Symptoms represent observed behavior.

---

# Root Cause Recording

Example:

```text id="sd23"
Battery Failure
```

```text id="sd24"
LCD Failure
```

```text id="sd25"
Charging IC Failure
```

Root cause represents technician conclusions.

---

# Spare Part Recommendations

Diagnosis may recommend:

```text id="sd26"
Battery Replacement
```

```text id="sd27"
LCD Replacement
```

```text id="sd28"
Charging IC Replacement
```

---

# Repair Feasibility

Diagnosis should indicate:

```text id="sd29"
Repairable
```

or

```text id="sd30"
Not Repairable
```

---

# Beyond Economic Repair

Example:

```text id="sd31"
Repair Cost Exceeds Device Value
```

Technicians may recommend:

```text id="sd32"
Not Recommended
```

while allowing customers to decide.

---

# Estimate Impact

Diagnosis directly affects:

```text id="sd33"
Estimate
```

and

```text id="sd34"
Approval
```

workflows.

---

# Approval Trigger

When diagnosis changes:

```text id="sd35"
Estimate Revision Required
```

↓

```text id="sd36"
Customer Approval Required
```

before work continues.

---

# Technician Responsibility

Diagnosis should record:

* Technician
* Date
* Findings
* Recommendations

---

# Diagnosis Timeline Example

```text id="sd37"
09:00
Initial Diagnosis
```

↓

```text id="sd38"
09:30
Estimate V1
```

↓

```text id="sd39"
10:00
Approval
```

↓

```text id="sd40"
10:20
Advanced Diagnosis
```

↓

```text id="sd41"
Estimate V2
```

↓

```text id="sd42"
Approval Revision
```

---

# Search Capabilities

Users should be able to search diagnosis records by:

* Device
* Technician
* Service Order
* Date Range
* Diagnosis Type

---

# Historical Integrity

Diagnosis records should never be deleted.

Historical findings should remain visible.

---

# Audit Requirements

The following should remain auditable:

* Diagnosis Creation
* Diagnosis Revisions
* Technician Changes
* Recommendation Changes

---

# Governance Rules

## Rule 1

Diagnosis may occur multiple times during a service.

---

## Rule 2

Initial Diagnosis and Advanced Diagnosis should remain distinguishable.

---

## Rule 3

Diagnosis revisions should remain visible.

---

## Rule 4

Diagnosis changes affecting cost require estimate revision.

---

## Rule 5

Historical diagnosis records must never be deleted.

---

# Relationship to Other Modules

This module works together with:

* Service Intake
* Service Orders
* Estimation Module
* Approval Module
* Technician Module

Diagnosis provides the technical foundation for repair decisions and service execution.

---

# Summary

Service Diagnosis defines how technical findings are recorded, revised, and managed throughout the repair process.

The framework supports both initial and advanced diagnosis, recognizes that findings may evolve during repair, and ensures that all diagnosis activities remain traceable, auditable, and linked to service decisions.
