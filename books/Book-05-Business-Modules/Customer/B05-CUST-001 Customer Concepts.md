---

document_id: B05-CUST-001
title: Customer Concepts
version: 1.0.0
last_updated: 2026-06-27
author: Universal Service ERP Team
----------------------------------

# Customer Concepts

## Purpose

This document defines the fundamental customer concepts used throughout the Universal Service ERP.

The Customer entity represents the individual or organization that owns devices, requests services, purchases products, receives invoices, makes payments, and holds warranty rights.

Customer is one of the most important business entities within the platform.

---

# Overview

A Customer represents a person or organization that interacts with the business.

Customers may:

* Request repair services
* Purchase products
* Own devices
* Receive warranties
* Make payments
* Maintain service history

The Customer entity serves as the primary ownership record for many business processes.

---

# Objectives

The Customer Module is designed to:

* Maintain customer information.
* Track customer history.
* Support service operations.
* Support warranty management.
* Improve customer communication.
* Improve reporting and analytics.

---

# Customer Definition

A Customer is any person or organization that receives products or services from the business.

Examples:

```text id="cust1"
Individual Customer
```

```text id="cust2"
Business Customer
```

```text id="cust3"
Government Institution
```

---

# Customer Types

## Individual Customer

A single person who owns devices and requests services.

Examples:

```text id="cust4"
Phone Repair Customer
```

```text id="cust5"
Retail Buyer
```

---

## Corporate Customer

A business organization.

Examples:

```text id="cust6"
Office
School
Store
Company
```

Corporate customers may own multiple devices.

---

# Customer Ownership Model

The customer is the owner of business relationships.

Example:

```text id="cust7"
Customer
    ↓
Device
```

```text id="cust8"
Customer
    ↓
Service Order
```

```text id="cust9"
Customer
    ↓
Invoice
```

```text id="cust10"
Customer
    ↓
Warranty
```

---

# Customer as Root Entity

Most operational activities originate from a customer.

Primary relationship chain:

```text id="cust11"
Customer
    ↓
Device
    ↓
Service Order
    ↓
Technician
    ↓
Invoice
    ↓
Payment
    ↓
Warranty
```

This chain forms the core service business model.

---

# Customer Identifier

Every customer must have a unique identifier.

Examples:

```text id="cust12"
CUST-000001
CUST-000002
CUST-000003
```

The identifier should remain permanent.

Identifiers should never be reused.

---

# Customer Core Information

Minimum customer information:

| Field         | Required |
| ------------- | -------- |
| Customer ID   | Yes      |
| Customer Name | Yes      |
| Phone Number  | Yes      |
| Customer Type | Yes      |

Optional information:

| Field      | Optional |
| ---------- | -------- |
| Email      | Yes      |
| Address    | Yes      |
| Notes      | Yes      |
| Tax Number | Yes      |

---

# Customer Lifecycle

A customer generally follows this lifecycle:

```text id="cust13"
Prospect
    ↓
Registered Customer
    ↓
Active Customer
    ↓
Returning Customer
    ↓
Inactive Customer
```

Most service businesses begin directly at:

```text id="cust14"
Registered Customer
```

during device intake.

---

# Customer Registration Triggers

Customers may be created when:

```text id="cust15"
Service Order Created
```

or

```text id="cust16"
Sales Transaction Created
```

or

```text id="cust17"
Manual Registration
```

---

# Customer Relationships

## Customer → Device

Relationship:

```text id="cust18"
One Customer
        ↓
Many Devices
```

Example:

```text id="cust19"
John
 ├── iPhone 13
 ├── Samsung A54
 └── Oppo A78
```

---

## Customer → Service Order

Relationship:

```text id="cust20"
One Customer
        ↓
Many Service Orders
```

This relationship preserves service history.

---

## Customer → Invoice

Relationship:

```text id="cust21"
One Customer
        ↓
Many Invoices
```

---

## Customer → Payment

Relationship:

```text id="cust22"
One Customer
        ↓
Many Payments
```

---

## Customer → Warranty

Relationship:

```text id="cust23"
One Customer
        ↓
Many Warranty Records
```

---

# Customer History

The platform should maintain:

* Service History
* Device History
* Purchase History
* Payment History
* Warranty History
* Communication History

Customer history provides a complete business relationship timeline.

---

# Customer Communication

Customers may receive:

* Service Updates
* Approval Requests
* Pickup Notifications
* Warranty Notifications
* Payment Notifications

Communication history should be retained.

---

# Duplicate Customer Prevention

The system should attempt to detect duplicates.

Matching criteria may include:

* Phone Number
* Email Address
* Customer Name

Example:

```text id="cust24"
Phone Number Already Exists
```

The system should warn users before creating duplicates.

---

# Customer Business Importance

Customers are critical because they:

* Generate revenue.
* Own service requests.
* Own warranty claims.
* Own invoices.
* Own payment relationships.

Without customers, operational transactions cannot exist.

---

# Governance Rules

## Rule 1

Every customer must have a unique identifier.

---

## Rule 2

Customer records should not be physically deleted.

---

## Rule 3

Customer ownership relationships must remain traceable.

---

## Rule 4

Historical service records must be preserved.

---

## Rule 5

Duplicate customers should be minimized.

---

# Relationship to Other Modules

This module works together with:

* Device Module
* Service Module
* Warranty Module
* Sales Module
* Finance Module
* Communication Module

Customer serves as the root entity for most business relationships.

---

# Summary

The Customer entity represents individuals and organizations that interact with the business.

Customers own devices, service requests, invoices, payments, and warranties, making Customer one of the most important foundational entities within the Universal Service ERP.
