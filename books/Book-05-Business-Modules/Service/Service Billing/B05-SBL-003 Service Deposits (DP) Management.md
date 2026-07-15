# B05-SBL-003

# Service Deposits (DP) Management

## Purpose

Defines deposit collection, deposit tracking, and deposit application to final invoices.

---

# Business Philosophy

Deposits reduce collection risk and demonstrate customer commitment.

---

# Official Decision

Deposits are:

```text id="sdp001"
Cash Received
```

and

```text id="sdp002"
Linked To Service Orders
```

---

# Deposit Workflow

```text id="sdp003"
Service Order
↓
Deposit
↓
Repair
↓
Final Invoice
↓
Deposit Applied
```

---

# Deposit Information

Supports:

* Service Order
* Customer
* Deposit Amount
* Payment Method
* Collection Date

---

# Payment Methods

Supports:

* Cash
* Transfer
* QRIS
* Card
* Mixed Payment

---

# Finance Integration

Deposit creates:

* Cash Entry
* Customer Payment Record

---

# Deposit Usage

Deposits reduce final invoice balances.

---

# Example

```text id="sdp004"
Invoice
Rp 1.000.000
```

---

```text id="sdp005"
Deposit
Rp 300.000
```

---

```text id="sdp006"
Remaining
Rp 700.000
```

---

# Deposit Status

### Active

---

### Applied

---

### Refunded

---

### Cancelled

---

# Audit Trail

Track:

* Collector
* Payment Method
* Amount
* Service Order

---

# Summary

Service Deposits Management controls advance customer payments and invoice application.

---

# End Of Document
