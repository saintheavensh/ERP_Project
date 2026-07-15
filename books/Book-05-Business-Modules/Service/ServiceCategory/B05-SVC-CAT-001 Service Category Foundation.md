# B05-SVC-CAT-001

# Service Category Foundation

---

# Purpose

Defines the service category system used throughout Universal Service ERP.

Service Categories provide standardized repair classifications, pricing guidance, warranty defaults, technician planning, and reporting structures.

---

# Business Philosophy

Repairs should not be treated as free-form descriptions.

Repairs should be categorized into structured service categories.

This allows:

* Consistent pricing
* Consistent reporting
* Consistent technician evaluation
* Consistent warranty analysis

---

# Core Principle

Every repair should belong to at least one Service Category.

---

# Examples

Examples of service categories:

```text id="scf001"
LCD Replacement
```

```text id="scf002"
Battery Replacement
```

```text id="scf003"
Charging Port Replacement
```

```text id="scf004"
Camera Replacement
```

```text id="scf005"
CPU Repair
```

```text id="scf006"
EMMC Repair
```

```text id="scf007"
Face ID Repair
```

```text id="scf008"
Water Damage Cleaning
```

---

# Objectives

Service Categories exist to:

* Standardize repair classifications
* Standardize estimates
* Standardize pricing recommendations
* Standardize warranty policies
* Support technician KPI calculations

---

# Category Structure

Each category may contain:

* Code
* Name
* Description
* Difficulty Level
* Estimated Duration
* Warranty Period
* Pricing Rules

---

# Category Ownership

Categories are managed by:

```text id="scf009"
Management
```

or

```text id="scf010"
Authorized Administrators
```

---

# Category Usage

Categories are used by:

* Service Orders
* Technician Assignments
* Warranty Claims
* Reporting
* Dashboard Widgets

---

# Multiple Categories

Supported.

Example:

```text id="scf011"
LCD Replacement
+
Charging Port Replacement
```

within a single service order.

---

# Reporting Impact

Categories enable:

* Top Repairs
* Profitability Analysis
* Technician Analysis
* Warranty Analysis

---

# Summary

Every repair belongs to one or more service categories.

Service Categories are foundational business objects used across multiple modules.

---

# End Of Document
