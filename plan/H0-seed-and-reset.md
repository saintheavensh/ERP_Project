# H0 — Seed Lengkap & Workflow Reset

> **Kerjakan paling awal.** Semua task lain bergantung pada ini.
> Ukuran: M · Risiko: rendah
>
> **Revisi 2026-07-21.** Task ini sebelumnya bernama "Safety Net" dan isinya backup +
> restore drill + migrasi hati-hati. Developer mengonfirmasi **data saat ini boleh
> hilang** — masih tahap develop, skema belum final. Jadi pendekatannya dibalik:
> bukan melindungi data lama, tapi membuat data baru jadi murah dibuat ulang.

## Tujuan

`npm run db:reset` menghapus database, push skema terbaru, lalu mengisi data lengkap —
dalam hitungan detik. Setelah itu semua fitur bisa langsung dites tanpa input manual.

## Kenapa ini menggantikan backup

Kalau data boleh hilang, **seed adalah safety net-nya.** Konsekuensinya menyenangkan:

| Sebelumnya | Sekarang |
|---|---|
| `drizzle-kit generate` + baca SQL manual | `drizzle-kit push` saja, sesuai CLAUDE.md |
| Backfill dulu baru pasang constraint (H2) | Wipe + seed ulang, tidak perlu backfill |
| Takut salah `ALTER COLUMN` | Salah? `db:reset` |
| Backup sebelum tiap task | Tidak perlu |

Aturan `push` di CLAUDE.md tetap berlaku apa adanya — **tidak jadi ada pengecualian.**

Tapi ada syaratnya, dan ini yang bikin task ini sedang-sedang saja ukurannya, bukan kecil:
**seed harus benar-benar lengkap.** Kalau setelah reset kamu masih harus bikin supplier
manual, input stok manual, dan bikin PO manual sebelum bisa tes checkout, kamu akan
berhenti melakukan reset — lalu kembali takut pada migrasi. Seed yang setengah jadi
membatalkan seluruh manfaatnya.

## Struktur

Pecah per domain supaya gampang dirawat. `seed.ts` yang sekarang hanya mengisi
tenant/branch/roles/user, dan `seed-flows.ts` **tidak idempotent** (dijalankan dua kali
membuat flow template duplikat). Keduanya dilebur ke sini.

```
src/db/seed/
├─ index.ts          # orkestrator — panggil berurutan, satu transaksi
├─ 01-core.ts        # tenants, branches, roles, permissions, users
├─ 02-catalog.ts     # part brands, device brands/models, kategori, item
├─ 03-suppliers.ts   # suppliers (tempo & tunai), supplier brands
├─ 04-flows.ts       # flow template + nodes + transitions
├─ 05-inventory.ts   # stock batches, stock levels
├─ 06-customers.ts   # customers + customer assets
└─ 07-transactions.ts # contoh PO, tiket, invoice
```

Script di `package.json`:

```json
"db:push":  "drizzle-kit push",
"db:seed":  "tsx src/db/seed/index.ts",
"db:reset": "tsx src/db/reset.ts && npm run db:push && npm run db:seed"
```

`reset.ts` melakukan `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` — lebih bersih
dan lebih cepat daripada menghapus tabel satu per satu, dan tidak peduli urutan foreign key.

```ts
// src/db/reset.ts
// Menolak jalan kalau DATABASE_URL bukan localhost. Satu baris ini yang mencegah
// perintah ini menghapus database produksi setelah Phase 11.
if (!process.env.DATABASE_URL?.includes('localhost')) {
  throw new Error('db:reset hanya untuk database lokal. Batal.');
}
```

## Data yang wajib ada

Ini bagian pentingnya. Seed harus cukup untuk menguji **seluruh** H-track tanpa input
manual. Yang di bawah ini bukan sekadar "biar ada isinya" — tiap poin dipilih karena ada
task yang tidak bisa diverifikasi tanpanya.

### Wajib

**Dua tenant.** Tenant kedua ("Bengkel Sebelah") dengan data sendiri. Tanpa ini, tes
isolasi tenant di [H12](./H12-rbac.md) tidak mungkin — dan itu satu-satunya cara
membuktikan kebocoran antar tenant tidak terjadi.

**Dua branch** di tenant utama. Stok bersifat per-branch; bug scoping branch hanya muncul
kalau branch-nya lebih dari satu.

**Satu user per role** — Super Admin, Manager, Technician, Cashier — semua password sama
(`admin123`) supaya gampang. [H12](./H12-rbac.md) perlu login sebagai Cashier untuk
membuktikan dia **ditolak** melakukan aksi manager.

**Katalog permission lengkap** dari `specification/03-rbac-roles.md`, plus
`role_permissions` per role. Ini prasyarat H12 Stage 1.

