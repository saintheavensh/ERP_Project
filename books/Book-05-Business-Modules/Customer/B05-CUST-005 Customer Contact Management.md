---

document_id: B05-CUST-005
title: Customer Contact Management
version: 1.0.0
last_updated: 2026-06-27
author: Universal Service ERP Team
----------------------------------

# Customer Contact Management

## Purpose

This document defines how customer contact information is managed within the Universal Service ERP.

The objective is to maintain customer contact information without making it a mandatory requirement for business operations.

---

# Overview

Not every customer is willing to provide contact information.

The platform should support customer records with or without:

* Phone Numbers
* Email Addresses
* Physical Addresses

Business operations must continue even when contact information is unavailable.

---

# Contact Management Principles

## Principle 1

Customer contact information is optional.

---

## Principle 2

Missing contact information must not block service operations.

---

## Principle 3

Contact information may be added later.

---

## Principle 4

The latest valid contact information should be maintained.

---

# Supported Contact Types

The platform supports:

```text id="cc1"
Phone Number
```

```text id="cc2"
WhatsApp Number
```

```text id="cc3"
Email Address
```

```text id="cc4"
Physical Address
```

---

# Registration Scenario

Example:

```text id="cc5"
Customer Name : Budi
Phone Number : NULL
Email : NULL
```

Customer registration should still succeed.

---

# Contact Acquisition Sources

Customer contact information may be obtained from:

```text id="cc6"
Customer Registration
```

```text id="cc7"
Customer Update
```

```text id="cc8"
WhatsApp Conversation
```

```text id="cc9"
Phone Call
```

```text id="cc10"
Manual Entry
```

---

# WhatsApp Contact Scenario

Example:

```text id="cc11"
Customer Registered
Without Phone Number
```

Later:

```text id="cc12"
Customer Sends WhatsApp Message
```

The employee may update the customer profile:

```text id="cc13"
Phone Number Added
Source:
WhatsApp Contact
```

---

# Communication Policy

The platform should not assume all customers can be contacted.

Customer responsibility:

```text id="cc14"
Follow Up Service Progress
```

Business responsibility:

```text id="cc15"
Provide Status Information
When Requested
```

---

# Notification Availability

If no contact information exists:

```text id="cc16"
Notifications Cannot Be Sent
```

The system may display a warning but should not block operations.

---

# Contact History

Contact changes should be auditable.

Examples:

* Phone Number Added
* Phone Number Changed
* Email Added
* Address Updated

---

# Governance Rules

## Rule 1

Contact information is optional.

## Rule 2

Customer records may exist without phone numbers.

## Rule 3

Customer records may exist without email addresses.

## Rule 4

Contact information may be updated at any time.

## Rule 5

Contact updates should be auditable.

---

# Summary

Customer Contact Management provides flexible handling of customer communication information.

The framework supports real-world service operations where many customers may choose not to provide contact details while still allowing the business to maintain and improve customer records over time.
