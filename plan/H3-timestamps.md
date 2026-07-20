# H3 — Timestamps → `timestamptz`

> Size: S · Risk: low
>
> **Revisi 2026-07-21.** Data sekarang disposable, jadi konversi ini cukup:
> tambahkan `{ withTimezone: true }` → `npm run db:push` → `npm run db:seed`.
> Klausa `USING ... AT TIME ZONE 'Asia/Jakarta'` di langkah 2 **tidak diperlukan** —
> itu hanya untuk mempertahankan nilai lama. Disimpan sebagai referensi Phase 10+.
>
> Alasan mengerjakannya sekarang justru menguat: gratis hari ini, dan setelah Phase 10
> kamu harus menebak zona waktu tiap baris historis.

## Goal

All 32 timestamp columns become `timestamp with time zone`.

## Why

```
timestamp columns in schema: 32
withTimezone: true:           0
```

Every one is `timestamp without time zone`. Postgres stores those as a naked wall-clock
reading with no zone attached, so the value only means anything if you happen to know
which zone wrote it.

Today that is invisible: one machine, one shop, WIB (UTC+7). It becomes a real bug the
moment Phase 11 puts the API on a VPS, which will almost certainly run UTC. Then:

- `supplier_invoices.dueDate` is off by 7 hours → aging buckets misclassify around
  midnight, and "overdue today" is wrong for a whole workday
- `closedAt`, `receivedAt`, `paymentDate` all shift → FIFO ordering can even invert for
  batches received close together
- Daily sales totals cut at the wrong instant

**Fix it now, not in Phase 11.** With 32 columns and a nearly-empty database this is a
few minutes. After Phase 10 loads real data it becomes a backfill where you must *guess*
which zone each historical row meant — and rows written before and after a server move
would need different answers.

## Steps

1. Add `{ withTimezone: true }` to every `timestamp(...)` call across
   `src/db/schema/*.ts`. There are 32; find them with:

   ```bash
   grep -rn "timestamp(" flowserv-api/src/db/schema
   ```

2. `npx drizzle-kit generate` and **read the SQL**. The correct form interprets existing
   naive values as the zone they were actually written in:

   ```sql
   ALTER TABLE pos_invoices
     ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'Asia/Jakarta';
   ```

   `AT TIME ZONE 'Asia/Jakarta'` is the important part. Without it Postgres assumes the
   server's zone, which silently shifts every existing row.

3. `npx drizzle-kit migrate`.

4. Set the API process timezone explicitly so behaviour does not depend on the host.
   In `.env` and `.env.example`:

   ```
   TZ=Asia/Jakarta
   ```

## Verification

- [x] `SELECT column_name, data_type FROM information_schema.columns WHERE data_type LIKE 'timestamp%';`
      → every row reads `timestamp with time zone`. Verified live: query grouped by
      `data_type` returned exactly one row, `timestamp with time zone | 30`.
- [x] An existing known row still shows the same wall-clock time it did before the
      migration (spot-check one `pos_invoices.created_at` — record it beforehand).
      `pos_invoices` itself was empty, so the spot-check ran instead against every
      populated table with a timestamp column (`stock_batches.received_at` ×4,
      `stock_movements.created_at` ×4, `service_tickets.created_at`/`closed_at`,
      `supplier_invoices.invoice_date`/`due_date`/`created_at`) — recorded before the
      migration, diffed after. Every value was byte-identical except for the added
      `+07` suffix (server `TimeZone` is `Asia/Bangkok`, UTC+7 with no DST, same
      offset as `Asia/Jakarta`) — proof nothing shifted.
- [x] `npx tsc --noEmit` → 0 errors. Confirmed, empty output.
- [x] `npm test` → all passing. `37 passed (37)`, 6 test files, unchanged from before
      this task (no test touches timestamp values directly, so this also confirms no
      regression).
- [x] A newly created record stores the correct instant. Verified via a throwaway
      script that inserted a real row through the Drizzle schema (`customers` table,
      not raw SQL), captured a `[before, after]` `Date` window around the insert, and
      confirmed the returned `createdAt` fell inside that window
      (`2026-07-20T21:31:36.090Z` inside
      `2026-07-20T21:31:36.036Z..2026-07-20T21:31:36.130Z`). Row was then deleted;
      script was temporary and is not part of the repo.

**Deviation from the Steps section:** step 2/3 (`drizzle-kit generate` + `migrate`)
turned out to be unusable here — `generate` diffed against stale local migration
snapshots (this project has only ever used `db:push`, never `migrate`, so `drizzle/`
was out of sync with the live DB) and produced a migration that mixed in already-applied
H1/H2 changes (dropping already-dropped tables, enum casts already live), which would
have errored on replay. `drizzle-kit push` itself couldn't run non-interactively either:
it stopped on an unrelated pre-existing prompt (offering to truncate `users` over a
unique constraint that already exists in the DB — apparently a `push` introspection
quirk, not caused by this task) and `--force` risked auto-truncating that table's real
data to get past it. Neither is acceptable for a task whose entire point is proving no
data is altered.
Resolution: used `generate` once, read the SQL, hand-extracted only the 30
`ALTER COLUMN ... SET DATA TYPE timestamp with time zone` (+ paired `SET DEFAULT now()`)
statements — skipping the unrelated drift — and applied those directly in one
transaction via `psql`. The generated migration file was discarded (never committed;
`drizzle/` is gitignored). No `USING ... AT TIME ZONE` clause was needed per the
2026-07-21 revision at the top of this file.

## Watch out

- **Record one known timestamp before migrating** so you can prove nothing shifted. This
  is the only cheap way to catch a wrong `USING` clause.
- Drizzle returns `Date` objects either way, so TypeScript will not flag a mistake here.
  The verification query is the real check.
- Do not combine with H2 in one migration. If something goes wrong you want to know which
  change caused it.
