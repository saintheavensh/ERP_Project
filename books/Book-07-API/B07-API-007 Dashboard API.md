---
document_id: B07-API-007
title: Dashboard API
version: 1.0.0
last_updated: 2026-07-04
author: Universal Service ERP Team
---

# Dashboard & Reporting API

## Purpose
API specifications for serving real-time operational metrics and historical reports without locking transactional tables.

---

# 1. Operational Real-Time Dashboard (`/api/dashboard`)

## `GET /api/dashboard/queue`
* **Purpose:** Feeds the "Active Shop Floor" view.
* **Response Data:**
  * Number of `Quick Service` tasks waiting.
  * Number of `Regular Service` tasks in progress.
  * List of Bottlenecks (Service Orders stuck in `waiting_approval` > 24 hours or `waiting_part` > 48 hours).

## `GET /api/dashboard/technician`
* **Purpose:** Tailored view for the logged-in technician.
* **Response Data:**
  * Active tasks assigned to them.
  * Number of QC rejects (Reworks).
  * Estimated commission earned today (from `paid` invoices).

---

# 2. Historical Reporting (`/api/reports`)

## `GET /api/reports/financial`
* **Purpose:** Aggregates revenue, exact FIFO-based Cost of Goods Sold (COGS), and Gross Profit.
* **Query Params:** `?start_date=2026-01-01&end_date=2026-01-31&branch_id=UUID`

## `GET /api/reports/inventory`
* **Purpose:** Generates stock valuation based on remaining FIFO batches, and highlights fast/slow moving items.
