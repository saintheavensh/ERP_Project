# Technician Features

> **Implementation status (2026-07-23, refreshed from 2026-07-20 — see F8):** Partial
> **Built:** manual technician assignment — `service_tickets.assignedTechnicianId`/
> `assignedAt` are genuinely written via `POST /v1/tickets/:id/assign` (H8), wired to
> a real UI on the ticket workspace (F1), and the Technician role's "My Jobs" list
> actually filters to the logged-in technician's own tickets instead of showing
> everyone's (F2). A seeded Technician user exists (`technician@demo.com`).
> **Not built:** technician profiles beyond the base user record, skill management,
> assignment recommendation (assignment is manual-only, no scoring), execution-state
> tracking (started/paused/resumed), waiting-parts auto-purchase-request, external
> purchase/reimbursement, QC role, performance metrics, calendar/schedule view,
> commission calculation. All remain Phase 8.

## Purpose
Manage technician profiles, assignments, performance, and the technician workspace.

## Core Principle
> System recommends, human decides. Assignment recommendations assist but don't replace judgment.

## Features

| ID | Feature | Description | Business Rules |
|----|---------|-------------|---------------|
| TECH-001 | Profile Management | Name, contact, employment status, branch assignment | Admin/Branch Mgr manages |
| TECH-002 | Skill Management | Define skills per technician (e.g., "LCD Repair", "Motherboard"). Used for assignment recommendation | Skills matched to service categories |
| TECH-003 | Assignment | Manual assignment (default) with system recommendation based on: skill match, device experience, brand experience, workload, performance | Human makes final decision |
| TECH-004 | Execution Tracking | Track repair progress: started, paused (waiting parts), resumed, completed | Timestamps recorded |
| TECH-005 | Waiting Parts | When part not available: ticket paused, auto-generates purchase request, resumes when part arrives | System tracks waiting duration |
| TECH-006 | External Purchase | Technician buys part externally (emergency). Submit receipt for reimbursement | Phase 2. Needs Branch Mgr approval |
| TECH-007 | Reimbursement | Process tech reimbursement for external purchases | Phase 2. Finance approval |
| TECH-008 | QC Role | Senior technicians verify repair quality via checklist | QC pass required for completion |
| TECH-009 | Performance Metrics | KPIs: completed repairs, avg repair time, QC pass rate, warranty return rate, rework rate. Period: daily/weekly/monthly | Phase 2. Management visibility only |
| TECH-010 | Dashboard | My Assigned Jobs, Waiting Parts Queue, QC Queue, Today's Activities, Notifications, Quick Actions (Start/Update/Request Parts/Complete) | Mobile-friendly required |
| TECH-011 | Commission | Calculate commission based on completed repairs, categories, performance tier | Phase 2 |
| TECH-012 | Business Rules | Max active jobs per technician (configurable), skill match validation | System-enforced |
| TECH-013 | Calendar / Schedule View | Daily/weekly view of assigned jobs with due dates. Color-coded by status. Drag-drop rescheduling (Branch Mgr only). Technician sees own schedule only | MVP feature |
| TECH-014 | Workload Heatmap | Visual team workload across all technicians. Helps balance assignments | Phase 2 |
| TECH-015 | Reassignment | Reassign ticket to different technician with mandatory reason: technician leave, escalation, skill requirement, workload balancing. History tracked | Audit logged |

## Assignment Sources
- New Service Orders
- Escalated Repairs
- Rework Jobs
- Warranty Jobs

## Integration
- **Service**: Technician assigned to tickets
- **Inventory**: Technician triggers part consumption
- **Finance**: Commission calculation links to finance module
