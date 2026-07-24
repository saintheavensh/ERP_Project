# Tahap A — CRUD Metode Pembayaran + E-Wallet (go-live gap Tier-1 #4)

> **Status: SELESAI 2026-07-24.** Semua task A4.1–A4.9 `[x]` dengan bukti live +
> Playwright (lihat Progress log di bawah). Branch `go-live/tahap-a` (bercabang dari
> `phase-6/printer`,
> jadi mewarisi seluruh infra Phase 5 + Phase 6). Titik mulai Tahap A yang dipilih sebagai
> "pembuka cepat" per [`plan/go-live-plan.md`](go-live-plan.md) §7C — ternyata menyentuh
> subsistem setengah-jadi (lihat Temuan), jadi scope-nya lebih dari sekadar CRUD.
>
> **Definition of Done** (PHASES.md) tetap berlaku: `[x]` hanya dengan tes lulus /
> request+response terekam / click-path yang benar-benar dijalankan.

---

## 1. Temuan (kenapa ini bukan sekadar "tambah CRUD")

Audit kode sebelum menulis apa pun menemukan subsistem `payment_methods` yang **inkonsisten
dan setengah tersambung**:

1. **Tabel `payment_methods`** (`db/schema/payment-methods.ts`) ada: `{id, tenantId, name,
   type, isActive}`. `name` = label spesifik (mis. "Dana", "BCA"); `type` = kategori
   (`cash`/`transfer`/`qris`/`tempo`).
2. **FE POS `CheckoutModal.svelte` SUDAH membaca tabel ini** (`{#each paymentMethods as pm}`,
   `value={pm.type}`, label `{pm.name}`) — config-driven, sudah menangani kasus kosong.
3. **Tapi tabelnya TIDAK PERNAH di-seed** (`grep` di `db/seed/` nihil). Jadi di app nyata
   sekarang POS menampilkan "Tidak ada metode pembayaran aktif" — satu-satunya yang jalan
   cuma default tersembunyi `paymentMethod='cash'` di store. **Gap laten**: kasir tak bisa
   memilih Transfer/QRIS/e-wallet hari ini.
4. **Backend checkout (`routes/pos/types.ts`) validasi pakai enum hardcoded**
   `z.enum(['cash','transfer','qris','split','tempo'])` — sama sekali tak baca tabel.
   Kirim `ewallet` sekarang → **400**.
5. **Radio POS `bind` ke `pm.type`** → kalau 2+ metode ber-type sama (Dana & OVO dua-duanya
   `ewallet`), radio rusak: pilih satu, ter-highlight dua, dan `bind:group` ambigu. Artinya
   **menambah CRUD saja = memasang jebakan**: owner bisa membuat data yang merusak POS —
   persis kelas bug "dead/broken feature" yang Track F ada untuk membasminya.

**Kesimpulan:** agar e-wallet nyambung end-to-end **tanpa** memasang jebakan, perlu: seed +
CRUD + perbaiki enum backend + perbaiki radio FE agar banyak-metode-per-type aman.

## 2. Keputusan desain

- **`type` = kategori berhingga (enum), `name` = data pengguna.** Menambah kategori baru
  (mis. `ewallet`) = perubahan kode (jarang); menambah e-wallet bernama (GoPay) = cukup data.
  Model ini sudah tersirat di skema (`type` vs `name` terpisah).
- **Kontrak backend checkout TIDAK diubah** — FE tetap mengirim string `type`. Backend hanya
  **menambah `'ewallet'`** ke enum. `paymentStatus = type==='tempo' ? 'unpaid' : 'paid'` dan
  refine "tempo wajib customerId" tetap benar karena keduanya berbasis `type`. Risiko regresi
  di jalur checkout inti (paling penting di app) ditekan seminimal mungkin — **tidak** ada
  refactor kontrak `paymentMethod: string → paymentMethodId: uuid`.
- **Radio FE bind ke `pm.id`, submit `pm.type` turunan.** Ini yang membuat Dana/OVO/GoPay
  (3 metode ber-type `ewallet`) tampil sebagai 3 radio berbeda yang bisa dipilih, tanpa
  merusak apa pun. Konsekuensi sadar: invoice merekam `type` (`'ewallet'`), **bukan** brand
  spesifik. Membedakan Dana vs OVO vs GoPay di level invoice (butuh simpan `name`/`id` di
  invoice) **ditunda** ke Tahap D (dari gesekan pilot) — dicatat, bukan dibuang.
- **CRUD digerbangi permission baru `payment.manage`** (admin-only, TIDAK diberikan ke
  Manager — pola sama `branch.manage`/`audit.view`). `GET` tetap terbuka untuk semua user
  terautentikasi karena kasir perlu membacanya di POS.

## 3. Task breakdown

### BE
- [ ] **A4.1** `ids.ts`: `permPaymentManage` (UUID `...027`). `01-core.ts`: tambah
      `payment.manage` ke katalog PERMISSIONS (admin-only, tak masuk grant Manager).
- [ ] **A4.2** `db/seed/09-payment-methods.ts` — seed tenantMain: Tunai(cash), Transfer
      Bank(transfer), QRIS(qris), Dana(ewallet), OVO(ewallet), GoPay(ewallet), Tempo(tempo);
      tenantSecond: Tunai(cash), QRIS(qris). Idempotent, UUID tetap. Wire ke `seed/index.ts`.
