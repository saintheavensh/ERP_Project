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

- [ ] `SELECT column_name, data_type FROM information_schema.columns WHERE data_type LIKE 'timestamp%';`
      → every row reads `timestamp with time zone`
- [ ] An existing known row still shows the same wall-clock time it did before the
      migration (spot-check one `pos_invoices.created_at` — record it beforehand)
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm test` → all passing
- [ ] A newly created record stores the correct instant

## Watch out

- **Record one known timestamp before migrating** so you can prove nothing shifted. This
  is the only cheap way to catch a wrong `USING` clause.
- Drizzle returns `Date` objects either way, so TypeScript will not flag a mistake here.
  The verification query is the real check.
- Do not combine with H2 in one migration. If something goes wrong you want to know which
  change caused it.
