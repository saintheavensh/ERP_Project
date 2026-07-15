---

document_id: B05-CUST-010
title: Customer Business Rules
version: 1.0.0
last_updated: 2026-06-27
author: Universal Service ERP Team
----------------------------------

# Customer Business Rules

## Purpose

This document defines the business rules governing customer management within the Universal Service ERP.

These rules ensure consistent customer handling, data quality, operational efficiency, and traceability across all modules.

---

# Overview

Customer records are foundational business entities.

Customers may:

* Own Devices
* Request Services
* Receive Warranties
* Purchase Products
* Make Payments

Customer business rules define how customer information is created, updated, searched, and managed.

---

# Customer Identity Rules

## Rule 1

Customer Name is required.

Example:

```text id="cbr1"
Budi
```

```text id="cbr2"
Pak Andi
```

```text id="cbr3"
Jaya Cell
```

Customer records cannot be created without a name.

---

## Rule 2

Phone Number is optional.

Customers may be registered without:

```text id="cbr4"
Phone Number
```

or

```text id="cbr5"
Email Address
```

Operations must continue normally.

---

## Rule 3

Phone Number becomes the primary customer identifier when available.

Example:

```text id="cbr6"
08123456789
```

The system should treat the phone number as the preferred customer lookup key.

---

## Rule 4

Phone Numbers should be unique whenever possible.

Example:

```text id="cbr7"
08123456789
```

already belongs to:

```text id="cbr8"
CUST-000125
```

The system should warn users before creating duplicates.

---

# Customer Search Rules

Customer search priority:

```text id="cbr9"
Priority 1
Phone Number
```

```text id="cbr10"
Priority 2
Customer Name
```

```text id="cbr11"
Priority 3
Device IMEI
```

This order reflects actual service shop operations.

---

# Customer Registration Rules

## Rule 5

Customer registration should be fast.

Only essential information should be required.

---

## Rule 6

Missing contact information must not block service intake.

Example:

```text id="cbr12"
Customer Name
```

alone is sufficient for registration.

---

## Rule 7

Customer registration should attempt duplicate detection before creating new records.

---

# Contact Information Rules

## Rule 8

Customer contact information may be added later.

Example:

```text id="cbr13"
Customer Registered
Without Phone Number
```

Later:

```text id="cbr14"
Customer Contacts Shop Through WhatsApp
```

The phone number may be added to the customer profile.

---

## Rule 9

Contact information updates should be auditable.

---

# Customer Ownership Rules

## Rule 10

A customer may own multiple devices.

Example:

```text id="cbr15"
Customer
    ├── iPhone 13
    ├── Samsung A54
    └── Oppo A78
```

---

## Rule 11

A device may accumulate multiple service records throughout its lifetime.

---

# Service Relationship Rules

## Rule 12

Customer service history must remain permanently traceable.

---

## Rule 13

Customer service records must not be physically deleted.

---

## Rule 14

Warranty records must remain linked to original service records.

---

# Communication Rules

## Rule 15

Customers are responsible for following up on repair progress.

Normal business operations do not require proactive notifications.

---

## Rule 16

Communication history should be recorded when available.

---

## Rule 17

The absence of communication channels must not prevent service operations.

---

# Duplicate Customer Rules

## Rule 18

Duplicate warnings should not block customer registration.

---

## Rule 19

Employees determine whether a new customer should be created.

---

## Rule 20

Customer merge operations require authorization.

Authorized roles:

```text id="cbr16"
Manager
```

```text id="cbr17"
Owner
```

---

# Customer Data Retention Rules

## Rule 21

Customer records should not be physically deleted.

---

## Rule 22

Historical service records should remain permanently available.

---

## Rule 23

Warranty records should remain permanently available.

---

## Rule 24

Audit records should remain permanently available.

---

# Customer Verification Rules

Customer verification may be performed using:

```text id="cbr18"
Phone Number
```

```text id="cbr19"
Customer Name
```

```text id="cbr20"
Device IMEI
```

depending on available information.

---

# Customer Profile Rules

## Rule 25

Every customer must have a unique Customer ID.

Example:

```text id="cbr21"
CUST-000001
```

---

## Rule 26

Customer profiles act as the master reference for customer relationships throughout the ERP.

---

# Governance Rules

## Rule 27

Customer information should support operational efficiency.

---

## Rule 28

Business processes should remain functional even when customer data is incomplete.

---

## Rule 29

Historical integrity takes priority over data cleanup.

---

## Rule 30

Customer-related activities should remain fully traceable.

---

# Relationship to Other Modules

This module governs interactions with:

* Device Module
* Service Module
* Warranty Module
* Sales Module
* Finance Module
* Communication Module

Customer Business Rules establish the operational standards for customer management throughout the ERP.

---

# Summary

Customer Business Rules define how customers are identified, registered, searched, updated, and managed.

The framework balances operational practicality with data integrity, ensuring that customer records remain useful, traceable, and aligned with real-world service shop workflows.