- [ ] **A4.3** `routes/settings.ts`: `POST /v1/settings/payment-methods` +
      `PATCH /v1/settings/payment-methods/:id` — `requirePermission('payment.manage')`,
      `auditMiddleware`, tenant-scoped, Zod `type ∈ {cash,transfer,qris,ewallet,tempo}`,
      `isActive` toggle. GET tetap (tambah `orderBy`).
- [ ] **A4.4** `routes/pos/types.ts`: tambah `'ewallet'` ke `posCheckoutSchema.paymentMethod`.

### FE
- [ ] **A4.5** `states/pos/pos.checkout.svelte.ts`: ganti `paymentMethod` state →
      `selectedMethodId`; getter `selectedType` (lookup by id, fallback `'cash'`);
      `openCheckout()` default ke metode pertama; `processCheckout()` submit `selectedType`.
- [ ] **A4.6** `components/pos/CheckoutModal.svelte`: radio `bind`/`checked` ke `pm.id`,
      highlight & peringatan tempo pakai `selectedType`.
- [ ] **A4.7** `components/settings/PaymentMethodsTab.svelte`: CRUD nyata (tambah/edit/toggle
      aktif) meniru pola `BranchesTab`. Buang teks "hubungi pengembang".

### Verifikasi
- [ ] **A4.8** `npm run db:reset`; curl: POST/PATCH (admin 200/201, Manager 403, cross-tenant
      404, type invalid 400); POS checkout dengan `ewallet` → 201. `tsc` + `svelte-check` +
      `vitest` hijau. Playwright: settings CRUD + POS menampilkan metode ter-seed (incl.
      3 e-wallet) & checkout e-wallet sukses.
- [ ] **A4.9** Commit + update PHASES.md / go-live-plan.md gap #4.

## Progress log

- [x] **A4.1–A4.4 (BE)** 2026-07-24. `ids.ts` `permPaymentManage` (`...027`) +
      payment-method UUID (`b4000000-*`); `01-core.ts` katalog `payment.manage`
      (admin-only, tak masuk grant Manager); `09-payment-methods.ts` seed 7 metode
      tenantMain (Tunai/Transfer/QRIS/Dana/OVO/GoPay/Tempo) + 2 tenantSecond, wired ke
      `seed/index.ts`; `routes/settings.ts` POST + PATCH `/v1/settings/payment-methods`
      (requirePermission + audit + tenant-scoped + Zod type enum); `pos/types.ts` +
      `enums.ts` `paymentMethodEnum` tambah `'ewallet'` (kolom invoice adalah pg enum —
      tsc menangkap ini sebelum commit). `npx tsc --noEmit` bersih; `db:reset` OK;
      `npx vitest run` 198/198.
- [x] **A4.5–A4.7 (FE)** 2026-07-24. `pos.checkout.svelte.ts`: `paymentMethod` state →
      `selectedMethodId` + getter `selectedType` (lookup id→type, fallback `'cash'`),
      `paymentMethods` getter difilter `isActive`, `openCheckout()` default metode
      pertama, submit `selectedType`. `CheckoutModal.svelte`: radio `bind`/`value` ke
      `pm.id` (bukan `pm.type`) + highlight/peringatan tempo via `selectedType` — inilah
      yang membuat 3 e-wallet ber-type sama tampil sebagai 3 radio berbeda tanpa rusak.
      `PaymentMethodsTab.svelte`: CRUD nyata (tambah/edit/toggle aktif) meniru
      `BranchesTab`. `npx svelte-check`: 729 file 0 error.
- [x] **A4.8 (verifikasi live + e2e)** 2026-07-24. Curl (server terpisah port 3999,
      `RBAC_MODE=enforce`): GET → 7 metode ter-seed; Manager POST → **403
      PERMISSION_DENIED**; Admin POST → **201**; PATCH deactivate → 200 `isActive:false`;
      type invalid → 400; PATCH id tak ada → 404; **POS checkout `paymentMethod:'ewallet'`
      (kasir) → 201, invoice merekam `paymentMethod=ewallet` status `paid`**. Playwright:
      +5 tes `tahap-a-payment-methods.spec.ts` (admin create+deactivate, Manager gate,
      Dana/OVO/GoPay tampil sebagai opsi berbeda, checkout e-wallet sukses, mobile
      no-overflow) + perbaiki tes p9 lama yang meng-assert read-only. **Suite penuh: 85
      Playwright + 198 backend unit, semua hijau.** DB direset ke seed bersih setelahnya.
- [x] **A4.9** Commit di `go-live/tahap-a` + update dokumen ini & `go-live-plan.md` gap #4.

## 4. Di luar scope (dicatat agar tak dikira lupa)
- Membedakan Dana/OVO/GoPay di level invoice (butuh simpan name/id di `pos_invoices`) → Tahap D.
- Jalur invoice dari tiket (`invoicePaymentMethod` di ticket detail) — enum-nya terpisah,
  bukan target e-wallet POS; tak disentuh di sini.
- Metode bayar per-cabang — tabel `payment_methods` tenant-scoped (tanpa branchId); tetap begitu.
