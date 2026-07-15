# B05-SVC-CAT-005

# Warranty Rules

---

# Purpose

Defines warranty defaults and warranty behavior associated with service categories.

---

# Business Philosophy

Different repairs carry different warranty risks.

Warranty policies should be standardized whenever possible.

---

# Core Principle

Every Service Category may define a default warranty policy.

---

# Examples

```text id="wr001"
LCD Replacement
30 Days
```

```text id="wr002"
Battery Replacement
30 Days
```

```text id="wr003"
CPU Repair
90 Days
```

```text id="wr004"
Water Damage Cleaning
No Warranty
```

---

# Warranty Components

Each category may define:

* Warranty Period
* Warranty Coverage
* Warranty Exclusions

---

# Warranty Coverage

Examples:

```text id="wr005"
Part Only
```

```text id="wr006"
Labor Only
```

```text id="wr007"
Part + Labor
```

---

# Warranty Exclusions

Examples:

* Physical Damage
* Water Damage
* User Negligence
* Unauthorized Repair

---

# Service Order Snapshot

Warranty settings must be copied to the service order.

Future category changes must not affect historical services.

---

# Warranty Expiration

Automatically calculated from:

```text id="wr008"
Service Completion Date
+
Warranty Period
```

---

# Warranty Claim Validation

System must verify:

* Service Exists
* Warranty Active
* Coverage Applies

---

# Reporting Requirements

Support:

* Warranty Claims
* Warranty Rate By Category
* Warranty Cost By Category
* Warranty Frequency

---

# KPI Impact

High warranty rates may indicate:

* Technician Issues
* Sparepart Quality Issues
* Category Complexity

---

# Summary

* Categories define warranty defaults.
* Warranty settings are copied into service orders.
* Historical warranty integrity must be preserved.

---

# End Of Document
