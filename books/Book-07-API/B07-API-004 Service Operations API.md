---
document_id: B07-API-004
title: Service Operations API
version: 1.0.0
last_updated: 2026-07-04
author: Universal Service ERP Team
---

# Service Operations API

## Purpose
API specifications for the core repair workflows: Intake, Status Updates, QC, and Estimates.

---

# 1. Service Orders (`/api/service-orders`)

## `POST /api/service-orders` (Intake)
* **Purpose:** Creates a new repair ticket.
* **Validation (Zod):**
```typescript
const CreateServiceOrderSchema = z.object({
  customer_id: z.string().uuid(),
  device_id: z.string().uuid(),
  branch_id: z.string().uuid(),
  category: z.enum(['quick_service', 'regular_service']),
  service_type: z.string(),
  initial_complaint: z.string().min(5),
  device_condition_notes: z.string(),
  dynamic_attributes: z.record(z.any()).optional() // e.g. Charger Included = Yes
});
```
* **Side Effect:** Sets status to `intake`. Logs the initial status duration timer.

## `PATCH /api/service-orders/:id/status`
* **Purpose:** Transitions the repair to a new phase.
* **Validation (Zod):** `status` (Enum string).
* **Side Effect:** Automatically calculates the time spent in the previous status and saves it to `service_order_status_logs`. Checks blocking rules (e.g., Cannot transition to `completed` if pending inventory consumption exists).

## `PATCH /api/service-orders/:id/assign`
* **Purpose:** Assigns the repair to a specific technician (Push method) or allows a technician to claim it (Pull method).
* **Validation (Zod):** `technician_id` (UUID).

---

# 2. Service Estimates (`/api/service-orders/:id/estimates`)

## `POST /api/service-orders/:id/estimates`
* **Purpose:** Submits a price estimate for customer approval.
* **Validation (Zod):** `estimated_cost` (number, > 0), `notes` (string).
* **Side Effect:** Changes the parent Service Order status to `waiting_approval`. (This pauses the Technician KPI timer).

## `PATCH /api/service-orders/:id/estimates/:estimateId/approve`
* **Purpose:** Customer accepts the price.
* **Side Effect:** Resumes Technician KPI timer.

---

# 3. Quality Control (`/api/service-orders/:id/qc`)

## `POST /api/service-orders/:id/qc`
* **Purpose:** Submits the result of the QC checklist.
* **Validation (Zod):** `status` (enum: 'passed', 'failed'), `notes` (string).
* **Side Effect:** If 'failed', the Service Order status reverts to `rework` or `in_progress`. If 'passed', it can proceed to `completed`.
