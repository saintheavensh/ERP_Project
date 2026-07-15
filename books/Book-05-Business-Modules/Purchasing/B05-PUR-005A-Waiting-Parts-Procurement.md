# B05-PUR-005A

# Waiting Parts Procurement

---

# Purpose

Defines procurement processes initiated by Service Orders that are waiting for unavailable spareparts.

---

# Business Philosophy

Not all sparepart requirements should immediately become Purchase Requests.

The system should consolidate demand before procurement decisions are made.

---

# Core Principle

Waiting Parts requirements represent demand.

They do not automatically create Purchase Requests.

---

# Objectives

The Waiting Parts Procurement process exists to:

* Consolidate sparepart demand
* Reduce duplicate purchasing
* Improve purchasing efficiency
* Improve supplier planning
* Support service completion

---

# Workflow

```text
Service Order
↓
Waiting Parts
↓
Waiting Parts Requirement
↓
Requirement Pool
↓
Purchasing Decision
↓
Purchase Request
↓
Purchase Order
↓
Receiving
↓
Reservation
↓
Service Continuation
```

---

# Waiting Parts Requirement

When a Service Order enters:

```text
Waiting Parts
```

the system creates:

```text
Waiting Parts Requirement
```

instead of immediately creating a Purchase Request.

---

# Requirement Pool

The system should maintain a centralized requirement pool.

---

# Example

Service Orders:

```text
SO-001
LCD iPhone 11
Qty 1
```

```text
SO-002
LCD iPhone 11
Qty 1
```

```text
SO-003
LCD iPhone 11
Qty 1
```

The system consolidates:

```text
LCD iPhone 11
Qty 3
```

---

# Purchase Request Creation

Purchase Requests are created manually by:

* Owner
* Purchasing Staff
* Authorized Users

---

# Service Order Mapping

The system must maintain traceability.

Example:

```text
Requirement:
LCD iPhone 11
Qty 3
```

Linked Service Orders:

```text
SO-001
SO-002
SO-003
```

---

# Procurement Visibility

Purchasing personnel should be able to view:

* Required Part
* Total Quantity Needed
* Waiting Service Orders
* Customer Impact

---

# Reservation Integration

After inventory is received:

The system automatically allocates inventory to related Service Orders.

---

# Reporting

Support:

* Waiting Parts Demand
* Procurement Requirements
* Waiting Service Orders
* Procurement Lead Time

---

# Summary

Waiting Parts Procurement provides structured procurement planning for service-related sparepart requirements while maintaining full Service Order traceability.

---

# End Of Document
