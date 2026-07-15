---
document_id: B07-API-003
title: Dynamic Widgets API
version: 1.0.0
last_updated: 2026-07-04
author: Universal Service ERP Team
---

# Dynamic Widgets API

## Purpose
API specifications for handling Dynamic Forms. This allows the ERP to serve various device types (Phones, Laptops, Printers, Consoles) without requiring hardcoded backend changes for each new type.

---

# 1. Device Categories (`/api/device-categories`)

## `GET /api/device-categories`
* **Purpose:** Get a list of supported device types (e.g., to populate a dropdown during Intake).
* **Response Data:**
```json
[
  { "id": "uuid-1", "name": "Smartphone" },
  { "id": "uuid-2", "name": "Printer" }
]
```

## `GET /api/device-categories/:id/widget-schema`
* **Purpose:** Fetches the dynamic JSON schema that tells the Frontend how to render the intake form for this specific category.
* **Response Data Example (Smartphone):**
```json
{
  "fields": [
    { "name": "imei", "label": "IMEI / SN", "type": "text", "required": true },
    { "name": "pin", "label": "Device PIN", "type": "password", "required": false }
  ]
}
```
* **Response Data Example (Printer):**
```json
{
  "fields": [
    { "name": "ink_level", "label": "Ink Level", "type": "select", "options": ["High", "Low", "Empty"] },
    { "name": "page_count", "label": "Total Page Count", "type": "number" }
  ]
}
```

---

# 2. Devices (`/api/devices`)

## `POST /api/devices`
* **Purpose:** Register a new device. The payload includes the specific dynamic attributes based on the widget schema.
* **Validation (Zod):** 
```typescript
const CreateDeviceSchema = z.object({
  category_id: z.string().uuid(),
  brand: z.string(),
  model: z.string(),
  serial_number: z.string(),
  dynamic_attributes: z.record(z.any()) // Accepts the dynamic JSON payload
});
```
