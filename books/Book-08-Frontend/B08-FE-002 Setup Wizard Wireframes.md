---
document_id: B08-FE-002
title: Setup Wizard Wireframes
version: 1.0.0
last_updated: 2026-07-04
author: Universal Service ERP Team
---

# Setup Wizard Wireframes

## Purpose
Visualizes the one-time onboarding experience (Zero State Protocol). The goal is to make the user feel like they are setting up a premium SaaS product.

---

# ASCII Wireframe: Step 1 (Welcome & Branch Setup)

```text
+-----------------------------------------------------------------------------+
|                                                                             |
|                                                                             |
|                       Welcome to Universal Service ERP                      |
|                                                                             |
|            Let's get your business up and running in 3 easy steps.          |
|                                                                             |
|                                                                             |
|     +-----------------------------------------------------------------+     |
|     |  Step 1: Your First Branch                                      |     |
|     |                                                                 |     |
|     |  Branch Name:                                                   |     |
|     |  [ Maju Jaya Pusat                                            ] |     |
|     |                                                                 |     |
|     |  Branch Address:                                                |     |
|     |  [ Jl. Sudirman No. 1, Jakarta                                ] |     |
|     |                                                                 |     |
|     |                                                                 |     |
|     |                           [ Next Step -> ]                      |     |
|     +-----------------------------------------------------------------+     |
|                                                                             |
|                                                                             |
+-----------------------------------------------------------------------------+
```

# ASCII Wireframe: Step 3 (Dynamic Widget Selection)

```text
+-----------------------------------------------------------------------------+
|                                                                             |
|     +-----------------------------------------------------------------+     |
|     |  Step 3: What do you repair?                                    |     |
|     |  Select categories to automatically configure your Intake Forms.|     |
|     |                                                                 |     |
|     |  [x] Smartphones                                                |     |
|     |      (Includes fields for IMEI, PIN, Battery Health)            |     |
|     |                                                                 |     |
|     |  [x] Laptops & PCs                                              |     |
|     |      (Includes fields for Charger included, HDD status)         |     |
|     |                                                                 |     |
|     |  [ ] Printers                                                   |     |
|     |      (Includes fields for Ink Level, Page Count)                |     |
|     |                                                                 |     |
|     |                 [ <- Back ]           [ Finish Setup ]          |     |
|     +-----------------------------------------------------------------+     |
|                                                                             |
+-----------------------------------------------------------------------------+
```

## API Integration Note
* **Endpoint:** Clicking "Finish Setup" triggers `POST /api/setup` (`B07-API-002`).
* **Effect:** The system seeds the `device_categories` table based on the checkboxes ticked in Step 3.
