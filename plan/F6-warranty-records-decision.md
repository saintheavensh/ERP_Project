# F6 — Decide the orphaned `warranty_records` table

> **Size:** S · **Layer:** BE (schema/docs) · **Priority:** now
> **Goal:** Resolve dead schema: either adopt `warranty_records` as the WAR-001 foundation, or
> delete it — do not leave it as a false "warranty is partly built" signal.

## Problem
`db/schema/tickets.ts` defines a `warranty_records` table that **no route, service, or seed ever
reads or writes**. It's the same smell H1 cleaned up for `pos_transactions`/`invoice_lines`. An
orphaned table misleads the next builder into thinking warranty exists.

## Decision to make
Two honest options — pick one and record it in `PHASES.md` → Architecture Debt:

- **Option A — Delete now.** Warranty (WAR-001..006) is a Phase 8 module and entirely unbuilt.
  Delete the table via `db/schema` + `npm run db:reset` (data is disposable). When Phase 8 builds
  warranty, design the table then, with the feature. **Recommended** — matches the H1 precedent
  and the "don't keep speculative schema" rule.
- **Option B — Keep + document.** Only if you want to lock the warranty data shape now. Then you
  must add a short note in the spec/PHASES that it's an intentional forward-declaration, and ideally
  a stub `GET` so it isn't invisible.

## Steps (Option A)
1. Remove `warranty_records` from `db/schema/tickets.ts` (and any re-export in `db/schema/index.ts`).
2. `npm run db:reset`; confirm the table is gone (`information_schema.tables`).
3. Update `specification/features/11-warranty.md` header to note "no schema exists yet — build with
   the feature in Phase 8" (removes the misleading orphaned-table mention).

## Verification (Definition of Done)
- `npm run db:reset` succeeds; `warranty_records` absent from the DB; `npm test` unchanged.
- The decision is written down in PHASES.md so it isn't re-litigated.

## Watch out
- Grep the whole repo for `warranty_records` / `warrantyRecords` before deleting to be 100% sure
  nothing imports it (the audit says nothing does — verify).
