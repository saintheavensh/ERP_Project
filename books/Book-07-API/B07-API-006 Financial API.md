---
document_id: B07-API-006
title: Financial API
version: 1.0.0
last_updated: 2026-07-04
author: Universal Service ERP Team
---

# Financial API

## Purpose
API specifications for generating invoices, receiving payments (including Down Payments), processing retail sales, and calculating technician commissions.

---

# 1. Retail Sales (`/api/retail`)

## `POST /api/retail/checkout`
* **Purpose:** One-shot endpoint for processing a direct retail sale.
* **Validation (Zod):** `items` (array of `product_id`, `quantity`), `payment_method`, `amount_paid`.
* **Side Effect:** 
  1. Deducts FIFO inventory batches immediately.
  2. Creates an `invoice` (status: `paid`).
  3. Creates a `payment` record.

---

# 2. Service Invoicing (`/api/invoices`)

## `POST /api/invoices/generate`
* **Purpose:** Converts a `Completed` Service Order into a billing Invoice.
* **Validation:** `service_order_id`.
* **Side Effect:** Gathers all consumed spare parts (and their FIFO costs) and the final Service Fee to generate the total bill. Sets invoice status to `unpaid`.

---

# 3. Payments & DP (`/api/payments`)

## `POST /api/payments`
* **Purpose:** Receives money from the customer. Supports partial payments (DP).
* **Validation (Zod):**
```typescript
const CreatePaymentSchema = z.object({
  invoice_id: z.string().uuid(),
  amount: z.number().positive(),
  payment_method: z.enum(['cash', 'transfer', 'card', 'ewallet']),
  payment_type: z.enum(['dp', 'final_payment'])
});
```
* **Side Effect:** If `payment_type` is `dp`, it marks the invoice as `partial`. If the remaining balance becomes 0, it marks the invoice as `paid`.

---

# 4. Commissions (`/api/commissions`)

## `POST /api/commissions/calculate`
* **Purpose:** Internal endpoint triggered automatically when an Invoice is marked as `paid`.
* **Mechanism:** 
  1. Checks if the `service_order` has an assigned technician.
  2. Looks up the technician's specific commission setting in `users` or `settings`.
  3. Calculates the commission based purely on the `Service Fee` (excluding spare part costs).
  4. Inserts a record into `technician_commissions`.
