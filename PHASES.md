# FlowServ — Implementation Phases & Checklist

> **RULE: Work on ONE phase at a time. Do NOT skip or combine phases.**
> Before starting any work, check this file to know which phase is current.
> Mark items `[/]` when in progress, `[x]` when done.

---

## Current Phase: `PHASE 4 (Purchasing, Supplier Debts, & Margins)` ← IN PROGRESS

---

## Git Workflow (MANDATORY for all AI Agents)

- **Branch per phase:** `phase-1/project-setup`, `phase-2/flow-engine`, etc.
- **Commit after each task:** Use conventional commits: `feat:`, `fix:`, `docs:`, `chore:`
- **Merge to main** after a phase is fully verified
- **Before starting work:** Check current branch with `git branch`
- **Never commit to `main` directly** — always work in a phase branch

---

## PHASE 0 — Documentation Consolidation ✅ COMPLETE
> **Goal:** Merge docs/ + books/ into specification/, create feature catalog, clean up project.

- [x] 0.0 Create `specification/coding-guidelines.md` (Coding Standards)
- [x] 0.1 Create `specification/` folder structure (12 core docs)
- [x] 0.2 Create `specification/features/` — Feature Catalog (14 docs)
- [x] 0.3 Create `specification/frameworks/` — Business Frameworks (5 docs)
- [x] 0.4 Add `DEPRECATED.md` to `docs/` and `books/`
- [x] 0.5 Update CLAUDE.md to point to `specification/`
- [x] 0.6 Delete `frontend/` folder
- [x] 0.7 Delete `backend/` folder
- [x] 0.8 Verify: all specification files exist

---

## PHASE 1 — Project Setup, Cleanup & Database
> **Goal:** Clean root, init git, setup monorepo (BE + FE), push schema to local PostgreSQL.
> **Prerequisite:** PHASE 0 complete. PostgreSQL installed locally.
> **Network:** Local-first. Access via LAN/WiFi (192.168.x.x). VPS deployment is a future phase.

### 1A. Root Cleanup
- [x] 1A.1 Delete unused files: `ROADMAP.md`, `CHANGELOG.md`, `CONTRIBUTING.md`
- [x] 1A.2 Delete unused folders: `glossary/`, `templates/`, `scripts/`, `assets/`, `implementation plan/`
- [x] 1A.3 Delete old package files: `package.json`, `pnpm-lock.yaml`, `node_modules/`
- [x] 1A.4 Update `.gitignore` (node_modules, .env, dist, .drizzle, etc.)

### 1B. Git Initialization
- [x] 1B.1 Initialize git repo (or reinitialize if `.git` exists)
- [x] 1B.2 Create initial commit with current state: `docs: phase 0 complete — specification consolidated`
- [x] 1B.3 Create branch `phase-1/project-setup`

### 1C. Backend Setup (flowserv-api/)
- [x] 1C.1 Create `flowserv-api/` with `package.json`
- [x] 1C.2 Install dependencies: hono, @hono/node-server, drizzle-orm, pg, zod, drizzle-zod, dotenv, @hono/zod-validator
- [x] 1C.3 Install dev dependencies: typescript, tsx, vitest, drizzle-kit, @types/pg
- [x] 1C.4 Move `db/schema.ts` → `flowserv-api/src/db/schema.ts`
- [x] 1C.5 Move `drizzle.config.ts` → `flowserv-api/drizzle.config.ts`
- [x] 1C.6 Create `flowserv-api/src/db/connection.ts` (database connection)
- [x] 1C.7 Create `flowserv-api/src/lib/response.ts` (standardized API response helper)
- [x] 1C.8 Create `flowserv-api/src/middleware/error-handler.ts`
- [x] 1C.9 Create `flowserv-api/src/index.ts` (entry point + health check `/v1/health`)
- [x] 1C.10 Create `.env` with DATABASE_URL
- [x] 1C.11 Run `npx drizzle-kit push` — verify tables exist in PostgreSQL
- [x] 1C.12 Verify: `npm run dev` starts, `GET /v1/health` returns `{ data: { status: "ok" } }`

### 1D. Frontend Setup (flowserv-web/)
- [x] 1D.1 Create SvelteKit project in `flowserv-web/`
- [x] 1D.2 Install dependencies: tailwindcss, shadcn-svelte
- [x] 1D.3 Create `flowserv-web/src/lib/api/client.ts` (base API client pointing to localhost:3001)
- [x] 1D.4 Create basic layout with sidebar placeholder
- [x] 1D.5 Create health check page that calls `/v1/health` and displays result
- [x] 1D.6 Verify: `npm run dev` starts, health check page shows "API Connected"

