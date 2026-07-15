# B05-PUR-006

# Supplier Credit Purchase

## Purpose

Defines purchasing transactions involving supplier credit terms and Accounts Payable generation.

---

# Business Philosophy

Receiving goods and paying suppliers are separate events.

---

# Credit Purchase Workflow

```text id="scp001"
Purchase Order
↓
Receiving
↓
Accounts Payable
↓
Supplier Payment
```

---

# Supported Terms

* Cash
* 7 Days
* 14 Days
* 30 Days
* 45 Days
* Custom

---

# Liability Creation

Accounts Payable created upon receiving.

---

# Partial Receiving Support

Supported.

Example:

```text id="scp002"
Ordered = 100
Received = 60
```

Payable generated only for:

```text id="scp003"
60 Units
```

---

# Due Date Calculation

```text id="scp004"
Invoice Date
+
Payment Term
=
Due Date
```

---

# Finance Integration

Connected to:

* Accounts Payable
* Cash Management
* Financial Reports

---

# Summary

Supplier Credit Purchase separates receiving and payment while maintaining financial control.

---

# End Of Document
