---
document_id: B08-FE-003
title: Cashier Intake Wireframes
version: 1.0.0
last_updated: 2026-07-04
author: Universal Service ERP Team
---

# Cashier Intake Wireframes

## Purpose
Visualizes the Point of Sale (POS) and Service Intake screen. This screen must be built for extreme speed and touch-friendliness.

---

# ASCII Wireframe: Intake Form (Dynamic Widget)

```text
+-----------------------------------------------------------------------------+
| [=] Menu | New Intake | POS Retail | Pickup               (Cashier: Andi)   |
+-----------------------------------------------------------------------------+
|                                                                             |
|  1. Customer Info                                                           |
|  [ Search Customer or Type New Name...                            ] [🔍]    |
|                                                                             |
|  2. Device Category                                                         |
|  +--------------+  +--------------+  +--------------+                       |
|  | [Smartphone] |  |   Laptop     |  |   Console    |                       |
|  +--------------+  +--------------+  +--------------+                       |
|                                                                             |
|  3. Device Details (Dynamically Loaded based on Category = Smartphone)      |
|  Brand: [ Apple         v]  Model: [ iPhone 13 Pro                  ]       |
|  IMEI : [ 351234567890123                                           ]       |
|  PIN  : [ 123456 ]                                                          |
|                                                                             |
|  4. Complaint & Service                                                     |
|  Complaint: [ Screen is shattered, touch not working                ]       |
|  Priority : ( ) Regular Service   (x) Quick Service (Wait in store)         |
|                                                                             |
|  +-----------------------------------------------------------------------+  |
|  |                         [ CREATE SERVICE TICKET ]                     |  |
|  +-----------------------------------------------------------------------+  |
|                                                                             |
+-----------------------------------------------------------------------------+
```

## API Integration Note
* **Dynamic Widget Fetch:** When the cashier clicks the `[Smartphone]` button, the Frontend calls `GET /api/device-categories/:id/widget-schema` (`B07-API-003`) and instantly renders the IMEI and PIN fields.
* **Submission:** Clicking "Create Service Ticket" triggers `POST /api/service-orders` (`B07-API-004`). The IMEI and PIN are packed cleanly into the `dynamic_attributes` JSON payload.