### 1E. Seed Data
- [x] 1E.1 Create `flowserv-api/src/db/seed.ts`
- [x] 1E.2 Add script to `package.json` (`"db:seed": "tsx src/db/seed.ts"`)
- [x] 1E.3 Write seed data for `roles` (Super Admin, Manager, Technician, Cashier)
- [x] 1E.4 Write seed data for one default `tenant` (e.g., "Demo Service Center")
- [x] 1E.5 Write seed data for one `user` (Super Admin) linked to Demo tenant
- [x] 1E.6 Run `npm run db:seed` and verify data in database
- [x] 1E.7 Commit: "feat: phase 1E complete - seed data"

### 1F. Final Verification
- [x] 1F.1 Backend starts and connects to PostgreSQL
- [x] 1F.2 Frontend starts and health check passes
- [x] 1F.3 Verify all files follow strict typing rules (`no implicit any`)
- [x] 1F.4 Commit: "feat: phase 1 completed - system verification"
- [ ] 1F.5 Merge `phase-1/project-setup` → `main`

---

## PHASE 2 — Auth + Flow Engine (BE + FE)
> **Goal:** Build authentication + the modular workflow engine. Display results in UI.
> **Read first:** specification/02-architecture.md, specification/03-rbac-roles.md
> **Branch:** `phase-2/auth-flow-engine`

### 2A. Authentication (BE + FE)
- [x] 2A.1 BE: Auth routes — register, login (returns JWT with tenant_id + user_id)
- [x] 2A.2 BE: Auth middleware (verify JWT, extract tenant_id)
- [x] 2A.3 FE: Login page (form → call API → store token)
- [x] 2A.4 FE: Protected layout (redirect to login if no token)
- [x] 2A.5 Verify: login works, protected pages redirect

### 2B. Flow Engine Core (BE)
- [x] 2B.1 Flow Template CRUD (read/write FlowTemplate + FlowNode from DB)
- [x] 2B.2 Transition validation engine (validate state changes per FlowTransition rules)
- [x] 2B.3 Stage history recording (TicketStageHistory — append-only)
- [x] 2B.4 Event emission on state change (internal event bus)
- [x] 2B.5 **Unit tests** — transition validation, invalid transitions, permission checks

### 2C. Flow Engine Visualization (FE)
- [x] 2C.1 FE: Flow template list UI
- [x] 2C.2 FE: Flow detail view (visualize nodes and transitions)
- [x] 2C.3 Merge `phase-2/auth-flow-engine` → `main`
- [x] 2C.4 Git commit: `feat: phase 2 complete — auth + flow engine`

---

## PHASE 3 — Vertical Slice: One Complete Service Flow (BE + FE)
> **Goal:** Build ONE end-to-end flow with both API and UI.
> **Read first:** specification/features/02-service.md, specification/features/06-inventory.md
> **Branch:** `phase-3/vertical-slice`

### 3A. Customer & Device (BE + FE)
- [ ] 3A.1 BE: Customer CRUD endpoints
- [ ] 3A.2 BE: Device (CustomerAsset) CRUD endpoints
- [ ] 3A.3 FE: Customer list + create form
- [ ] 3A.4 FE: Device list + create form

### 3B. Service Ticket (BE + FE)
- [ ] 3B.1 BE: Create ticket (intake) — with Zod validation
- [ ] 3B.2 BE: Transition ticket to next stage (uses Flow Engine)
- [ ] 3B.3 BE: Get ticket detail + stage history
- [ ] 3B.4 FE: Ticket creation form (select customer, device, complaint)
- [ ] 3B.5 FE: Ticket Kanban board (columns = flow nodes, drag-drop)
- [ ] 3B.6 FE: Ticket detail page (timeline, current stage, actions)

### 3C. Inventory + FIFO (BE + FE)
- [x] 3C.1 BE: Inventory item CRUD
- [x] 3C.2 BE: Batch creation (goods receipt → FIFO batch)
- [x] 3C.3 BE: Parts reservation (soft-lock)
- [x] 3C.4 BE: Parts consumption (hard deduction, FIFO order)
- [x] 3C.5 FE: Inventory list page (stock levels, alerts)
- [x] 3C.6 FE: Stock receipt form (add batch)

### 3D. POS + Finance (BE + FE)
- [ ] 3D.1 BE: POS transaction + invoice generation
- [ ] 3D.2 BE: Payment processing (partial/full)
- [ ] 3D.3 BE: Finance ledger posting (COGS, revenue)
- [ ] 3D.4 FE: Simple POS page (linked to ticket)
- [ ] 3D.5 FE: Payment form
- [ ] 3D.6 **Unit tests** — FIFO batch split, ledger accuracy, stock levels

