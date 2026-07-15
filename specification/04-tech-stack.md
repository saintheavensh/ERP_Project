# Tech Stack & Infrastructure

> **Status: FINAL.** Do not change without explicit discussion. This has been through deliberation — considered locked.

## Final Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Backend** | **Hono** (TypeScript, on Node.js) | Lightweight, fast, no hidden abstractions — code is easy to trace |
| **ORM** | **Drizzle** | Schema is very close to raw SQL — helps understand real database queries. Schema in `db/schema.ts` |
| **Database** | PostgreSQL | JSONB (Flow Template config) + Row-Level Security (tenant isolation) |
| **Validation** | **Zod** + `drizzle-zod` | Standard Hono pairing; `drizzle-zod` auto-generates validation from Drizzle schema — single source of truth |
| **Frontend** | **SvelteKit** | Much lighter on laptop than Next.js (Vite, no virtual DOM) |
| **UI Components** | Tailwind + shadcn-svelte / Skeleton UI | Svelte equivalent of shadcn/ui in React ecosystem |
| **Drag & Drop** | `svelte-dnd-action` | For Ticket Kanban Board & Flow Template Builder |
| **Printer** | **Python** (Flask + `python-escpos`), local agent per cashier | Best ESC/POS library is in Python; browser cannot access USB printers directly. Details: [09-printer-integration.md](./09-printer-integration.md) |
| **Realtime** | WebSocket native (`hono/ws` or `ws`) | Manual setup — straightforward for our needs |
| **Auth (internal)** | JWT with `tenant_id` as claim (`hono/jwt`) | Aligned with [06-api-design.md](./06-api-design.md) |
| **Auth (customer portal)** | Magic link — one-time token, expires 7 days, sent via WA/SMS | No separate password system needed for customers |
| **Containerization** | Docker (production only) | Standard deployment |
| **Hosting (MVP)** | Railway or Render | Simpler than raw AWS/GCP |
| **Hosting (enterprise)** | AWS/GCP (migrate later) | When more infra control is needed |
| **CI/CD** | GitHub Actions | Integrated with repo |
| **Testing** | Vitest | Fast, native TypeScript support |

## Runtime: Node.js

Start with Node.js — widest library compatibility (BullMQ, etc.), lowest risk. Bun is a future upgrade option.

## Database Strategy (Development)

- **Local PostgreSQL** installed directly on your machine (no Docker required during development)
- Use **`npx drizzle-kit push`** to push schema changes instantly (no migration files needed)
- To reset: `DROP DATABASE flowserv; CREATE DATABASE flowserv;` then `npx drizzle-kit push`
- Production: use proper Drizzle migrations

## Backend Folder Structure

```text
flowserv-api/
├─ src/
│  ├─ db/
│  │  ├─ schema.ts          # Drizzle schema (single source of truth for DB)
│  │  ├─ connection.ts      # Database connection setup
│  │  └─ seed.ts            # Seed data for development
│  ├─ middleware/
│  │  ├─ auth.ts            # JWT verification, extract tenant_id
│  │  ├─ rbac.ts            # requirePermission('ticket.approve_quote')
│  │  ├─ tenant-scope.ts    # Auto-filter queries by tenant_id
│  │  ├─ audit.ts           # Record all mutations to audit_logs
│  │  └─ error-handler.ts   # Global error handler
│  ├─ modules/              # Business Modules (each: routes.ts, service.ts, types.ts)
│  │  ├─ tickets/
│  │  ├─ inventory/
│  │  ├─ pos/
│  │  ├─ finance/
│  │  └─ rbac/
│  ├─ flow-engine/          # Core: Flow Template/Node/Transition logic
│  ├─ lib/                  # Shared utilities (response, pagination, idempotency)
│  └─ index.ts              # Entry point, mount all module routers
├─ drizzle.config.ts
└─ package.json
```

## Frontend Folder Structure

```text
flowserv-web/
├─ src/
│  ├─ lib/
│  │  ├─ components/        # Reusable UI components
│  │  │  ├─ ui/             # Base primitives (button, input, dialog)
│  │  │  └─ domain/         # Domain-specific (ticket-card, stock-badge)
│  │  ├─ stores/            # Svelte stores (state management)
│  │  └─ api/               # Typed fetch clients per module
│  └─ routes/
│     ├─ (auth)/            # Login, register (no sidebar)
│     ├─ (app)/             # Authenticated pages (with sidebar)
│     │  ├─ dashboard/
│     │  ├─ tickets/
│     │  ├─ inventory/
│     │  ├─ pos/
│     │  └─ admin/
│     └─ portal/            # Customer portal (magic link)
```

## Global Search Implementation

Start simple — no overengineering:
- Use PostgreSQL `ILIKE` or `pg_trgm` extension (trigram similarity) for typo-tolerant search
- Index: `gin_trgm_ops` on frequently searched columns
- Elasticsearch only considered if Postgres search becomes slow at high volume

## Decisions Still Pending (Business/Vendor, Not Technical Blockers)

- WhatsApp Business API provider
- Payment gateway (QRIS, cards)
- Specific thermal printer brand/model to support

## Rules for AI Agents

Use the table above as the default stack for all generated code. Do not mix other frameworks (e.g., don't suddenly use Express or Prisma) unless explicitly asked.
