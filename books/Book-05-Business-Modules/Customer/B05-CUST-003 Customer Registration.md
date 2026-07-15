---

document_id: B05-CUST-003
title: Customer Registration
version: 1.0.0
last_updated: 2026-06-27
author: Universal Service ERP Team
----------------------------------

# Customer Registration

## Purpose

This document defines the customer registration process within the Universal Service ERP.

Customer registration establishes the customer record used throughout service, sales, warranty, invoicing, payment, and communication processes.

The registration process is designed to be practical, fast, and suitable for real-world phone repair operations.

---

# Overview

Customer registration is the process of creating a customer record.

The objective is to collect sufficient information to identify the customer while minimizing unnecessary data entry.

The system should prioritize operational efficiency.

---

# Objectives

The Customer Registration Framework is designed to:

* Create customer records quickly.
* Minimize customer waiting time.
* Reduce registration friction.
* Support service operations.
* Support future customer history tracking.
* Reduce duplicate customer records.

---

# Registration Principles

## Principle 1

Customer registration should be fast.

---

## Principle 2

Only essential information should be required.

---

## Principle 3

Missing optional information should not block operations.

---

## Principle 4

Customer registration should not delay service intake.

---

## Principle 5

Duplicate customer records should be minimized.

---

# Registration Triggers

Customer registration may occur when:

```text id="cr1"
Service Order Creation
```

```text id="cr2"
Sales Transaction Creation
```

```text id="cr3"
Manual Customer Creation
```

The most common scenario is service intake.

---

# Required Information

Minimum required information:

| Field         | Required |
| ------------- | -------- |
| Customer Name | Yes      |

Example:

```text id="cr4"
Budi
```

or

```text id="cr5"
Pak Andi
```

or

```text id="cr6"
Toko Jaya Cell
```

---

# Optional Information

The following information is optional.

| Field           | Required |
| --------------- | -------- |
| Phone Number    | No       |
| Email Address   | No       |
| Address         | No       |
| Identity Number | No       |
| Notes           | No       |

The system should allow customer creation even if all optional fields are empty.

---

# Phone Number Policy

Phone number is optional.

Reason:

```text id="cr7"
Not every customer wants to provide a phone number.
```

Business operations should continue normally.

---

## Missing Phone Number Warning

If no phone number is provided:

```text id="cr8"
Customer has no phone number.
Service updates and notifications cannot be sent.
```

This warning should not block registration.

---

# Email Policy

Email is optional.

Reason:

```text id="cr9"
Most repair customers do not use email for service communication.
```

The system should not require email addresses.

---

# Customer Identifier Generation

After registration:

```text id="cr10"
Customer Created
        ↓
Generate Customer ID
```

Example:

```text id="cr11"
CUST-000001
CUST-000002
CUST-000003
```

Customer IDs should be unique and permanent.

---

# Existing Customer Search

Before creating a customer:

```text id="cr12"
Search Existing Customer
```

Search may use:

* Customer Name
* Phone Number
* Customer ID
* Device IMEI

---

# Duplicate Detection

The system should attempt to detect possible duplicates.

Examples:

```text id="cr13"
Same Phone Number
```

```text id="cr14"
Same Name + Same Device
```

If potential duplicates are found:

```text id="cr15"
Possible Duplicate Customer Found
```

Users may:

```text id="cr16"
Use Existing Record
```

or

```text id="cr17"
Create New Record
```

based on business judgment.

---

# Walk-In Customer Registration

Typical service workflow:

```text id="cr18"
Customer Arrives
        ↓
Customer Search
        ↓
Found?
    ├── Yes
    │      ↓
    │ Use Existing Customer
    │
    └── No
           ↓
      Create Customer
           ↓
      Continue Service Intake
```

This is the most common registration process.

---

# Customer Name Policy

The system should allow:

```text id="cr19"
Personal Names
```

```text id="cr20"
Nicknames
```

```text id="cr21"
Business Names
```

Examples:

```text id="cr22"
Budi
Pak Andi
Asep
Jaya Cell
Toko Maju
```

Customer registration should reflect real operational practices.

---

# Registration Audit Requirements

The following should be recorded:

* Customer ID
* Creation Date
* Created By
* Registration Source
* Last Modified Date

This information supports auditing and accountability.

---

# Registration Governance Rules

## Rule 1

Customer Name is required.

---

## Rule 2

Phone Number is optional.

---

## Rule 3

Email Address is optional.

---

## Rule 4

Customer records should not be physically deleted.

---

## Rule 5

Customer IDs must be unique.

---

## Rule 6

Duplicate customer records should be minimized.

---

# Relationship to Other Modules

This module works together with:

* Device Module
* Service Module
* Sales Module
* Warranty Module
* Finance Module

Customer registration serves as the entry point for most customer-related activities.

---

# Summary

Customer Registration establishes customer records used throughout the Universal Service ERP.

The registration process prioritizes speed, simplicity, and operational practicality by requiring only a customer name while allowing phone numbers, email addresses, and other information to remain optional.
