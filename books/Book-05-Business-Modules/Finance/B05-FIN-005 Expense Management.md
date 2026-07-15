# B05-FIN-005

# Expense Management

---

# Purpose

Defines operational expense recording, approval, tracking, and reporting.

---

# Official Architectural Decision

```text
Purchasing
≠
Expense
```

---

# Business Philosophy

Operational costs must be separated from inventory purchases.

This improves financial clarity and profitability analysis.

---

# Core Principle

Expenses never create inventory.

Expenses never increase stock.

---

# Examples Of Expenses

Supported:

* Electricity
* Water
* Internet
* Rent
* Salaries
* Fuel
* Parking
* Office Supplies
* Cleaning Supplies
* Marketing
* Advertising
* Courier Costs
* Maintenance
* Miscellaneous Expenses

---

# Workflow

```text
Expense Request
↓
Approval
↓
Payment
↓
Recorded
```

---

# Direct Expense Entry

Small businesses may directly create expenses.

Example:

```text
Electricity Bill
↓
Payment
↓
Recorded
```

---

# Expense Categories

Supported:

* Utilities
* Payroll
* Office
* Marketing
* Transportation
* Maintenance
* Other

---

# Expense Status

Supported:

```text
Draft
```

```text
Pending Approval
```

```text
Approved
```

```text
Paid
```

```text
Rejected
```

---

# Receipt Management

Supports:

* Receipt Upload
* Invoice Upload
* Attachment Storage

---

# Recurring Expenses

Supported:

* Monthly Rent
* Internet
* Electricity
* Software Subscriptions

---

# Budget Monitoring

Future Enhancement.

Not included in Version 1.

---

# Reporting Integration

Provides:

* Expense Reports
* Expense By Category
* Expense Trends
* Branch Expenses

---

# Dashboard Integration

Provides:

* Expenses Today
* Expenses This Month
* Top Expense Categories

---

# Audit Requirements

Track:

* Requester
* Approver
* Amount
* Category
* Attachments

---

# Summary

Expense Management controls operational spending while remaining completely separate from inventory purchasing.

---

# End Of Document
