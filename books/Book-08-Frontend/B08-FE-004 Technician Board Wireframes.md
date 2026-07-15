---
document_id: B08-FE-004
title: Technician Board Wireframes
version: 1.0.0
last_updated: 2026-07-04
author: Universal Service ERP Team
---

# Technician Board Wireframes

## Purpose
Visualizes the workspace for Technicians. This screen must minimize distraction, focus on the active repair, and clearly separate blockers (waiting for parts) from active work.

---

# ASCII Wireframe: Kanban Style Board

```text
+-----------------------------------------------------------------------------+
| [=] Menu | My Board | Global Queue | Inventory      (Technician: Budi)      |
+-----------------------------------------------------------------------------+
|                                                                             |
|  [ To Do (2) ]          [ In Progress (1) ]       [ Blocked (1) ]           |
|  +-----------------+    +-----------------+       +-----------------+       |
|  | URGENT: iPhone  |    | Samsung S22     |       | Lenovo Thinkpad |       |
|  | Screen Replace  |    | Water Damage    |       | Status: Wait Part       |
|  | (Waiting: 15m)  |    |                 |       |                 |       |
|  | [ START WORK ]  |    | [ PAUSE / EST ] |       | [ CHECK STOCK ] |       |
|  +-----------------+    | [ FINISH & QC ] |       +-----------------+       |
|                         +-----------------+                                 |
|  +-----------------+                                                        |
|  | MacBook Air     |                                                        |
|  | Battery         |                                                        |
|  | (Assigned)      |                                                        |
|  | [ START WORK ]  |                                                        |
|  +-----------------+                                                        |
|                                                                             |
+-----------------------------------------------------------------------------+
```

## API Integration Note
* **Drag and Drop / Button Click:** Clicking `[ START WORK ]` or dragging a card to the "In Progress" column triggers `PATCH /api/service-orders/:id/status` (`B07-API-004`) with `status: "in_progress"`.
* **KPI Protection:** Moving a card to `Blocked` (Waiting Part) pauses the technician's timer automatically in the backend. The UI color should change to gray or red to indicate it is out of the technician's hands.
