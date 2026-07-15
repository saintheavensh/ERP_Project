# B05-FIN-010

# General Ledger

---

# Purpose

Defines ledger structure, account transaction history, balance tracking, and financial account movements.

---

# Business Philosophy

The General Ledger is the official financial history of the company.

All financial reports originate from ledger data.

---

# Core Principle

Every posted journal entry updates the General Ledger.

---

# Ledger Structure

Each ledger account maintains:

* Account Code
* Account Name
* Opening Balance
* Debit Total
* Credit Total
* Closing Balance

---

# Data Sources

Updated from:

* Journal Entries
* Adjustment Journals
* Reversal Journals

---

# Ledger View

Displays:

* Transaction Date
* Reference Number
* Description
* Debit
* Credit
* Running Balance

---

# Running Balance

Supported.

Users may view balance progression over time.

---

# Ledger Filtering

Supports:

* Account
* Date Range
* Branch
* Source Module
* Source Document

---

# Branch Support

Supports:

* Consolidated Ledger
* Branch Ledger

---

# Accounting Mode Behavior

Accounting OFF:

```text id="gl001"
General Ledger Hidden
```

---

Accounting ON:

```text id="gl002"
General Ledger Available
```

---

# Audit Requirements

Track:

* Posting Source
* Journal Reference
* User
* Timestamp

---

# Reporting Integration

Provides data for:

* Trial Balance
* Profit & Loss
* Balance Sheet
* Cash Flow

---

# Summary

General Ledger serves as the official financial transaction history of the organization.

---

# End Of Document
