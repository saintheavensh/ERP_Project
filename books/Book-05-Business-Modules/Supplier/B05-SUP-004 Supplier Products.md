# B05-SUP-004

# Supplier Products

## Purpose

Defines supplier-product relationships and product sourcing information.

---

# Business Philosophy

Products may be supplied by multiple suppliers.

Supplier relationships should support sourcing flexibility.

---

# Product Relationship Model

Supported:

```text id="sp001"
One Product
↓
Many Suppliers
```

---

Supported:

```text id="sp002"
One Supplier
↓
Many Products
```

---

# Supplier Product Information

Supports:

* Product Code
* Supplier Product Code
* Supplier Product Name
* Supplier SKU
* Supplier Notes

---

# Product Availability

Supports:

### Available

Supplier currently supplies product.

---

### Unavailable

Temporarily unavailable.

---

### Discontinued

No longer supplied.

---

# Preferred Supplier

Supports:

```text id="sp003"
Preferred Supplier
```

for each product.

---

# Purchasing Integration

Supports:

* Supplier Selection
* Purchase Recommendation
* Product Source Lookup

---

# Reporting

Provides:

* Product Supplier Matrix
* Product Source Analysis

---

# Summary

Supplier Products manages sourcing relationships between products and suppliers.

---

# End Of Document
