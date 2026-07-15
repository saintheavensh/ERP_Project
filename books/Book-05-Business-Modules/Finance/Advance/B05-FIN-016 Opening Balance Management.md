# B05-FIN-016

# Opening Balance Management

## Purpose

Defines the migration and initialization process for existing businesses entering Universal Service ERP.

---

## Business Philosophy

Most businesses already have:

* Existing Cash
* Existing Inventory
* Existing Receivables
* Existing Payables
* Existing Customer Deposits

ERP implementation must start from actual business conditions.

---

## Supported Opening Balances

### Financial

* Cash
* Bank Accounts
* Receivables
* Payables
* Customer Deposits

### Inventory

* Spare Parts
* Devices
* Accessories

### Capital

* Owner Capital
* Retained Earnings

---

## Opening Balance Workflow

```text
System Setup
↓
Opening Balance Entry
↓
Review
↓
Approval
↓
Lock Opening Balance
```

---

## Locking Rules

Once approved:

* Cannot be edited directly
* Cannot be deleted

Corrections require:

* Adjustment Entry
* Correction Journal

---

## Audit Trail

Track:

* User
* Date
* Approval User
* Reason

---

## Summary

Opening Balance establishes the official financial starting point of the ERP.

---

# End Of Document
