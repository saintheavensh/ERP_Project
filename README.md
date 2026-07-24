# FlowServ — Universal Service ERP

## Overview

FlowServ is a **multi-tenant SaaS platform** that unifies Inventory Management,
Service/Ticket Management, POS & Finance — governed by granular RBAC — for service
centers of any kind (electronics, automotive, appliances, IT equipment, etc.).

What makes it different: **workflows are data/configuration, not hardcoded logic.**
Service and inventory flows are composed of modular blocks ("Flow Nodes") that can be
rearranged per tenant/branch/service type without deploying new code.

This repository is a monorepo containing both the full specification **and** the
living implementation:

```
flowserv-api/    → Backend (Hono + Drizzle + PostgreSQL)
flowserv-web/    → Frontend (SvelteKit + Tailwind + shadcn-svelte)
specification/   → Documentation (single source of truth for business rules,
                    architecture, API design, and coding standards)
```

> `docs/` and `books/` are **deprecated archives** from an earlier documentation
> pass. Use `specification/` — never those two folders — as the source of truth.

For current build status (what phase is in progress, what's actually done vs. just
planned), see [`PHASES.md`](./PHASES.md). For AI-agent working rules, see
[`CLAUDE.md`](./CLAUDE.md).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Hono (Node.js, TypeScript) |
| ORM | Drizzle ORM |
| Database | PostgreSQL |
| Validation | Zod + drizzle-zod |
| Frontend | SvelteKit |
| UI Components | Tailwind CSS + shadcn-svelte |
| Auth | JWT (tenant-scoped) |
| Testing | Vitest |

---

## Prerequisites

Install these before cloning:

- **Node.js** 20+ and npm (this repo uses npm workspaces)
- **PostgreSQL** running locally (or reachable via a connection string)
- **Git**

---

## Getting Started (Clone → Running)

### 1. Clone the repository

```bash
git clone https://github.com/saintheavensh/ERP_Project.git
cd ERP_Project
```

### 2. Install dependencies

This is an npm-workspaces monorepo — one install at the root covers both
`flowserv-api` and `flowserv-web`.

```bash
npm install
```

### 3. Create a PostgreSQL database

```bash
# using psql, or your preferred client
createdb flowserv
```

### 4. Configure environment variables

Copy the example env files and fill in your local values.

```bash
cp flowserv-api/.env.example flowserv-api/.env
cp flowserv-web/.env.example flowserv-web/.env
```

Edit `flowserv-api/.env`:

| Variable | Purpose |
|----------|---------|
| `PORT` | Port the API listens on (default `3001`) |
| `DATABASE_URL` | PostgreSQL connection string, e.g. `postgres://postgres:yourpassword@localhost:5432/flowserv` |
| `TZ` | Process timezone (default `Asia/Jakarta`) |
| `JWT_SECRET` | Secret used to sign JWTs — set a real random value outside solo local dev |
| `RBAC_MODE` | `report` (log-only, safe default while developing) or `enforce` |

`flowserv-web/.env` only needs `API_URL`/`PUBLIC_API_URL` pointed at the API
(defaults to `http://localhost:3001`, already correct for local development).

### 5. Set up the database schema and seed data

From `flowserv-api/`, push the Drizzle schema and load seed data:

```bash
cd flowserv-api
npx drizzle-kit push
npm run db:seed
```

> During development, prefer `npm run db:reset` instead — it drops and
> recreates the schema, pushes it, and re-seeds in one deterministic step. It
> refuses to run unless `DATABASE_URL` contains `localhost`, so it's safe to
> use freely against your local database.

### 6. Run the application

From the repository root, start both the API and the web app together:

```bash
npm run dev
```

Or run them individually:

```bash
npm run dev:api   # http://localhost:3001
npm run dev:web   # SvelteKit dev server, printed to the console
```

### 7. Verify it's working

- API health check: `GET http://localhost:3001/v1/health` should return
  `{ "data": { "status": "ok" }, ... }`.
- Open the frontend URL printed by `npm run dev:web` and log in with the
  seeded Super Admin account (see `flowserv-api/src/db/seed/` for seeded
  credentials).

### 8. Run tests (backend)

```bash
cd flowserv-api
npm test
```

### 9. Printer agent (optional — only needed to test printing)

A separate local Python service bridges the browser to a physical thermal
printer (`printer-agent/`, see [`specification/09-printer-integration.md`](./specification/09-printer-integration.md)).
It is **not** started by `npm run dev` — it's a different process, and most
day-to-day work on the API/web app doesn't need it running at all.

Requires Python 3.14. First-time setup on a machine (once only):

```bash
cd printer-agent
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m PyInstaller --onefile --name printer-agent --collect-data escpos printer_agent.py
```

This produces `printer-agent\dist\printer-agent.exe` — the packaged build
`start-agent.bat`/`stop-agent.bat` expect. `dist/` is git-ignored (build
output + per-machine printer config, not source), so this compile step must
be repeated once per machine, and again only if `printer-agent/*.py` itself
changes.

Day to day, once it's compiled:

```bash
printer-agent\start-agent.bat   # starts it (double-click also works)
printer-agent\stop-agent.bat    # stops it
```

Both are manual only — neither registers anything with Windows Startup or
Task Scheduler. Verify it's up: `curl http://127.0.0.1:9100/health` →
`{"status":"ok"}`. With no `config.json` present it defaults to a `dummy`
printer (every request "succeeds", nothing physically prints) — see
[`printer-agent/README.md`](./printer-agent/README.md) for configuring a
real printer, the scan-and-pick flow, and full architecture notes.

---

## Documentation Map

Start here, in order:

1. [`specification/00-README.md`](./specification/00-README.md) — document map and reading order
2. [`specification/features/00-feature-catalog.md`](./specification/features/00-feature-catalog.md) — full feature list with build status
3. [`specification/coding-guidelines.md`](./specification/coding-guidelines.md) — mandatory naming, architecture, and API conventions
4. [`PHASES.md`](./PHASES.md) — current phase, task-by-task progress, and what's verified vs. just written

---

## Contributing / Working Rules

- Work one phase at a time, per [`PHASES.md`](./PHASES.md) — never skip or combine phases.
- Read the relevant `specification/` document before writing code for any area.
- Every branch follows `phase-N/description`; never commit directly to `main`.
- See [`CLAUDE.md`](./CLAUDE.md) for the full set of working rules (this file
  doubles as the entry point for AI coding agents working in this repo).

---

## License

See [`LICENSE.md`](./LICENSE.md).
