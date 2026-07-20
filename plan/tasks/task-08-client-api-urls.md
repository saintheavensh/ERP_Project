# Task 08 — Replace Hardcoded API URLs in Client-Side Code

**Depends on:** nothing (independent — can run any time)
**Risk:** Low — mechanical, but touches 20 files
**PHASES.md tasks:** 3.5E.1 (supports 9.7 / 9.8)
**Branch:** `phase-3.5/stabilization`

---

## Background

`CLAUDE.md` states: *"Use environment variables (`.env`) for ALL configuration
(DATABASE_URL, API_URL, etc.)"*, and the current deployment plan is
**local-first, accessed over LAN/WiFi (192.168.x.x)**.

The frontend currently hardcodes `http://localhost:3001` in **78 places**. They are
not all equally broken:

| Where | Count | Runs on | LAN impact |
|---|---|---|---|
| `routes/**/+page.server.ts` | 44 | The **server** | **Fine** — the API is on the same machine |
| `lib/states/**`, `routes/**/*.svelte` | 35 (20 files) | The **browser** | **Broken** — `localhost` means the phone itself |

**This task fixes the 35 client-side ones only.** The server-side ones are
functionally correct today and belong to Phase 11 (VPS), where the API may live on a
different host.

### Why now, when LAN testing is Phase 9

Because the wrong pattern is currently the **convention**: 35 hardcoded examples
versus 1 correct one. Phase 5 adds roughly ten more UI screens, and
`CLAUDE.md` instructs agents to *"write code that reads like the surrounding code."*
Every new screen will copy the hardcoded pattern because it overwhelmingly dominates.

Fix it now and you fix 35. Fix it after Phase 5 and you fix 120.

---

## Goal

Every browser-side `fetch` reads its base URL from one place, which reads from an
environment variable.

---

## The 20 files

```
lib/states/customers/customer.detail.svelte.ts      (1)
lib/states/customers/customer.list.svelte.ts        (1)
lib/states/inventory/brand.pricing.svelte.ts        (1)
lib/states/inventory/compatibility.svelte.ts        (1)
lib/states/inventory/inventory.svelte.ts            (2)
lib/states/inventory/opname.svelte.ts               (1)
lib/states/inventory/supplier.detail.svelte.ts      (5)
lib/states/inventory/suppliers.svelte.ts            (2)
lib/states/pos/history.svelte.ts                    (3)
lib/states/pos/pos.checkout.svelte.ts               (1)
lib/states/pos/pos.drafts.svelte.ts                 (4)
lib/states/purchasing/invoice.svelte.ts             (1)
lib/states/purchasing/new.purchase.svelte.ts        (2)
lib/states/purchasing/receive.svelte.ts             (1)
lib/states/tickets/ticket.detail.svelte.ts          (2)
lib/states/tickets/ticket.intake.svelte.ts          (1)
routes/(app)/inventory/brands/+page.svelte          (2)
routes/(app)/inventory/categories/+page.svelte      (1)
routes/(app)/inventory/purchasing/[id]/+page.svelte (2)
routes/(app)/inventory/[id]/+page.svelte            (1)
```

---

## Step 1 — One shared config module

Create `flowserv-web/src/lib/api/config.ts`:

```ts
import { env } from '$env/dynamic/public';

/**
 * Base URL of the FlowServ API, for BROWSER-side calls.
 *
 * Must be PUBLIC_ prefixed — SvelteKit only exposes PUBLIC_* vars to the client.
 * When accessing the app from another device on the LAN, set this to the host
 * machine's IP (e.g. http://192.168.1.10:3001), NOT localhost — on a phone,
 * localhost means the phone.
 */
export const API_URL = env.PUBLIC_API_URL ?? 'http://localhost:3001';

/** Convenience: most calls want the /v1 prefix. */
export const API_BASE = `${API_URL}/v1`;
```

Update `flowserv-web/src/lib/api/client.ts` to import from here rather than
recomputing it, so there is exactly one definition:

```ts
import { API_BASE } from './config';
```

---

## Step 2 — Replace the 35 call sites

In each of the 20 files, import the constant and use a template string:

```ts
// before
const res = await fetch('http://localhost:3001/v1/customers', { ... });

// after
import { API_BASE } from '$lib/api/config';
...
const res = await fetch(`${API_BASE}/customers`, { ... });
```

Note the single-quote → backtick change where the URL was a plain string.

**Do not** attempt a blind find-and-replace across the whole `src/` tree — it would
also rewrite the 44 server-side occurrences, which must keep using localhost. Work
through the 20 files listed above only.

---

## Step 3 — Commit an `.env.example`

`flowserv-web/.env` is **gitignored** (`flowserv-web/.gitignore` lines 16–19), so the
`PUBLIC_API_URL` added in task 02 exists only on the original developer's machine. A
fresh clone has no `.env` at all — the code silently falls back to localhost and
nobody knows the variable exists.

Create `flowserv-web/.env.example` (the gitignore has `!.env.example`, so it *will*
be committed):

```
# Base URL of the flowserv-api server.
# Local development:
API_URL=http://localhost:3001
PUBLIC_API_URL=http://localhost:3001

# Accessing from another device on the LAN — use the host machine's IP:
# PUBLIC_API_URL=http://192.168.1.10:3001
```

Do the same for `flowserv-api/.env.example` (`PORT`, `DATABASE_URL`, `JWT_SECRET`)
— it has the same problem. Use placeholder values, never real credentials.

---

## How to verify (evidence required)

**1. No client-side hardcoded URLs remain.** From `flowserv-web/src`:

```bash
grep -rn "localhost:3001" --include="*.svelte.ts" --include="*.svelte" .
```

Expect **zero results**. (`grep` over `*.server.ts` will still show 44 — that is
correct and intended.)

**2. The app still works locally.** Start both servers, then exercise at least one
page from each area that was touched: a customer page, an inventory page, POS, and a
ticket. Confirm data loads and one write action succeeds.

**3. `npm run check` passes** in `flowserv-web/` with 0 errors.

**Evidence:** the empty grep result, the passing `check` output, and a note of which
pages you exercised.

> **Optional but valuable:** set `PUBLIC_API_URL` to your machine's LAN IP, start the
> API bound to `0.0.0.0`, and load the app from your phone. That proves the real goal.
> If you do this, it also completes part of PHASES.md 9.8 — note it there.

---

## Do NOT do

- **Do not** touch the 44 `+page.server.ts` occurrences. `localhost` is correct for
  server-side calls today; changing them is Phase 11 (VPS) work.
- **Do not** consolidate these call sites into `lib/api/client.ts`. That is the right
  eventual design, but `client.ts` has a `// TODO: Add Authorization header` — it
  cannot do auth yet, which is exactly why every state file bypassed it. Making it
  auth-aware *and* rewriting 20 call sites in one pass is a behavioural refactor with
  no test coverage. Separate job.
- **Do not** commit a real `.env` file — only `.env.example`.
- **Do not** refactor the state classes while you are in them.

---

## When done

Mark in `PHASES.md`: `3.5E.1` as `[x]`.

Commit: `fix(web): read API base URL from env in client-side code`
