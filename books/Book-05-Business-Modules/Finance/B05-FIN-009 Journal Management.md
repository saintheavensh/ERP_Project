# B05-FIN-009

# Journal Management

---

# Purpose

Defines journal creation, journal storage, journal adjustments, and journal audit controls.

---

# Business Philosophy

Journal entries represent financial truth.

They must remain trustworthy.

---

# Official Architectural Decision

```text id="r8k4mw"
Journal Entries
Are Immutable
```

---

# Core Principle

Posted journals:

```text id="x5p1rd"
Cannot Be Edited
```

---

```text id="m3v9tx"
Cannot Be Deleted
```

---

# Journal Sources

Generated from:

* Service Transactions
* Sales Transactions
* Purchases
* Expenses
* Deposits
* Refunds
* Adjustments

---

# Journal Structure

Each journal contains:

* Journal Number
* Date
* Description
* Source Document
* Debit Lines
* Credit Lines

---

# Double Entry Accounting

Required.

Official Rule:

```text id="n2q7pw"
Total Debit
=
Total Credit
```

---

# Journal Status

Supported:

```text id="v6r1mk"
Draft
```

---

```text id="p9w4tx"
Posted
```

---

```text id="t5k8rd"
Reversed
```

---

# Reversal Journals

Supported.

Purpose:

Correct incorrect transactions.

---

# Example

Original:

```text id="c3x7pb"
Inventory
1,000,000
```

---

Reversal:

```text id="m8q2vw"
Inventory
-1,000,000
```

---

Original journal remains preserved.

---

# Adjustment Journals

Supported.

Purpose:

Correct balances without removing historical transactions.

---

# Journal Numbering

Example:

```text id="d4r9tx"
JRN-2026-000001
```

---

# Search Support

Supports:

* Date
* Source Module
* Source Document
* Account

---

# Audit Trail

Track:

* Creator
* Approver
* Reversal User
* Adjustment User
* Timestamps

---

# Reporting Integration

Provides data for:

* General Ledger
* Trial Balance
* Financial Statements

---

# Summary

Journal Management maintains immutable financial records and provides the foundation for accounting accuracy.

---

# End Of Document
