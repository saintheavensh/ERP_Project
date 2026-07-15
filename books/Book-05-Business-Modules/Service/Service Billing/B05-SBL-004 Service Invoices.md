# B05-SBL-004

# Service Invoice Management

## Purpose

Defines service invoice generation, billing presentation, invoice lifecycle, and invoice settlement tracking.

---

# Business Philosophy

Invoices should clearly communicate service charges while remaining configurable to business preferences.

---

# Invoice Sources

Generated from:

* Completed Service Orders
* Approved Service Charges

---

# Invoice Components

Supports:

### Labor Charges

---

### Spare Parts

---

### Additional Charges

---

### Taxes

Optional.

---

### Discounts

Supported.

---

# Invoice Presentation

Configurable through Settings.

Supports:

### Detailed Mode

Displays:

* Parts
* Labor
* Individual Charges

---

### Summary Mode

Displays:

* Total Service Amount

---

# Invoice Workflow

```text id="sim001"
Completed Service
↓
Invoice
↓
Payment
↓
Closed
```

---

# Invoice Status

### Draft

---

### Issued

---

### Partially Paid

---

### Paid

---

### Cancelled

---

# Finance Integration

Invoices contribute to service revenue reporting.

---

# Summary

Service Invoice Management controls customer billing and invoice generation.

---

# End Of Document
