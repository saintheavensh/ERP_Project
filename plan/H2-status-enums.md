# H2 — Status Enums and the Void Split

> Size: S · Risk: low
>
> **Revisi 2026-07-21 — task ini jadi jauh lebih ringan.** Sebelumnya ini task paling
> berbahaya di seluruh track, karena nilai yang sudah melenceng (`'pending'`, `'voided'`)
> harus di-backfill lebih dulu sebelum kolomnya dikunci — salah urutan berarti migrasi
> gagal atau baris hilang.
>
> Karena data sekarang boleh dibuang, **backfill tidak diperlukan sama sekali.** Ubah
> skema, lalu `npm run db:reset`. Bagian "Steps" di bawah tetap mempertahankan langkah
> SQL backfill hanya sebagai catatan untuk Phase 10 ke atas, saat data sudah tidak boleh
> hilang lagi — **lewati untuk sekarang.**
>
> Yang **tetap wajib** dikerjakan: perbaiki *penulis* nilai yang salah
> ([langkah 4](#4-fix-the-write-sites-and-remove-the-lying-casts)). Kalau tidak,
> `'pending'` akan muncul lagi setelah seed berikutnya.

## Goal

Every status column becomes a `pgEnum` with a matching TypeScript union, so illegal values
are impossible in the database *and* `switch` statements are exhaustively checked.

## Why

There are **zero** `pgEnum` in the schema. Around 30 state columns are bare `varchar` with
the legal values written in a comment the database cannot enforce. This is not theoretical —
the data has already drifted:

| Column | Schema says | Database contains |
|---|---|---|
| `supplier_invoices.status` | default `'unpaid'`, comment `unpaid\|partial\|paid` | **`'pending'` × 5**, `'paid'` × 1 |
| `pos_invoices.payment_status` | comment `unpaid\|partial\|paid` | **`'voided'` × 3**, `'paid'` × 2 |

`'pending'` is written by [`purchasing/invoices.ts:129`](../flowserv-api/src/routes/purchasing/invoices.ts#L129).
Meanwhile [`modules/finance/service.ts:73`](../flowserv-api/src/modules/finance/service.ts#L73)
casts the column `as PayableInvoiceStatus` — a type that does not contain `'pending'`. The
cast is lying about 5 of 6 rows and TypeScript cannot know.

## The void problem

`pos_invoices.payment_status` currently holds `'voided'`, with the code admitting it:

```ts
.set({ paymentStatus: 'voided' }) // reusing paymentStatus for voided state
```

Void is a **document lifecycle** state; unpaid/partial/paid is a **payment** state. A voided
invoice still had a payment status before it was voided, and conflating them means you can
never answer "was this voided invoice paid at the time?" — which matters for refunds.

Split them into two columns:

```ts
status:        invoiceStatusEnum('status')          // 'active' | 'voided'
paymentStatus: paymentStatusEnum('payment_status')  // 'unpaid' | 'partial' | 'paid'
```

## Steps

**Sekarang (data disposable):** langkah 1 → 4 → 5, lalu `npm run db:reset`.
**Langkah 2 dan 3 dilewati** — itu untuk Phase 10 ke atas, disimpan sebagai referensi.

### 1. Define the enums

New file `src/db/schema/enums.ts`, so every domain file imports from one place:

```ts
import { pgEnum } from 'drizzle-orm/pg-core';

export const paymentStatusEnum   = pgEnum('payment_status',   ['unpaid', 'partial', 'paid']);
export const invoiceStatusEnum   = pgEnum('invoice_status',   ['active', 'voided']);
export const poStatusEnum        = pgEnum('po_status',        ['draft','ordered','partial','received','completed']);
export const movementTypeEnum    = pgEnum('movement_type',    ['in','out','reserve','release','adjust','write_off']);
export const ticketStatusEnum    = pgEnum('ticket_status',    ['open','closed','cancelled']);
export const paymentMethodEnum   = pgEnum('payment_method',   ['cash','transfer','qris','split','tempo']);
export const supplierPayMethodEnum = pgEnum('supplier_payment_method', ['tunai','transfer','tempo']);

// Derive the TS unions from the same declaration — never hand-write them twice.
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];
export type InvoiceStatus = (typeof invoiceStatusEnum.enumValues)[number];
// ...etc
```

> Note the two payment-method vocabularies: POS uses English (`cash`/`transfer`), supplier
> invoices use Indonesian (`tunai`/`transfer`/`tempo`). That inconsistency is real and is
> listed in Architecture Debt. **Do not unify it in this task** — it changes behaviour and
> deserves its own decision. Encode both as they are, and note it.

### 2. Backfill the drifted values — ⏭️ LEWATI SEKARANG (referensi Phase 10+)

> Tidak perlu dijalankan selama data masih disposable. `db:reset` menghapus semua nilai
> yang melenceng. Disimpan karena setelah Phase 10 data produksi tidak bisa di-reset, dan
> urutan backfill-dulu-baru-kunci akan jadi wajib lagi.

```sql
-- 'pending' was never a legal value; it means unpaid
UPDATE supplier_invoices SET status = 'unpaid' WHERE status = 'pending';

-- add the new lifecycle column, default everything to active
ALTER TABLE pos_invoices ADD COLUMN status varchar(20) NOT NULL DEFAULT 'active';

-- move void out of payment_status into the new column.
-- 'paid' is the correct payment state for these rows: all 3 voided invoices were
-- cash sales that completed before being voided. Verify this before running.
UPDATE pos_invoices SET status = 'voided', payment_status = 'paid' WHERE payment_status = 'voided';
```

**Verify no illegal values remain before continuing:**

```sql
SELECT DISTINCT status FROM supplier_invoices;      -- expect: unpaid, paid
SELECT DISTINCT payment_status FROM pos_invoices;   -- expect: paid  (no 'voided')
SELECT DISTINCT status FROM pos_invoices;           -- expect: active, voided
SELECT DISTINCT status FROM purchase_orders;        -- expect: ordered, received, completed
SELECT DISTINCT movement_type FROM stock_movements; -- expect: in, out
SELECT DISTINCT status FROM service_tickets;        -- expect: open, closed
```

If any query returns something outside the enum, fix it now. Do not proceed.

### 3. Convert the columns

```bash
npx drizzle-kit generate
```

Inspect the SQL. Postgres needs an explicit cast for varchar→enum; if the generated file
does a drop-and-recreate, hand-write it instead:

```sql
ALTER TABLE supplier_invoices
  ALTER COLUMN status TYPE payment_status USING status::payment_status;
```

Then `npx drizzle-kit migrate`.

### 4. Fix the write sites and remove the lying casts

- `purchasing/invoices.ts:129` — `'pending'` → `'unpaid'`
- `pos/invoices.ts:339` — set `status: 'voided'`, stop touching `paymentStatus`
- `pos/invoices.ts:247` — the already-voided guard now reads `invoice.status === 'voided'`
- `modules/finance/service.ts:7` — delete the local `PayableInvoiceStatus`, import
  `PaymentStatus` from `enums.ts`
- `modules/finance/service.ts:73` — delete the `as PayableInvoiceStatus` cast; it should
  now type-check without one. **If it still needs a cast, something is wrong — stop and
  find out what.**

### 5. Frontend

Grep `flowserv-web` for `'voided'`, `'pending'`, `paymentStatus` and update any place that
renders a badge or filters a list. The POS history table and the payables table both
display status.

## Verification

- [ ] Every `SELECT DISTINCT` above returns only enum members
- [ ] Inserting an illegal value is rejected **by the database**:
      `INSERT INTO supplier_invoices (..., status) VALUES (..., 'banana');` → error
- [ ] `npx tsc --noEmit` → 0 errors, **with no new `as` casts**
- [ ] `npm test` → all passing
- [ ] Click-path: POS history page shows the 3 voided invoices as voided, and the payables
      page still lists the 5 outstanding supplier invoices
- [ ] Void an invoice end-to-end; confirm `status='voided'` and `payment_status` unchanged

## Watch out

- **The `'paid'` assumption for voided rows.** Step 2 sets voided invoices to
  `payment_status='paid'`. Confirm that is true of your 3 rows before running — if any was
  a `tempo` sale it should be `'unpaid'`. Check first; this is unrecoverable after the fact.
- Renaming an enum value later requires `ALTER TYPE`, which is awkward. Spend a minute
  getting the value names right now.
- `pgEnum` values are ordered. Adding a value later appends it; if you ever `ORDER BY` an
  enum column, the sort follows declaration order, not alphabetical.
