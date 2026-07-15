---

document_id: B05-CUST-002
title: Customer Lifecycle
version: 1.0.0
last_updated: 2026-06-27
author: Universal Service ERP Team
----------------------------------

# Customer Lifecycle

## Purpose

This document defines the lifecycle of a customer within the Universal Service ERP.

The Customer Lifecycle describes how a customer relationship evolves from the first interaction through ongoing business engagement.

Understanding customer lifecycle stages enables better service management, communication, reporting, and customer retention.

---

# Overview

A customer relationship is not a single transaction.

Customers may interact with the business multiple times over many years through:

* Service Requests
* Product Purchases
* Warranty Claims
* Repeat Visits
* Referrals

The Customer Lifecycle provides a structured model for tracking these relationships.

---

# Objectives

The Customer Lifecycle Framework is designed to:

* Track customer engagement.
* Improve customer retention.
* Improve service quality.
* Support customer analytics.
* Improve business reporting.
* Standardize customer status management.

---

# Customer Lifecycle Model

The standard lifecycle is:

```text id="cl1"
Prospect
    ↓
Registered
    ↓
Active
    ↓
Returning
    ↓
Inactive
```

For most service businesses, customers often enter directly at the Registered stage.

---

# Lifecycle Stage Definitions

## Prospect

A potential customer who has not yet completed a transaction.

Examples:

```text id="cl2"
Customer Inquiry
Quotation Request
Price Check
```

Characteristics:

* No completed transaction.
* No service history.
* No purchase history.

---

## Registered Customer

A customer record exists in the system.

Examples:

```text id="cl3"
Customer Registered During Device Intake
```

Characteristics:

* Customer profile created.
* Customer ID assigned.
* Contact information recorded.

Example:

```text id="cl4"
CUST-000125
```

---

## Active Customer

A customer currently engaged in business activity.

Examples:

```text id="cl5"
Active Service Order
Active Warranty
Recent Purchase
```

Characteristics:

* Current transaction exists.
* Ongoing business relationship.

---

## Returning Customer

A customer who has completed previous transactions and returns for additional business.

Examples:

```text id="cl6"
Second Repair Visit
Additional Product Purchase
```

Characteristics:

* Existing history.
* Multiple transactions.
* Repeat business.

Returning customers are often highly valuable.

---

## Inactive Customer

A customer with no activity for an extended period.

Examples:

```text id="cl7"
No Activity for 24 Months
```

Characteristics:

* No recent transactions.
* Historical records retained.

Inactive customers should not be deleted.

---

# Typical Service Business Lifecycle

Most phone repair businesses follow:

```text id="cl8"
Walk-In Customer
        ↓
Customer Registration
        ↓
Device Intake
        ↓
Service Process
        ↓
Payment
        ↓
Returning Customer
```

---

# Customer Creation Lifecycle

Customer creation process:

```text id="cl9"
Customer Arrives
        ↓
Search Existing Customer
        ↓
Found?
   ├── Yes → Use Existing Record
   └── No
            ↓
     Create Customer
            ↓
     Assign Customer ID
```

This process minimizes duplicate customers.

---

# Customer Activity Lifecycle

Example:

```text id="cl10"
Registered
        ↓
Service Order Created
        ↓
Repair Completed
        ↓
Invoice Paid
        ↓
Customer Returns Later
        ↓
New Service Order
```

Customer history accumulates across all activities.

---

# Lifecycle Status Indicators

The system may track:

| Status      | Meaning                 |
| ----------- | ----------------------- |
| Registered  | Customer exists         |
| Active      | Current activity exists |
| Returning   | Repeat customer         |
| Inactive    | No recent activity      |
| Blacklisted | Restricted customer     |

---

# Customer Retention Concepts

Customer retention is important because:

```text id="cl11"
Existing Customer
        ↓
Lower Acquisition Cost
        ↓
Higher Lifetime Value
```

Examples of retention drivers:

* Good service quality
* Fast turnaround time
* Warranty support
* Effective communication

---

# Customer Lifetime Value

Customer value extends beyond a single transaction.

Example:

```text id="cl12"
First Repair
        ↓
Screen Replacement
        ↓
Battery Replacement
        ↓
Accessory Purchase
        ↓
Future Referrals
```

The relationship may span many years.

---

# Customer History Accumulation

As customers progress through the lifecycle, history accumulates.

Examples:

* Service History
* Device History
* Warranty History
* Payment History
* Communication History

This information becomes increasingly valuable over time.

---

# Lifecycle Events

Examples:

```text id="cl13"
CustomerRegistered
```

```text id="cl14"
CustomerActivated
```

```text id="cl15"
CustomerReturned
```

```text id="cl16"
CustomerMarkedInactive
```

These events support reporting and analytics.

---

# Lifecycle Governance Rules

## Rule 1

Every customer must have a unique identifier.

---

## Rule 2

Customer records should remain permanently traceable.

---

## Rule 3

Customer lifecycle transitions should be auditable.

---

## Rule 4

Inactive customers should not be deleted.

---

## Rule 5

Duplicate customer records should be minimized.

---

# Relationship to Other Modules

The Customer Lifecycle interacts with:

* Device Module
* Service Module
* Warranty Module
* Sales Module
* Finance Module
* Communication Module

Customer lifecycle stages influence operational workflows throughout the ERP.

---

# Summary

The Customer Lifecycle Framework defines how customer relationships evolve over time.

By tracking registration, activity, repeat business, and inactivity, the platform can improve customer management, service quality, reporting, and long-term business growth.
