---

document_id: B05-CUST-009
title: Duplicate Customer Management
version: 1.0.0
last_updated: 2026-06-27
author: Universal Service ERP Team
----------------------------------

# Duplicate Customer Management

## Purpose

This document defines how duplicate customer records are detected, managed, prevented, and resolved within the Universal Service ERP.

The objective is to maintain data quality while remaining practical for real-world service operations.

---

# Overview

Duplicate customers occur when the same customer is registered multiple times.

Examples:

```text id="dcm1"
Budi
```

```text id="dcm2"
Pak Budi
```

```text id="dcm3"
Budi HP
```

```text id="dcm4"
Budi (Samsung)
```

These records may represent the same person.

The platform should help users identify potential duplicates while avoiding unnecessary operational complexity.

---

# Objectives

The Duplicate Customer Management Framework is designed to:

* Improve customer data quality.
* Reduce duplicate records.
* Preserve customer history.
* Improve search accuracy.
* Improve reporting accuracy.
* Support operational efficiency.

---

# Duplicate Prevention Principles

## Principle 1

The system should warn users about possible duplicates.

---

## Principle 2

The system should not block customer registration automatically.

---

## Principle 3

Employees should make the final decision.

---

## Principle 4

Historical records must be preserved.

---

## Principle 5

Duplicate management should not slow customer intake.

---

# Common Causes of Duplicates

Examples:

```text id="dcm5"
Customer Uses Different Names
```

Examples:

```text id="dcm6"
Budi
Pak Budi
Om Budi
```

---

```text id="dcm7"
Customer Has No Phone Number
```

---

```text id="dcm8"
Customer Uses Different Phone Numbers
```

---

```text id="dcm9"
Customer Registered By Different Employees
```

---

# Duplicate Detection Methods

The platform may compare:

* Customer Name
* Phone Number
* Device IMEI
* Address
* Previous Service Records

---

# Name Similarity Detection

Examples:

```text id="dcm10"
Budi
Pak Budi
```

Potential duplicate.

---

```text id="dcm11"
Andi
Andi Cell
```

Possible duplicate.

---

The system should generate warnings only.

---

# Phone Number Detection

Example:

```text id="dcm12"
08123456789
```

already exists.

The system should display:

```text id="dcm13"
Possible Existing Customer Found
```

---

# Device-Based Detection

Example:

```text id="dcm14"
IMEI:
123456789012345
```

already associated with another customer.

The system should display:

```text id="dcm15"
Device Previously Registered
```

This does not automatically indicate fraud.

Possible scenarios:

* Device sold
* Family member ownership
* Name variation

Employees should decide how to proceed.

---

# Customer Search Before Registration

Recommended workflow:

```text id="dcm16"
Customer Arrives
        ↓
Search Customer
        ↓
Found?
    ├── Yes
    │      ↓
    │ Use Existing Record
    │
    └── No
           ↓
      Create Customer
```

This is the primary duplicate prevention mechanism.

---

# Duplicate Warning Examples

Example:

```text id="dcm17"
Customer Name Similar
```

---

Example:

```text id="dcm18"
Phone Number Match
```

---

Example:

```text id="dcm19"
Same Device IMEI
```

---

Warnings should assist employees without interrupting operations.

---

# Customer Merge Concept

In certain situations:

```text id="dcm20"
Customer A
```

and

```text id="dcm21"
Customer B
```

are confirmed to be the same person.

The system may support:

```text id="dcm22"
Customer Merge
```

---

# Merge Rules

Example:

```text id="dcm23"
Customer A
    ↓
Service History
```

```text id="dcm24"
Customer B
    ↓
Warranty History
```

After merge:

```text id="dcm25"
Single Customer
        ↓
Combined History
```

No historical records should be lost.

---

# Merge Authorization

Customer merging should be restricted.

Allowed roles:

```text id="dcm26"
Manager
```

```text id="dcm27"
Owner
```

Regular employees should not perform merges.

---

# Historical Integrity

After merging:

* Service History remains intact.
* Warranty History remains intact.
* Payment History remains intact.
* Audit History remains intact.

Traceability must be preserved.

---

# Customer Alias Concept

Because many customers use nicknames:

Examples:

```text id="dcm28"
Budi
```

```text id="dcm29"
Pak Budi
```

```text id="dcm30"
Budi Samsung
```

The platform may support aliases for improved searching.

Aliases improve usability without creating additional customer records.

---

# Audit Requirements

The following should remain auditable:

* Duplicate Warnings
* Merge Operations
* Alias Creation
* Customer Record Changes

---

# Governance Rules

## Rule 1

Duplicate warnings should not block operations.

---

## Rule 2

Employees should decide whether to create a new customer.

---

## Rule 3

Customer merges should require authorization.

---

## Rule 4

Historical records must never be lost.

---

## Rule 5

Customer searches should occur before registration whenever possible.

---

# Relationship to Other Modules

This module works together with:

* Customer Registration
* Customer Profile
* Service Module
* Warranty Module
* Finance Module

Duplicate management improves data quality throughout the ERP.

---

# Summary

Duplicate Customer Management helps maintain customer data quality by detecting potential duplicates, supporting customer searches, and allowing controlled customer merges.

The framework prioritizes operational practicality while preserving historical integrity and minimizing disruption to service operations.
