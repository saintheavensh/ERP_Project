# B05-SVC-CAT-002

# Service Category Lifecycle

---

# Purpose

Defines the lifecycle of a service category from creation to retirement.

---

# Business Philosophy

Service Categories are business standards.

They should evolve carefully and remain historically traceable.

---

# Lifecycle

```text id="scl001"
Draft
↓
Active
↓
Inactive
↓
Archived
```

---

# Draft

Category being configured.

Not available for service orders.

---

# Active

Category available for:

* New Service Orders
* Pricing
* Reporting
* Technician Assignment

---

# Inactive

Category no longer available for new repairs.

Historical records remain.

---

# Archived

Retained for reporting purposes.

Cannot be reused.

---

# Editing Rules

Allowed:

* Description
* Estimated Time
* Warranty Settings

Restricted:

* Category Code

---

# Historical Integrity

Existing service orders must retain:

* Original Category
* Original Settings Snapshot

---

# Category Merge

Future Feature.

Allows multiple categories to be consolidated.

---

# Category Retirement

Example:

```text id="scl002"
Blackberry Trackball Repair
```

No longer offered.

Status:

```text id="scl003"
Inactive
```

---

# Summary

Service Categories follow controlled lifecycles.

Historical integrity must always be preserved.

---

# End Of Document
