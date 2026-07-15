---
document_id: B08-FE-005
title: Manager Dashboard Wireframes
version: 1.0.0
last_updated: 2026-07-04
author: Universal Service ERP Team
---

# Manager Dashboard Wireframes

## Purpose
Visualizes the holistic view of the branch for the Manager or Owner. It focuses on immediate operational awareness (bottlenecks, queues) and high-level financials.

---

# ASCII Wireframe: Real-Time Dashboard

```text
+-----------------------------------------------------------------------------+
| [=] Menu | Dashboard | Reports | Approvals | Settings   (Manager: Riyan)    |
+-----------------------------------------------------------------------------+
|                                                                             |
|   OVERVIEW (Today)                                                          |
|   +--------------------+  +--------------------+  +--------------------+    |
|   | 🟢 Revenue         |  | 🔵 Devices Fixed   |  | 🔴 Avg Wait Time   |    |
|   | Rp 15.000.000      |  | 42 Devices         |  | 45 Minutes         |    |
|   +--------------------+  +--------------------+  +--------------------+    |
|                                                                             |
|   ACTION REQUIRED (Bottlenecks)                                             |
|   +--------------------------------------------------------------------+    |
|   | [!] Purchase Order #PO-099 requires your approval.    [ APPROVE ]  |    |
|   | [!] Customer "Bapak Andi" waiting for estimate > 24H. [ FOLLOW UP ]|    |
|   | [!] iPhone 13 LCD stock is critical (2 left).         [ ORDER ]    |    |
|   +--------------------------------------------------------------------+    |
|                                                                             |
|   ACTIVE SHOP FLOOR                                                         |
|   Queue: 3 Customers Waiting  |  Technicians Active: 4 / 5                  |
|                                                                             |
+-----------------------------------------------------------------------------+
```

## API Integration Note
* **Data Fetching:** This page continuously polls (or uses WebSockets) via `GET /api/dashboard/queue` (`B07-API-007`).
* **Approval Actions:** Clicking `[ APPROVE ]` directly hits `PATCH /api/purchase-orders/:id/approve` (`B07-API-005`), allowing the manager to unblock operations instantly without navigating to a deep menu.
