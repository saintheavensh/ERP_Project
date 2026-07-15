# B05-FIN-003

# Accounts Receivable

---

# Purpose

Defines customer receivables, outstanding balances, collection tracking, and payment settlement.

---

# Business Philosophy

Not all customer transactions are paid immediately.

Outstanding balances must remain visible and controlled.

---

# Core Principle

Every receivable must be linked to a customer and source transaction.

---

# Receivable Sources

Examples:

* Service Billing
* Retail Sales
* Corporate Sales
* Installment Agreements

---

# Workflow

```text id="g4x7tn"
Invoice
↓
Partial Payment
↓
Outstanding Balance
↓
Receivable
↓
Collection
↓
Paid
```

---

# Receivable Creation

Created when:

```text id="j8r2vy"
Invoice Amount
>
Payment Received
```

---

# Example

Invoice:

```text id="f6w1pc"
1,000,000
```

Payment:

```text id="z3m7ka"
600,000
```

Receivable:

```text id="c9q4rd"
400,000
```

---

# Receivable Status

Supported:

```text id="u2n8mw"
Open
```

```text id="p5k3tz"
Partially Paid
```

```text id="r7v1cd"
Paid
```

```text id="b9m4qx"
Written Off
```

---

# Customer Account View

Displays:

* Outstanding Balance
* Invoice List
* Payment History

---

# Aging Analysis

Supported:

```text id="d3r8pk"
0-30 Days
```

```text id="f9v1mn"
31-60 Days
```

```text id="j2q7wc"
61-90 Days
```

```text id="s6m4tz"
90+ Days
```

---

# Collection Management

Supports:

* Collection Notes
* Follow-Up Dates
* Collection Status

---

# Partial Payments

Supported.

Multiple payments may settle a single invoice.

---

# Write-Off

Authorized users may write off bad debts.

All write-offs require audit history.

---

# Reporting Integration

Provides:

* Receivable Reports
* Aging Reports
* Customer Balance Reports

---

# Dashboard Integration

Provides:

* Outstanding Receivables
* Overdue Receivables
* Collection Performance

---

# Audit Requirements

Track:

* Customer
* Invoice
* Payment History
* Collection Actions

---

# Summary

Accounts Receivable manages customer debt and outstanding balances while supporting collection and payment tracking.

---

# End Of Document
