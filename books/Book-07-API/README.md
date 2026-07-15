# Book 07 - API Architecture

This directory contains the specifications for the Backend API. The API is the bridge between the Frontend (Book-08) and the Database (Book-06).

## Core Technical Standards
1. **Framework:** Hono (Edge-compatible, ultra-fast routing).
2. **Validation:** Zod schemas are strictly required for all input payloads.
3. **Response Format:** A standardized JSON envelope (`success`, `data`, `error`, `message`) must be returned by all endpoints.
4. **Type Safety:** Strict TypeScript interfaces ensure data integrity across the network boundary.

## Specification Documents

* **[B07-API-001 API Architecture Principles](B07-API-001%20API%20Architecture%20Principles.md):** Defines standard HTTP methods, JSON structures, and Zod integration.
* **[B07-API-002 Core Entities API](B07-API-002%20Core%20Entities%20API.md):** Endpoints for managing Branches, Users, and Customers.
* **[B07-API-003 Dynamic Widgets API](B07-API-003%20Dynamic%20Widgets%20API.md):** Endpoints for fetching dynamic JSON schemas for Intake forms based on device category.
* **[B07-API-004 Service Operations API](B07-API-004%20Service%20Operations%20API.md):** Endpoints for Service Order lifecycle (Intake, QC, Status changes).
* **[B07-API-005 Inventory & Purchasing API](B07-API-005%20Inventory%20&%20Purchasing%20API.md):** Endpoints for FIFO Goods Receipt, Purchase Orders, and Deferred Stock Consumption.
* **[B07-API-006 Financial API](B07-API-006%20Financial%20API.md):** Endpoints for Checkout, Invoicing, DP/Payments, and calculating Technician Commissions.
* **[B07-API-007 Dashboard API](B07-API-007%20Dashboard%20API.md):** Real-time operational queues and historical financial/inventory metrics.