### 3E. Verify Full Flow
- [ ] 3E.1 Test full flow in UI: Intake → Diagnosis → Approve → Reserve Part → Repair → QC → Invoice → Pay → Close
- [ ] 3E.2 Verify: stock levels decreased, finance ledger entries created, ticket closed
- [ ] 3E.3 Git commit: `feat: phase 3 complete — vertical slice working`

---

## PHASE 4 — Purchasing, Supplier Debts, & Margins
> **Goal:** Build Supplier Management, Purchasing (Costing), AP (Hutang), and Dynamic Margin Pricing (Markup vs Gross Margin).
> **Branch:** `phase-4/purchasing`

### 4A. Supplier & Hutang (Accounts Payable)
- [ ] 4A.1 BE: Create Supplier CRUD routes & schema
- [ ] 4A.2 FE: Supplier Management page
- [ ] 4A.3 BE: AP (Accounts Payable) routes for tracking supplier debts
- [ ] 4A.4 FE: Manajemen Hutang Supplier page (with aging/tempo limits)

### 4B. Purchasing (PO & Costing)
- [ ] 4B.1 BE: Purchase Order routes (receiving goods, updating stock_batches)
- [ ] 4B.2 FE: Input Invoice/Costing page (with Payment Method: Tunai, Transfer, Tempo)
- [ ] 4B.3 BE: Auto-calculate `dueDate` based on Supplier's `paymentTermDays`
- [ ] 4B.4 FE: Auto-fill due date when selecting 'Tempo'

### 4C. Dynamic Margin Pricing
- [ ] 4C.1 BE: Add Margin Config (Type: Markup/GrossMargin, Target: X%) to settings/tenant
- [ ] 4C.2 BE: Update product pricing when new stock arrives (based on new modal/cost & margin config)
- [ ] 4C.3 FE: Show warning if new price changes drastically or modal > margin limit
- [ ] 4C.4 FE: Inventory page enhancements (show margin column, filter/sort by margin)
- [ ] 4C.5 Git commit: `feat: phase 4 complete — purchasing & margins`

---

## PHASE 5 — Core UI Polish (FE)
> **Goal:** Build remaining essential UI screens and polish the experience.
> **Read first:** specification/08-ui-ux.md, specification/features/12-dashboard-reporting.md
> **Branch:** `phase-5/core-ui`

- [ ] 5.1 Dashboard: Per-role default dashboards with widget layout
- [ ] 5.2 Ticket Board: Polish Kanban with status colors, filters
- [ ] 5.3 Ticket Detail: Timeline, cost breakdown, attachments
- [ ] 5.4 Inventory Dashboard: Stock levels, low-stock alerts, batch history
- [ ] 5.5 Product Catalog: Browse by category, supplier price comparison
- [ ] 5.6 POS/Cashier Screen: Touch-friendly, big buttons
- [ ] 5.7 Global Search: Typo-tolerant, grouped results
- [ ] 5.8 Technician Dashboard: My Jobs, Quick Actions, Calendar/Schedule
- [ ] 5.9 Finance Dashboard: Simple Mode + Accountant Mode toggle
- [ ] 5.10 Settings pages: Company, Branches, Roles, Printer config
- [ ] 5.11 Git commit: `feat: phase 5 complete — core UI polished`

---

## PHASE 6 — Printer Integration (Python)
> **Goal:** Build local thermal printer agent.
> **Read first:** specification/09-printer-integration.md
> **Branch:** `phase-6/printer`

- [ ] 6.1 Flask app: POST /print endpoint
- [ ] 6.2 Default template per paper size (58mm/80mm)
- [ ] 6.3 FE: Printer settings page (devices, templates, assignments)
- [ ] 6.4 Verify: physical print test
- [ ] 6.5 PyInstaller packaging
- [ ] 6.6 Git commit: `feat: phase 6 complete — printer integration`

---

## PHASE 7 — Builder UIs
> **Goal:** Build configuration UIs that make FlowServ unique.
> **Branch:** `phase-7/builders`

- [ ] 7.1 Flow Template Builder: Visual editor for nodes + transitions
- [ ] 7.2 Printer Template Builder: WYSIWYG editor + preview
- [ ] 7.3 RBAC Management UI: Visual permission matrix
- [ ] 7.4 Git commit: `feat: phase 7 complete — builder UIs`

---

## PHASE 8 — Business Module Expansion
> **Goal:** Implement remaining MVP features per domain.
> **Read first:** specification/features/00-feature-catalog.md (filter MVP ✅)
> **Branch:** `phase-8/modules`

