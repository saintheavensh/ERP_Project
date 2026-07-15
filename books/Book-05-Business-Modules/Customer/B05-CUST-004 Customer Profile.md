---

document_id: B05-CUST-004
title: Customer Profile
version: 1.0.0
last_updated: 2026-06-27
author: Universal Service ERP Team
----------------------------------

# Customer Profile

## Purpose

This document defines the Customer Profile structure used throughout the Universal Service ERP.

The Customer Profile serves as the master record for customer information and acts as the central reference point for devices, services, warranties, invoices, payments, and customer history.

---

# Overview

A Customer Profile contains all information associated with a customer.

The profile should provide a complete view of the customer relationship without requiring users to search across multiple modules.

Customer Profiles should remain simple, practical, and optimized for service operations.

---

# Objectives

The Customer Profile Framework is designed to:

* Centralize customer information.
* Improve service efficiency.
* Support customer history tracking.
* Improve customer identification.
* Support reporting and analytics.
* Maintain long-term customer records.

---

# Customer Profile Structure

A customer profile consists of:

```text id="cp1"
Customer Information
        ↓
Devices
        ↓
Service History
        ↓
Warranty History
        ↓
Invoices
        ↓
Payments
        ↓
Notes
```

The profile acts as a single customer dashboard.

---

# Core Profile Information

## Basic Information

| Field         | Required |
| ------------- | -------- |
| Customer ID   | Yes      |
| Customer Name | Yes      |
| Customer Type | Yes      |
| Status        | Yes      |

Example:

```text id="cp2"
Customer ID : CUST-000125
Customer Name : Budi
Customer Type : Individual
Status : Active
```

---

## Contact Information

| Field        | Required |
| ------------ | -------- |
| Phone Number | No       |
| Email        | No       |
| Address      | No       |

Contact information may be incomplete.

Business operations should not depend on contact data being available.

---

# Customer Status

The profile should display current customer status.

Examples:

```text id="cp3"
Registered
```

```text id="cp4"
Active
```

```text id="cp5"
Returning
```

```text id="cp6"
Inactive
```

---

# Device Summary

The profile should display all devices associated with the customer.

Example:

```text id="cp7"
Customer
    ├── iPhone 13
    ├── Samsung A54
    └── Oppo A78
```

Information displayed:

* Brand
* Model
* IMEI
* Last Service Date

---

# Service Summary

The profile should display service statistics.

Examples:

```text id="cp8"
Total Service Orders
Open Service Orders
Completed Service Orders
```

Example:

```text id="cp9"
Total Services : 12
Open Services : 1
Completed Services : 11
```

---

# Warranty Summary

The profile should display:

```text id="cp10"
Active Warranties
Expired Warranties
Warranty Claims
```

Example:

```text id="cp11"
Active Warranty : 2
Expired Warranty : 5
```

---

# Financial Summary

The profile should display:

```text id="cp12"
Invoices
Payments
Outstanding Balances
```

Example:

```text id="cp13"
Total Invoices : 25
Outstanding Balance : Rp 0
```

---

# Customer Notes

Users may store operational notes.

Examples:

```text id="cp14"
Preferred Contact Method
```

```text id="cp15"
VIP Customer
```

```text id="cp16"
Requires Approval Before Repair
```

Notes should support operations but should not replace structured business data.

---

# Customer Activity Timeline

The profile should provide a chronological activity timeline.

Example:

```text id="cp17"
2026-06-01
Service Order Created

2026-06-02
Diagnosis Completed

2026-06-03
Payment Received

2026-09-10
Warranty Claim Submitted
```

The timeline provides a complete customer interaction history.

---

# Profile Search Capabilities

Users should be able to locate customer profiles using:

* Customer ID
* Customer Name
* Phone Number
* Device IMEI
* Service Order Number

This improves operational efficiency.

---

# Profile Editing Rules

## Editable Fields

Examples:

```text id="cp18"
Phone Number
Email
Address
Notes
```

---

## Controlled Fields

Examples:

```text id="cp19"
Customer ID
Creation Date
Audit Information
```

Controlled fields should not be freely modified.

---

# Customer Profile Dashboard

Recommended layout:

```text id="cp20"
+----------------------------------+
| Customer Information             |
+----------------------------------+
| Devices                          |
+----------------------------------+
| Active Services                  |
+----------------------------------+
| Warranty Summary                 |
+----------------------------------+
| Financial Summary                |
+----------------------------------+
| Activity Timeline                |
+----------------------------------+
| Notes                            |
+----------------------------------+
```

The objective is to provide a complete customer overview from a single screen.

---

# Customer Profile Audit Requirements

The following should be auditable:

* Profile Creation
* Profile Updates
* Contact Changes
* Note Changes
* Status Changes

Auditability ensures data integrity and accountability.

---

# Governance Rules

## Rule 1

Every customer must have a unique profile.

---

## Rule 2

Customer profiles should remain permanently traceable.

---

## Rule 3

Historical information should not be lost.

---

## Rule 4

Profile updates should be auditable.

---

## Rule 5

Customer profiles should serve as the primary customer reference across all modules.

---

# Relationship to Other Modules

This module works together with:

* Customer Registration
* Device Module
* Service Module
* Warranty Module
* Sales Module
* Finance Module

The Customer Profile acts as the central customer information hub.

---

# Summary

The Customer Profile provides a centralized view of customer information, devices, services, warranties, invoices, payments, and history.

It serves as the primary customer reference point throughout the Universal Service ERP and enables efficient customer management across all business operations.