**Beberapa batch per item dengan harga berbeda.** Ini yang paling sering terlewat dan
paling penting:

```
Item "LCD Samsung A10"
  Batch 1: 5 pcs @ Rp 150.000  (diterima 3 hari lalu, Supplier A)
  Batch 2: 5 pcs @ Rp 165.000  (diterima kemarin,   Supplier B)
```

Tanpa ini, FIFO tidak pernah benar-benar teruji. Kasus "beli 8 pcs" harus memotong 5 dari
batch pertama dan 3 dari batch kedua, menghasilkan dua baris movement dan COGS campuran —
itulah kasus yang menemukan bug di [H9](./H9-ticket-parts-consumption.md) dan
[H11](./H11-finance-ledger.md). Satu batch per item tidak membuktikan apa pun.

**Satu item dengan stok 1 pcs.** Untuk tes reservasi di
[H10](./H10-stock-reservation.md): pesan unit terakhir, lalu buktikan POS menolak menjual.

**Supplier dengan termin berbeda** — satu `paymentTermDays: 0` (tunai), satu `30` (tempo).
Tempo dibutuhkan untuk hutang supplier dan perhitungan jatuh tempo.

**Flow template lengkap** dengan nodes dan transitions, sama seperti `seed-flows.ts` yang
sekarang. Pertahankan "Completion" tanpa transisi keluar — deteksi node terminal bersifat
struktural, dan itu yang menutup tiket.

### Sebaiknya ada

- 3–5 customer dengan asset (HP, laptop) supaya intake bisa langsung dicoba
- 1 PO berstatus `ordered` (untuk tes penerimaan barang), 1 `completed`
- 1 supplier invoice belum lunas (untuk halaman hutang)
- 1 tiket di tengah flow (misalnya di node Diagnosis)

### Jangan

- Jangan seed `finance_ledger_entries` — biarkan [H11](./H11-finance-ledger.md) yang
  mengisinya, supaya backfill benar-benar teruji
- Jangan seed data berjumlah ratusan. Cukup untuk menguji, bukan untuk benchmark.
- Jangan pakai `Math.random()` untuk nilai apa pun. Seed harus **deterministik** —
  tes yang bergantung pada data acak akan lulus hari ini dan gagal minggu depan tanpa
  alasan yang bisa dilacak.

## Langkah

1. Buat `src/db/reset.ts` dengan penjaga localhost
2. Buat struktur `src/db/seed/` dan pindahkan isi `seed.ts` ke `01-core.ts`
3. Pindahkan `seed-flows.ts` ke `04-flows.ts` (sekaligus memperbaiki masalah idempotency)
4. Tulis `02`, `03`, `05`, `06`, `07`
5. Ekspor ID penting dari `index.ts` supaya tes bisa memakainya tanpa query:
   ```ts
   export const SEED_IDS = {
     tenant: '...', branchPusat: '...', itemLcdMultiBatch: '...', itemStokSatu: '...',
   } as const;
   ```
   Pakai UUID **hardcoded**, bukan `defaultRandom()`, untuk entitas yang dirujuk tes.
6. Hapus `seed.ts` dan `seed-flows.ts` yang lama
7. Update `CLAUDE.md`: catat `db:reset` sebagai cara standar mengganti skema selama develop

## Verifikasi

- [ ] `npm run db:reset` selesai tanpa error dari database kosong
- [ ] Dijalankan **dua kali** berturut-turut tetap berhasil dan hasilnya identik
- [ ] `db:reset` menolak jalan kalau `DATABASE_URL` bukan localhost (tes betulan — ubah
      sementara env-nya)
- [ ] Login berhasil untuk keempat user, tiap role menampilkan menu sesuai
- [ ] Halaman inventory menampilkan item dengan dua batch harga berbeda
- [ ] Checkout POS 8 pcs item multi-batch memotong 5 + 3 dari dua batch
- [ ] Halaman hutang supplier menampilkan invoice belum lunas
- [ ] Intake tiket bisa langsung dilakukan dengan customer dan flow yang sudah ada
- [ ] `npm test` tetap 37/37

## Perhatian

- **Penjaga localhost bukan opsional.** Setelah Phase 11 ada database produksi, dan
  `db:reset` tanpa penjaga adalah perintah yang menghapusnya. Tulis sekarang selagi ingat.
- Seed harus jalan **berurutan**, bukan paralel — foreign key punya urutan.
- Kalau seed mulai terasa lambat, itu tanda datanya kebanyakan. Pangkas.
- Setelah task ini, **kebiasaannya berubah**: setiap ganti skema, `npm run db:reset`.
  Jangan lagi mikir migrasi sampai Phase 10.
