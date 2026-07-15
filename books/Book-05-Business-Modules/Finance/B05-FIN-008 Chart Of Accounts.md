# B05-FIN-008

# Chart Of Accounts

---

# Purpose

Defines account structure used by the accounting system.

---

# Business Philosophy

Most business owners do not understand accounting structures.

The ERP must provide a ready-to-use account framework.

---

# Official Decision

System ships with:

```text id="n4x7pd"
Default COA Template
```

---

# Owner Flexibility

Owner may:

* Add Accounts
* Rename Accounts
* Disable Accounts

subject to permissions.

---

# Account Categories

Supported:

---

## Assets

Examples:

* Cash
* Bank
* Inventory
* Accounts Receivable

---

## Liabilities

Examples:

* Customer Deposits
* Supplier Payables
* Taxes Payable

---

## Equity

Examples:

* Owner Capital
* Retained Earnings

---

## Revenue

Examples:

* Service Revenue
* Product Revenue
* Other Revenue

---

## Expenses

Examples:

* Rent Expense
* Electricity Expense
* Internet Expense
* Salary Expense

---

# Account Structure

Example:

```text id="y7p2rc"
1000 Assets

1100 Cash

1110 Main Cash

1120 Branch Cash

1200 Bank
```

---

# Parent Accounts

Supported.

Allows account grouping.

---

# Child Accounts

Supported.

Allows detailed reporting.

---

# Account Status

Supported:

```text id="b6q9vh"
Active
```

---

```text id="m1w5tx"
Inactive
```

---

# Account Deletion Rules

Official Decision:

Accounts with transactions:

```text id="g4r8jn"
Cannot Be Deleted
```

---

Accounts may only be:

```text id="v2k7pd"
Disabled
```

---

# Multi Branch Support

Accounts may support:

* Global Accounts
* Branch Accounts

---

# Reporting Integration

Used by:

* Journal
* Ledger
* Profit & Loss
* Balance Sheet
* Cash Flow

---

# Summary

Chart Of Accounts provides the financial structure used throughout the ERP.

---

# End Of Document
