# B05-SVC-CAT-003

# Service Pricing Architecture

---

# Purpose

Defines service pricing recommendations and validation mechanisms.

---

# Business Philosophy

The system should guide pricing decisions.

The system should help prevent accidental losses.

The system should not prevent legitimate management decisions.

---

# Core Principle

Service pricing consists of:

```text id="spa001"
Labor
+
Spareparts
=
Total Service Price
```

---

# Category Pricing

Each category may define:

* Minimum Labor Price
* Recommended Labor Price
* Target Labor Price

---

# Example

LCD Replacement

```text id="spa002"
Minimum Labor = 60,000
```

---

# Sparepart Example

LCD Cost:

```text id="spa003"
120,000
```

Minimum Service Price:

```text id="spa004"
180,000
```

---

# Pricing Recommendation Formula

```text id="spa005"
Sparepart Cost
+
Minimum Labor
=
Minimum Recommended Price
```

---

# Warning Rules

---

## Warning Level

Triggered when:

```text id="spa006"
Price < Recommended
```

System displays warning.

---

## Critical Warning

Triggered when:

```text id="spa007"
Price < Minimum
```

System displays critical warning.

---

# Blocking Rules

---

## Sparepart Sales

Blocked if:

```text id="spa008"
Selling Price < Cost
```

unless authorized.

---

## Service Labor

Blocked if:

```text id="spa009"
Labor Price Missing
```

---

# Owner Override

Supported.

Authorized users may override pricing restrictions.

Audit trail required.

---

# Multi Category Pricing

Supported.

Example:

```text id="spa010"
LCD Replacement
+
Charging Port Replacement
```

Total labor may be:

```text id="spa011"
Combined
```

or

```text id="spa012"
Adjusted
```

based on business rules.

---

# Reporting Requirements

Support:

* Category Profitability
* Average Selling Price
* Discount Analysis
* Below-Minimum Sales

---

# Summary

The pricing system provides guidance, protection, and flexibility.

Management retains final authority.

---

# End Of Document
