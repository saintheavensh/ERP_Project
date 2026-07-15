# B05-FIN-004

# Accounts Payable

---

# Purpose

Defines supplier liabilities, outstanding purchase obligations, payment scheduling, and supplier debt management.

---

# Business Philosophy

Not every purchase is paid immediately.

Supplier obligations must remain visible until fully settled.

---

# Core Principle

Every payable must be linked to a supplier and source purchasing document.

---

# Payable Sources

Supported:

* Purchase Orders
* Purchase Invoices
* Supplier Bills
* Special Orders

---

# Workflow

```text
Purchase
↓
Invoice Received
↓
Partial Payment
↓
Outstanding Balance
↓
Accounts Payable
↓
Settlement
↓
Paid
```

---

# Payable Creation

Created when:

```text
Purchase Amount
>
Payment Made
```

---

# Example

Purchase Invoice:

```text
10,000,000
```

Paid:

```text
4,000,000
```

Outstanding:

```text
6,000,000
```

---

# Payable Status

Supported:

```text
Open
```

```text
Partially Paid
```

```text
Paid
```

```text
Cancelled
```

---

# Supplier Account View

Displays:

* Outstanding Balance
* Purchase History
* Payment History
* Aging Information

---

# Aging Analysis

Supported:

```text
0-30 Days
```

```text
31-60 Days
```

```text
61-90 Days
```

```text
90+ Days
```

---

# Payment Scheduling

Supports:

* Due Date Tracking
* Payment Planning
* Overdue Monitoring

---

# Partial Payments

Supported.

Multiple payments may settle a single payable.

---

# Reporting Integration

Provides:

* Payable Reports
* Supplier Balance Reports
* Aging Reports
* Payment Schedule Reports

---

# Dashboard Integration

Provides:

* Outstanding Payables
* Due This Week
* Overdue Payables

---

# Audit Requirements

Track:

* Supplier
* Purchase Invoice
* Payment History
* Due Dates

---

# Summary

Accounts Payable manages supplier obligations and ensures outstanding debts are tracked until settlement.

---

# End Of Document
