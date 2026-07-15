# B05-SBL-001

# Service Billing Foundation

## Purpose

Defines service billing architecture, financial workflows, revenue recognition, and customer payment management.

---

# Business Philosophy

Service execution and service billing are separate responsibilities.

Operational activities should remain independent from financial activities.

---

# Scope

This module handles:

* Service Quotations
* Service Deposits
* Service Invoices
* Service Payments
* Service Refunds
* Service Revenue

---

# Exclusions

Not handled here:

* Retail Sales
* Supplier Payments
* Purchasing Activities

---

# Module Relationships

Service Billing integrates with:

* Service
* Customer
* Finance
* Cash Management

---

# Revenue Principle

Service revenue is tracked separately from retail sales revenue.

---

# Billing Lifecycle

```text id="sbf001"
Diagnosis
↓
Quotation
↓
Approval
↓
Deposit (Optional)
↓
Repair
↓
Invoice
↓
Payment
↓
Close
```

---

# Core Principle

Every billed amount must be traceable to a Service Order.

---

# Summary

Service Billing Foundation establishes the financial architecture for service operations.

---

# End Of Document
