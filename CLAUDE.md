# FlowServ — Project Memory

## ⚠️ MANDATORY FIRST STEP — Read Before ANY Work
**Before writing any code or making any changes, read this file AND `PHASES.md` to know:**
1. What phase we are currently on
2. What tasks are completed, in progress, or remaining
3. What git branch to work on
4. What documents to read for context

@PHASES.md

## Documentation (Source of Truth)
Before writing code for any area, read the relevant document in `specification/` first — never guess business context.

@specification/00-README.md
@specification/features/00-feature-catalog.md
@specification/coding-guidelines.md

> **Note:** `docs/` and `books/` are **DEPRECATED archives**. Use `specification/` as the single source of truth.

## Project Structure (Monorepo)
```
flowserv-api/    → Backend (Hono + Drizzle + PostgreSQL)
flowserv-web/    → Frontend (SvelteKit + Tailwind + shadcn-svelte)
specification/   → Documentation (source of truth)
```

## Tech Stack (Final — do not change without explicit discussion with me)
- Backend: Hono (Node.js, TypeScript)
- ORM: Drizzle — schema in `flowserv-api/src/db/schema.ts`
- Database: PostgreSQL (local install, use `npx drizzle-kit push` for schema changes)
  - **Standard schema-change workflow during develop (added 2026-07-21, H0):** run
    `npm run db:reset` (in `flowserv-api/`) after changing `db/schema/*.ts`. It drops
    and recreates the `public` schema, runs `db:push`, then runs `db:seed` — a
    complete, deterministic dataset in seconds, no manual backfill. It refuses to run
    unless `DATABASE_URL` contains `localhost`. This replaces "be careful with
    migrations" as long as local data is disposable (confirmed true through Phase 10);
    re-read `plan/H0-seed-and-reset.md` before Phase 11, where that stops being true.
- Validation: Zod + drizzle-zod
- Frontend: SvelteKit
- UI Components: Tailwind + shadcn-svelte
- Drag & Drop: svelte-dnd-action
- Realtime: WebSocket (hono/ws)
- Auth: JWT with tenant_id claim
- Testing: Vitest
- Printer: Python (Flask + python-escpos), separate local service — see specification/09-printer-integration.md

## Deployment Strategy
- **Current:** Local-first. Server runs on developer's PC, accessed via LAN/WiFi (192.168.x.x)
- **Future:** VPS deployment (Phase 11 in PHASES.md)
- **Rule:** Use environment variables (`.env`) for ALL configuration (DATABASE_URL, API_URL, etc.)

## Git Workflow (MANDATORY)
- **Branch per phase:** `phase-N/description` (e.g., `phase-2/auth-flow-engine`)
- **Commit per task:** Use conventional commits: `feat:`, `fix:`, `docs:`, `chore:`
- **Before starting:** Run `git branch` to check current branch
- **After completing a task:** Commit with descriptive message + update PHASES.md
- **After completing a phase:** Merge phase branch → `main`
- **Never commit directly to `main`**

## RBAC Break-Glass (added H12)
If a bad permission grant locks you (or a real user) out of the app: set `RBAC_MODE=report`
in `flowserv-api/.env` and restart the API server. This restores non-enforcing behavior
(every request is allowed through, with `[RBAC] would deny` warnings logged to the
console) with **no code change**. Fix the catalog/grant in `db/seed/01-core.ts`,
re-seed, then flip back to `RBAC_MODE=enforce`. See `plan/H12-rbac.md`.

## Work Rules
- Work on **1 phase at a time** in order from `PHASES.md` — never skip or combine phases.
- Build **BE + FE together** per feature — every API endpoint should have a visible UI immediately.
- **VERIFY CODE:** Always verify logic after writing code. Check for errors, ensure typescript compilation, and validate that edge cases are handled before considering a task done.
- Always include **unit tests** for new logic, especially anything related to `flow-engine`.
- I (developer) am still at a basic coding level — explain important changes in simple language when I ask.
- Do not change decisions documented as final in `specification/` (multi-tenancy, costing method, RBAC, tech stack) without my explicit request.
- If my instructions conflict with `specification/`, ask first before proceeding — never assume.
- Update `PHASES.md` checklist after completing each task (mark `[x]`).

## Deprecated Documentation (do NOT read or use as reference)
- `docs/` and `books/` — superseded archives. `specification/` is the single source of truth.

> **Removed 2026-07-20:** `legacy/`, `my-saas-app/`, and `pos_sederhana-main/` were
> example applications unrelated to FlowServ. They have been deleted from the repo —
> do not look for them or expect them to exist.
