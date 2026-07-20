# H16 — Module Migration: Standing Rules

> Not a task with an end. A constraint that governs every other task.
> Risk: 🟠 R5 — the failure mode is a refactor that breaks a working app

## The rule

**Migrate one module per PR, with tests, only when you are already touching that module
for a fix or a feature. Never a dedicated "refactor everything" branch.**

This restates the decision already recorded in the Architecture Debt section of
`PHASES.md`. It is correct and this track does not change it.

## Why the structure needs fixing at all

Three patterns coexist today:

```
src/
├─ routes/     ← 19 files, business logic inline in HTTP handlers
├─ services/   ← flow-engine.ts, event-bus.ts
├─ modules/    ← finance/ only — the one module in the shape §2 specifies
└─ lib/        ← fifo.ts, wac.ts — pure logic extracted under duress
```

A new developer cannot answer "where does purchasing logic live?" without grepping. It is
in `routes/purchasing/*.ts` mixed with HTTP concerns, except the parts in `lib/wac.ts` and
`routes/purchasing/order-status.ts`.

Here is the part that matters most:

> **`modules/` and `lib/` hold nearly all 37 tests. `routes/` holds almost none.**

That is not coincidence. Logic welded to a Hono handler cannot be unit-tested without
spinning up HTTP. **The structure is what is capping test coverage** — which is why this is
worth doing at all, and why it is not cosmetic.

## Target

Exactly what `coding-guidelines.md` §2 already specifies. Do not invent a new layout;
`modules/finance/` already proves it works in this codebase.

```
src/
├─ modules/<domain>/{routes,service,types}.ts + __tests__/
├─ flow-engine/{engine,types,events}.ts
├─ middleware/
├─ lib/
└─ db/
```

- `routes.ts` — thin: parse, delegate, respond. No business logic.
- `service.ts` — no HTTP imports, plain typed arguments, testable.
- `types.ts` — Zod + TS types, derived from the Drizzle schema where possible.

## Which task carries which migration

Migration is a **side effect** of work you were already doing:

| Module | Migrate during | Notes |
|---|---|---|
| `flow-engine/` | any time — do it first | 2 files, pure move, zero behaviour change |
| `modules/tickets/` | [H7](./H7-ticket-charges.md) | already planned into that task |
| `modules/inventory/` | [H9](./H9-ticket-parts-consumption.md) | `consumeStock` extraction is the seed |
| `modules/pos/` | [H6](./H6-labor-billing.md) | highest complexity, biggest test payoff |
| `modules/purchasing/` | when next touched | partly extracted (`order-status.ts`) |
| `modules/finance/` | done | the reference implementation |
| customers, suppliers, brands, categories | last, low value | thin CRUD, little logic to extract |

Start with `services/` → `flow-engine/` as a warm-up: it is a pure move with tests already
covering it, so a mistake is immediately visible.

## Also fix while passing through

- Rename `payment_methods__settings_.ts` → `payment-methods.ts`
- Rename `relations__untuk_relational_query_api_drizzle.ts` → `relations.ts`
- Replace hand-written Zod with `drizzle-zod` (installed, **0 imports**, mandated by §4)
- Replace `catch (err: any)` (≈30 occurrences) with `catch (err: unknown)` plus a shared
  `toBusinessError()` helper. Note [`tickets.ts:183`](../flowserv-api/src/routes/tickets.ts#L183)
  returns `err.message` straight to the client, leaking Postgres table and column names.
- Pick one language for user-facing error strings. Comments and messages currently mix
  Indonesian and English. **Recommendation:** Indonesian for user-facing messages (the
  users are Indonesian), English for code comments and error *codes*.

## The shared types package

The frontend has **153 `any`**, almost all API response shapes, because it cannot see
backend types.

Add `packages/shared/` exporting Drizzle-inferred types and Zod schemas, consumed by both
apps. An API change then becomes a **compile error in the frontend** instead of a runtime
`undefined` discovered by a user.

This is the highest-leverage single change for a codebase you expect to grow. Do it once
two or three modules have migrated and the type shapes have settled — doing it first means
building the package against types that are about to move.

## Per-module README

Add a 10-line `README.md` to each migrated module: what it owns, what events it emits, what
it listens for.

The deeper learnability problem is not folder layout — it is that **business flow lives only
in `specification/` and the code does not mirror it.** Naming modules after domains and
putting a short description where the developer is already looking closes most of that gap
for very little effort.

## Verification (per migration, every time)

- [ ] `npm test` passes **unchanged** before and after — a pure move must not alter behaviour
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] New `service.ts` has **no** HTTP imports (grep for `hono`)
- [ ] At least one new unit test exists that was impossible before the extraction
- [ ] The relevant UI page still loads (relations and route mounting are runtime failures)

## Watch out

- **Never migrate a module you are not otherwise changing.** A whole-codebase restructure
  with thin test coverage is the fastest way to break a working application — which is
  precisely what `PHASES.md` warns about.
- Move behaviour and change behaviour in **separate commits**. When something breaks you
  need to know which one did it.
- Do not migrate `routes/auth.ts` casually. It contains the legacy SHA-256 password path
  that `PHASES.md` schedules for removal in Phase 11; leave it until then.