- [ ] 8.1 Customer Management (profile, duplicate detection, history)
- [ ] 8.2 Device Management (identification, compatibility, status)
- [ ] 8.3 Supplier Management (profile, categories, pricing)
- [ ] 8.4 Purchasing (PO, goods receiving, returns)
- [ ] 8.5 Sales (walk-in, returns, discounts)
- [ ] 8.6 Service Billing (quotation, deposit, invoice, refund)
- [ ] 8.7 Warranty (templates, activation, claims)
- [ ] 8.8 Technician (skills, performance, commission)
- [ ] 8.9 Finance (AR, AP, COA, journal, P&L)
- [ ] 8.10 Dashboard Alerts (service, inventory, finance, warranty)
- [ ] 8.11 Customer Portal (magic link, approve/reject quote)
- [ ] 8.12 Git commit: `feat: phase 8 complete — all MVP modules`

---

## PHASE 9 — Testing & Local Network Deployment
> **Goal:** Comprehensive testing and deploy to local network (LAN/WiFi).
> **Branch:** `phase-9/testing`

- [ ] 9.1 Integration tests: Full flow end-to-end
- [ ] 9.2 Permission matrix: Test all role/action combinations
- [ ] 9.3 Multi-tenant: Verify data isolation
- [ ] 9.4 Performance: API response time
- [ ] 9.5 UX review: Mobile responsiveness, touch targets
- [ ] 9.6 Real-time: WebSocket updates working
- [ ] 9.7 Local network: Configure server to listen on 0.0.0.0 (accessible from LAN)
- [ ] 9.8 Test from other devices on same WiFi (phone, tablet, other PC)
- [ ] 9.9 Create startup script (one-click start for backend + frontend + database)
- [ ] 9.10 Git commit: `feat: phase 9 complete — tested and running on local network`

---

## PHASE 10 — Production Use (1 Shop)
> **Goal:** Use the app daily in your real shop. Fix issues as they arise.

- [ ] 10.1 Onboard real data (customers, inventory, suppliers)
- [ ] 10.2 Train staff on the application
- [ ] 10.3 Daily use for 2-4 weeks
- [ ] 10.4 Collect feedback & fix bugs
- [ ] 10.5 Database backup strategy (daily pg_dump)

---

## PHASE 11 — VPS Deployment (Future)
> **Goal:** Deploy to VPS when ready to serve multiple clients.
> **Only start when Phase 10 is stable and you want to expand.**

- [ ] 11.1 Provision VPS (DigitalOcean/Hetzner/etc.)
- [ ] 11.2 Setup PostgreSQL on VPS (or managed DB)
- [ ] 11.3 Setup Nginx reverse proxy + HTTPS (Let's Encrypt)
- [ ] 11.4 CI/CD pipeline (GitHub Actions → auto deploy)
- [ ] 11.5 Domain setup (flowserv.yourdomain.com)
- [ ] 11.6 Backup strategy (automated daily)
- [ ] 11.7 Monitoring & alerting

---

## PHASE 12 — Phase 2 Features (Post-MVP)
> **Goal:** Implement 🟡 Phase 2 features based on real usage feedback.
> Only start after PHASE 10 is stable.

- [ ] 12.1 Multi-warehouse / multi-location stock
- [ ] 12.2 Stock Opname (scheduled audit)
- [ ] 12.3 WhatsApp Business API integration
- [ ] 12.4 Payment gateway (QRIS, cards)
- [ ] 12.5 SSO / enterprise login
- [ ] 12.6 Advanced finance (Balance Sheet, Cash Flow, Tax, Period Closing)
- [ ] 12.7 Supplier performance tracking
- [ ] 12.8 AI-assisted diagnosis suggestion
- [ ] 12.9 Advanced reporting & analytics
- [ ] 12.10 Webhook for external integrations
- [ ] 12.11 Platform Super Admin Dashboard (for managing multiple tenants)

---

## Folders to Ignore (DO NOT modify or delete)

These folders are reference/examples and should NOT be touched unless explicitly asked:
- `legacy/` — archived old code
- `my-saas-app/` — previous prototype
- `pos_sederhana-main/` — reference POS application

---

## Quick Reference

| Phase | Focus | Depends On |
|-------|-------|-----------|
| 0 | Documentation | — |
| 1 | Project Setup + DB + Cleanup + Git | Phase 0 |
| 2 | Auth + Flow Engine (BE+FE) | Phase 1 |
| 3 | Vertical Slice (BE+FE) | Phase 2 |
| 4 | RBAC + Audit (BE+FE) | Phase 3 |
| 5 | Core UI Polish | Phase 4 |
| 6 | Printer Agent | Phase 4 |
| 7 | Builder UIs | Phase 5+6 |
| 8 | Module Expansion | Phase 5 |
| 9 | Testing + Local Network | Phase 8 |
| 10 | Production Use (1 Shop) | Phase 9 |
| 11 | VPS Deployment | Phase 10 |
| 12 | Post-MVP Features | Phase 10 |
