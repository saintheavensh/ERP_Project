# AI Agent Build Guide

> **For implementation progress tracking, see `PHASES.md` in the project root.**
> **For coding standards, see `coding-guidelines.md` in this folder.**

This document provides context and rationale for each build phase. The actual checklist is in `PHASES.md`.

## Build Philosophy

1. **One phase at a time** — never skip or combine phases.
2. **Vertical slice first** — build one complete flow end-to-end before expanding horizontally to all modules.
3. **Engine before features** — the Flow Engine is the heart; build it before building business modules.
4. **Test as you go** — every phase includes verification. Don't move on until the current phase is verified.

## Phase Overview

### Phase 0: Documentation Consolidation
Merge `docs/` and `books/` into `specification/`. No code.

### Phase 1: Project Setup & Database
Initialize Hono backend and SvelteKit frontend. Push schema to local PostgreSQL using `npx drizzle-kit push`. Verify database connection and health check endpoint.

### Phase 2: Flow Engine
Build the modular workflow engine — the heart of the product. This includes:
- CRUD for Flow Templates and Flow Nodes
- Transition validation (can this ticket move from Node A to Node B?)
- Stage history recording (append-only)
- Event emission on state change

**Critical: This phase must have comprehensive unit tests.**

### Phase 3: Vertical Slice
Build ONE complete end-to-end flow to prove the architecture:
`Ticket Intake → Diagnosis → Approval → Parts Reserve (FIFO) → Repair → QC → POS Invoice → Payment → Finance Ledger`

This is the most important validation — if this flow works, the architecture is sound.

### Phase 4: RBAC & Audit
Layer permission checks and audit logging onto all existing routes. This is done AFTER the vertical slice so we have real routes to protect.

### Phase 5: Core UI
Build the essential SvelteKit screens: login, dashboard, ticket board, POS, inventory, finance.

### Phase 6: Printer Integration
Build the Python Flask agent for thermal printing. Separate from the main backend.

### Phase 7: Builder UIs
Build the Flow Template Builder and Printer Template Builder — the configuration UIs that make FlowServ different.

### Phase 8: Business Module Expansion
Implement remaining MVP features across all domains (Customer, Device, Supplier, Purchasing, Warranty, etc.).

### Phase 9: Testing & Polish
Comprehensive integration testing, permission matrix verification, multi-tenant isolation testing, mobile responsiveness.

### Phase 10: Pilot Deployment
Deploy to Railway/Render, set up CI/CD, onboard first real tenant.

### Phase 11: Post-MVP Features
Implement Phase 2 (🟡) features based on pilot feedback.

## Key Architecture Decisions (Do Not Override)

| Decision | Details |
|----------|---------|
| Multi-tenancy | Shared database with `tenant_id` on every table + PostgreSQL RLS |
| Costing method | FIFO per supplier batch |
| Stock tracking | Append-only stock_movements ledger |
| Finance | Event-driven, real-time job costing per ticket |
| Flow Engine | Data-driven (FlowTemplate/FlowNode/FlowTransition as DB rows, not hardcoded logic) |
| Auth | JWT with `tenant_id` claim |
| Printer | Thermal = Python local agent; A4 = browser `window.print()` |
