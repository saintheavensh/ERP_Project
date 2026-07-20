# Dashboard, Widgets & Reporting Features

> **Implementation status (2026-07-20):** Not started
> No dashboards, widgets, widget layout persistence, or alerts exist. The `/` route
> renders a placeholder. Brand management (BRD-*) is partially built — see
> `09-supplier.md`. Planned for Phase 5 (dashboards) and Phase 8 (alerts).

## Purpose
Provide role-based dashboards with configurable widgets, proactive alerts, and brand management.

## Dashboard Types

| Dashboard | Role | Key Widgets |
|-----------|------|-------------|
| Executive | Owner | Cross-branch revenue, margin trends, active tickets, top performers |
| Operational | Branch Mgr | Waiting diagnosis/approval/parts, in progress, QC queue, ready for pickup |
| Financial | Owner, Finance | Income today, P&L summary, AR/AP status, cash position |
| Service | Branch Mgr | Open tickets by stage, avg repair time, warranty return rate, revenue per ticket |
| Technician | Tech | My assigned jobs, waiting parts queue, QC queue, today's activities, personal metrics |

## Widget Framework

| ID | Feature | Description |
|----|---------|-------------|
| WDG-001 | Framework | Widgets are independent components with lifecycle: register → init → load → render → interact → refresh → dispose |
| WDG-002 | Drag-and-Drop | Users can reposition widgets on their dashboard |
| WDG-003 | Resize/Collapse | Widgets can be resized, collapsed, or expanded |
| WDG-004 | Persistence | Each user's layout is saved and restored between sessions |
| WDG-005 | Reset to Default | Users can restore the default dashboard layout for their role |
| WDG-006 | Role-Based Catalog | Admin controls which widgets are available to which roles |

### Widget Rules
- Widgets must remain independent — no direct widget-to-widget communication
- Widgets retrieve data through public module services
- A failing widget must not prevent other widgets from loading
- Widget categories: Service, Inventory, Sales, Purchase, Finance, Customer, Technician, Analytics, System

## Dashboard Alerts

| Category | Examples |
|----------|---------|
| Service | Waiting parts too long, unapproved estimates, overdue repairs |
| Inventory | Low stock, critical stock, negative stock |
| Purchasing | Outstanding PO, delayed deliveries, backorders |
| Financial | Overdue receivables, overdue payables, cash shortage |
| Warranty | High warranty returns, repeat failure patterns |

Alert priorities: Information, Warning, Critical. All role-based visibility.

## Brand Management

| ID | Feature | Description |
|----|---------|-------------|
| BRD-001 | Brand Management | Register and manage device/part brands |
| BRD-002 | Classification | Categorize brands (premium, standard, economy) |
| BRD-003 | Reporting | Most serviced brands, brand distribution analytics (Phase 2) |
| BRD-004 | Business Rules | Brand must exist before linking to device or part |
