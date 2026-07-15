# B05-SBL-005

# Service Payment Management

## Purpose

Defines service payment collection, settlement, and payment tracking.

---

# Business Philosophy

Payments should remain flexible while preserving financial accuracy.

---

# Supported Payment Methods

### Cash

---

### Bank Transfer

---

### Debit Card

---

### Credit Card

---

### QRIS

---

### Mixed Payment

Supported.

---

# Example

```text id="spm001"
Invoice
Rp 1.000.000
```

---

```text id="spm002"
Cash
Rp 500.000
```

---

```text id="spm003"
QRIS
Rp 500.000
```

---

# Deposit Integration

Deposits automatically reduce invoice balances.

---

# Example

```text id="spm004"
Invoice
Rp 1.000.000
```

---

```text id="spm005"
Deposit
Rp 300.000
```

---

```text id="spm006"
Remaining
Rp 700.000
```

---

# Payment Status

### Unpaid

---

### Partially Paid

---

### Paid

---

# Finance Integration

Creates:

* Cash Entries
* Revenue Entries
* Payment Records

---

# Audit Trail

Track:

* Collector
* Amount
* Method
* Date

---

# Summary

Service Payment Management controls customer payment collection and invoice settlement.

---

# End Of Document
