# Riwayat Lengkap — Fase R1 sampai R1.8

> **Dibuat 2026-08-01, diperluas 2026-08-04.** Branch: `go-live/tahap-b`.
> Induk: [`tahap-b-peran-dan-qc.md`](tahap-b-peran-dan-qc.md) · Indeks: [`README.md`](README.md)
>
> **Nama berkasnya masih `riwayat-R1-sampai-R1.7.md`, isinya sekarang sampai R1.8.**
> Sengaja tidak diganti nama: `PHASES.md` menautkannya di 8 tempat dan git history
> menyebutnya dengan nama itu — mengganti nama demi kerapian akan memutus rujukan yang
> gunanya justru supaya cerita ini bisa ditemukan.
>
> **Berkas ini menggantikan 9 berkas terpisah** yang sebelumnya menyimpan cerita ini
> sepotong-sepotong. Gelombang pertama (2026-08-01): `uji-R1-peran-akses.md`,
> `R1.5-perbaikan-hasil-uji-R1.md`, `uji-R1.5-perbaikan.md`,
> `R1.6-perbaikan-hasil-uji-R1.5.md`, `uji-R1.6-perbaikan.md`. Gelombang kedua
> (2026-08-04): `uji-R1.7-perbaikan.md`, `R1.8-perbaikan-hasil-uji-R1.7.md`,
> `uji-R1.8-perbaikan.md`, `uji-00-kondisi-sekarang.md` — daftar lengkap + alasannya di
> bagian **"Berkas yang dihapus"** paling bawah.
>
> Semuanya dihapus atas permintaan pemilik ("agar tidak terlalu menumpuk tetapi riwayatnya
> jangan sampai hilang"). Isinya — termasuk kalimat asli pemilik, yang justru bagian paling
> berharga — dipindahkan ke sini. **Setiap catatan uji di-commit lebih dulu sebelum
> berkasnya dihapus**, jadi teks aslinya tetap utuh dan bisa dibaca kata per kata di git
> history (commit `77d9da6`, `ec89e5a`, `7bc94c9`, `c5ea7c3`, `a87291d`).

---

## Kenapa riwayat ini layak dibaca

Empat fase di bawah ini adalah satu pelajaran yang diulang empat kali:

> **Setiap bug di sini lolos dari tes otomatis yang hijau, `tsc` yang bersih, dan kode
> yang sudah dibaca ulang. Semuanya ditemukan oleh pemilik yang MEMAKAI aplikasinya.**

Bukan karena tesnya sedikit — saat R1 selesai sudah ada 262 tes unit dan 27 Playwright.
Tesnya menguji hal yang salah: memeriksa bahwa sesuatu **ada**, bukan bahwa sesuatu
**bisa dipakai**. Pola itu berulang persis sampai R1.7, dan bentuknya selalu sama:

| Fase | Yang tesnya buktikan | Yang pemilik temukan |
|---|---|---|
| R1 | endpoint intake ada dan jalan | **kasir tidak punya izin memanggilnya** |
| R1.5 | menu keuangan disembunyikan dari kasir | **API-nya tetap membalas 200 berisi laba toko** |
| R1.6 | pesan validasi dikembalikan backend | **isinya JSON mentah di layar kasir** |
| R1.7 | API piutang membalas 200 untuk kasir, kartunya tampil | **tautan kartunya memantulkan kasir** |
| R1.8 | kasir punya izin `customer.manage`, endpointnya terbuka | **tak ada satu pun baris menu ke halaman Pelanggan** |

Baris R1.7 yang paling telak: tes R1.6 memeriksa API-nya **dan** kartunya, lalu tetap
lolos — karena tak satu pun **mengikuti tautannya**. Pemilik menemukannya dengan satu klik.

Baris R1.8 membuktikan polanya belum habis: bentuknya **persis bug R1** — izin diberikan,
jalannya tidak pernah dibuat — dan lolos lagi, sepuluh hari setelah bug pertama yang sama
mengubah seluruh cara kerja proyek ini.

---

## Fase R1 — Peran & akses (selesai 2026-07-31)

### Rencananya

Merapikan siapa boleh apa: kasir menerima unit di konter, teknisi mengambil pekerjaan dari
antrian. Diturunkan dari `plan/tahap-b-peran-dan-qc.md`.

### Yang dibangun

- Kasir diberi izin `ticket.create` + baris menu "Servis".
- `GET /v1/tickets` menerima `?assignedTo=none` (antrian tak bertuan).
- Daftar teknisi dipecah dua kelompok: **Menunggu Diambil** / **Sedang Saya Kerjakan**.
- Beranda teknisi dapat kartu jumlah antrian.

### Bug yang memicu seluruh cara kerja ini

Dua bug ditemukan pemilik, bukan oleh tes:

1. **Kasir tidak bisa membuat tiket servis** — 403 di `POST /v1/tickets/intake`.
   `modules/flow/backbone.ts` sudah menulis tahap Intake sebagai pekerjaan kasir sejak
   Tahap B, tapi izinnya tak pernah diberikan. Kode alur dan katalog izin saling
   bertentangan sejak awal.
2. **Teknisi tidak bisa mengambil pekerjaan yang belum ditugaskan** — daftarnya
   di-filter `?assignedTo=me` mati, jadi tiket tak bertuan tidak muncul di mana pun,
   halaman detailnya tak terjangkau, dan tombol "Ambil Pekerjaan" yang **sudah benar**
   tak pernah bisa ditekan.

**Akibatnya cara kerja diubah** (`plan/README.md`, disepakati 2026-07-31): satu fase pada
satu waktu, dengan uji manual pemilik sebagai gerbang di antaranya. Agent tidak boleh
memulai fase berikutnya sebelum membaca catatan uji fase sebelumnya.

### Bukti R1

Kasir intake **201** (dulu 403); klaim memindahkan tiket antar kelompok (3→2 antrian,
0→1 milik sendiri); kasir tetap **403** di 5 endpoint lain — bukti hanya satu izin
ditambah. **27 Playwright** (10 baru) + **262 unit** lulus.

---

## Uji manual R1 oleh pemilik → kesimpulan: **"Ada yang harus diperbaiki dulu"**

Temuan yang jadi isi R1.5:

- **C7 & C8** — *"anehnya kasir bisa akses halaman itu tidak hanya kasir teknisi juga bisa akses"*
- **B1** — teknisi masih melihat tombol "Terima Unit"
- **A5** — *"tambahkan validasi untuk pin dan polanya minimal 4 huruf"*
- **A9** — *"jangan langsung ke halaman detail, buat saja toast notifikasi tiket baru berhasil dibuat"*
- Aturan yang pemilik tulis sendiri: *"Kasir saja, teknisi hanya bisa melihat harga jual yang di input oleh manager"*

---

## Fase R1.5 — Perbaikan hasil uji R1 (2026-08-01)

### T5 🔴 — yang C7/C8 sebenarnya, dan ini jauh lebih buruk dari "halaman kosong terbuka"

Diperiksa live via curl (`RBAC_MODE=enforce`, seed bersih, login asli tiap peran):

| Endpoint | Kasir | Teknisi | Isi yang keluar |
|---|:---:|:---:|---|
| `GET /v1/finance/payables` | **200** | **200** | daftar hutang ke supplier |
| `GET /v1/finance/ledger` | **200** | **200** | seluruh buku kas |
| `GET /v1/finance/ledger/summary` | **200** | **200** | `revenue 220000, cogs 150000, estimatedProfit 70000` |
| `GET /v1/finance/receivables` | **200** | **200** | piutang |

**Jadi ini kebocoran data, bukan halaman kosong.** Kasir dan teknisi bisa membaca omzet,
modal, dan laba toko — menabrak langsung aturan yang pemilik tulis sendiri.

**Sebabnya, dan ini bentuk cacat yang proyek ini sudah temukan berkali-kali:** permission
`finance.view_reports` **sudah ada** di katalog seed sejak H12 dan **sudah diberikan ke
Manager**, tapi

```
grep -rn "finance.view_reports" flowserv-api/src/
  → hanya 2 hasil, KEDUANYA di db/seed/01-core.ts
  → tidak satu route pun memanggil requirePermission('finance.view_reports')
```

Izinnya didefinisikan, diberikan, lalu **tidak pernah dipasang**. Gerbangnya tidak jebol —
gerbangnya **tidak pernah ada**. Bentuk yang sama dengan S5 (tiga kapabilitas tahap yang
tak ditegakkan di backend) dan Track F ("wired but lies").

Lapis kedua di frontend: `(app)/+layout.server.ts` hanya memeriksa "sudah login",
**tidak pernah memeriksa peran**. Sidebar menyembunyikan menunya (S2), tapi mengetik
alamatnya langsung tetap tembus — persis yang `tahap-b-peran-dan-qc.md` sendiri
peringatkan: **"Menyembunyikan tombol bukan keamanan."**

### Yang dikerjakan di R1.5

| Kode | Isi |
|---|---|
| **R1.5A** | Gerbang `finance.view_reports` dipasang di backend + `lib/auth/route-access.ts` di frontend |
| **R1.5B** | Teknisi kehilangan `ticket.create` — intake wewenang konter. `ticket.diagnose` **wajib tetap ada**: itu yang menggerbangi `POST /:id/claim` |
| **R1.5C** | Sandi/pola minimal 4, ditegakkan di backend (`lib/passcode.ts`). "pola:1-2" panjangnya 9 karakter tapi hanya 2 titik — hitungan mentah meloloskannya |
| **R1.5D** | Kasir tetap di form setelah simpan |

**R1.5D ternyata tidak kecil.** Lemparan ke halaman detail bukan sekadar navigasi —
`?autoprint=intake` di URL-nya adalah **yang memicu cetak label**. Menghapusnya begitu
saja akan diam-diam mematikan cetak otomatis, tepat hal yang pemilik minta ada. Ditanyakan
dulu ke pemilik → "tetap di form DAN cetak tetap jalan"; pemicunya dipindah ke form intake
memakai helper `autoPrint()` yang sama. **18 tes di 9 spec** memakai lemparan itu sebagai
langkah setup — semuanya diperbarui menempuh jalan kasir sungguhan, bukan dilonggarkan.

**Bukti R1.5:** 278 unit · Playwright 170/170 di DB bersih · matriks 403/200 empat peran.

---

## Uji manual R1.5 oleh pemilik → kesimpulan: **"Sepertinya masih ada yang perlu di perbaiki"**

Enam catatan. **Tiga di antaranya ternyata bukan bug** — diperiksa ke database dulu:

| Catatan | Kenyataannya |
|---|---|
| A6 — *"sudah saya coba tetapi nilainya 0"* (kartu Piutang) | `select count(*) from pos_invoices` → **0**. Seed tak pernah membuat faktur POS, jadi 0 untuk **semua** peran termasuk Super Admin. Bukan gerbang kesempitan |
| A3 — *"apakah tidak apa apa di url jadi seperti ini /?ditolak=%2Fflows"* | Tidak berbahaya. Tetap dirapikan |
| E2 — penjualan tunai "hilang" | Pemilik menjalankan `db:reset` lagi setelah uji. Ditanyakan langsung, bukan ditebak |

Yang benar-benar bug:

- **C1 & C3** — *"error yang di dapatkan masih berupa array object"*
- **B3** — *"alurnya masih terlalu banyak harus ke halaman pekerjaan saya kemudian lihat detail terus ambil pekerjaan menurut saya kurang simpel"*
- **E5** — *"buatlah seednya jadi teknisinya ada dua sehingga saya tidak perlu tambah tambah lagi di bagian settings"*

Dan dua yang dipindahkan ke R2 karena butuh keputusan pemilik:

- **E1** — *"sebaiknya jangan di perlihatkan semuanya dan sebaiknya ada step stepnya... teknisi jadi bingung harus mengisi yang mana"*
- **E3** — papan Kanban: *"ketika pindah status datanya masih bisa kosong"* → dikonfirmasi ke pemilik artinya **tiket bisa maju walau data belum diisi**

---

## Fase R1.6 — Perbaikan hasil uji R1.5 (2026-08-01)

### T1 🔴 — pesan validasi berupa JSON mentah, dan penyebabnya bukan di halaman intake

Yang pemilik lihat:

```
[ { "code": "custom", "message": "Pola minimal 4 titik.", "path": [ "devicePasscode" ] } ]
```

`zValidator` bawaan Hono, ketika validasi gagal, membalas dengan bentuknya sendiri —
`{ success: false, error: <ZodError> }` — bukan amplop `{ data, meta, error }` yang
`coding-guidelines.md` §3.2 sebut *"no exceptions"*. Dibuktikan:

```js
JSON.stringify({ success:false, error: zodResult.error })
// → {"error":{"name":"ZodError","message":"[\n  {\n    \"code\": \"custom\", ...}]"}}
```

`ZodError.message` **isinya JSON**. Frontend membaca `error.message` — yang **benar**
menurut amplop proyek — lalu menampilkannya apa adanya. Pesan Indonesianya sudah ada di
dalam sana, hanya terkubur. **Berlaku di 78 pemakaian pada 24 berkas route.**

Ditutup dengan satu pembungkus `flowserv-api/src/lib/validator.ts`. Impor langsung ke
`@hono/zod-validator` kini hanya ada di pembungkus itu.

> **Kesalahan yang dibuat lalu diperbaiki:** versi pertama menulis ulang tanda tangan tipe
> pembungkusnya, dan itu diam-diam meruntuhkan inferensi Hono — `c.req.valid('json')`
> jadi `unknown` di **semua** route sekaligus, ratusan `TS18046` di berkas yang tak
> disentuh. Bentuk cacat yang sama persis dengan H12. Ditangkap `tsc`, bukan review.
> Perbaikannya `as typeof honoZValidator`: **bungkus perilakunya, jangan tulis ulang tipenya.**

### T2, T3, T4

- **T2** — tombol "Ambil" langsung di baris antrian. Panggilannya **tidak disalin**:
  dipindah ke `lib/api/tickets.ts`, dipakai halaman detail juga, supaya `Idempotency-Key`
  tak bisa hilang di salah satu jalur.
- **T3** — Teknisi Rina di seed + dua faktur piutang contoh. Keduanya **sengaja hanya
  jasa, tanpa suku cadang**: baris `part` menuntut batch FIFO, `stock_movements`, dan
  cache `stock_levels` yang cocok — dan data contoh tidak boleh mengotori
  `GET /v1/inventory/reconciliation`, alat yang justru dipakai mendeteksi bug stok
  (keputusan H4).
  > **Ditangkap tes:** baris buku kas ditulis `referenceType: 'pos_invoice'` padahal
  > `ledger/reconcile` hanya menghitung `'pos_sale'`. Kedua faktur tampak belum dibukukan,
  > e2e H15 gagal (`isClean: false`).
- **T4** — alamat `?ditolak=` bersih sendiri. **Butuh tiga percobaan:**

  | Percobaan | Hasil |
  |---|---|
  | di `$effect` | ❌ `Cannot call replaceState(...) before router is initialized` |
  | di `afterNavigate` | ❌ galat sama — pada muat penuh ia pun berjalan saat hidrasi |
  | `window.history.replaceState` | ✅ jalan, tapi SvelteKit menulis peringatan permanen |
  | `onMount` + `await tick()` | ✅ **dipakai** |

  Sebabnya: pentalan ini `redirect()` dari **server**, jadi halamannya dimuat penuh.
  Ditemukan oleh tes e2e yang gagal + skrip Playwright kecil yang mencetak `pageerror`.

### Jebakan yang ditutup sekalian

`playwright.config.ts` default-nya `localhost:5173`, padahal peluncur resmi proyek ini
(`start-flowserv.ps1`) memakai **5188** `--strictPort`. Di komputer pemilik, 5173 dipegang
proyek lain (`pos_sederhana`) — jadi **seluruh suite menguji aplikasi yang salah** dan
gagal dengan pesan menyesatkan (`locator('#email')` tidak ditemukan). Terbukti:
`curl localhost:5173/login` mengembalikan `<title>frontend</title>`. Default diperbaiki.

**Bukti R1.6:** 288 unit · 21 e2e API · Playwright 177/180 · `tsc` + `svelte-check` bersih.

---

## Uji manual R1.6 oleh pemilik → kesimpulan: **"Ada yang harus diperbaiki dulu"**

Yang **terbukti jalan**: A1–A3 (pesan validasi bersih — *"Gagal menyimpan unit masuk /
Pola minimal 4 titik."*), B4 (*"teknisi 2 tidak bisa melihat pekerjaan yang di lakukan
teknisi lainnya"*), C1, C3, D1–D3, E1–E4.

Yang gagal dan yang diminta:

| Poin | Kalimat pemilik |
|---|---|
| **C2** 🔴 | *"Tidak bisa di klik ketika login kasir karena akses di tolak — `/?ditolak=%2Ffinance%2Freceivables`"* |
| **B1** | *"daftar antrian service... di sertakan di bagian dashboard jadi tinggal ambil saja"* + *"jangan buka halaman baru jika ingin lihat detail munculkan popup saja... muncul popup semua yang di inputkan kasir keluhan nama tanggal pola dan lain sebagainya"* |
| **B3** | *"di halaman detail service sebaiknya teknisi tidak bisa memilih teknisi lainnya soalnya itu membingungkan"* |
| **E1** | *"tinggal tambahkan riwayat input tiket service di bagian kasir untuk memastikannya"* |

---

## Fase R1.7 — Perbaikan hasil uji R1.6 (2026-08-01)

### T1 🔴 — C2: kartu Piutang menautkan ke halaman yang menolak kasir

Aturan `/finance` di `route-access.ts` menutup **seluruh anak jalurnya**, termasuk
`/finance/receivables`. Padahal backend menggerbangi piutang dengan `pos.process_payment`,
bukan `finance.view_reports` — jadi API-nya memang 200 untuk kasir.

**Yang membuat ini pahit:** komentar di aturan `/finance` **sudah menyebut pengecualian
ini sejak R1.5** —

> *"Cashier keeps the AR tile on their own dashboard, which reads /finance/receivables
> (gated on pos.process_payment instead)."*

— tapi **barisnya tak pernah ditulis**. Komentar yang benar di atas kode yang salah.
Logika "prefix terpanjang menang" sudah ada di berkas itu sejak awal, justru supaya
pengecualian seperti ini mungkin; ia hanya tak pernah dipakai.

**Dan tes R1.6 memeriksa dua hal yang salah:** bahwa API-nya 200, dan bahwa kartunya
tampil. Tak satu pun **mengikuti tautannya**. Tes R1.7 sekarang mengklik kartunya.

### T2 — antrian di beranda + popup rincian

- Beranda teknisi menampilkan **barisnya**, bukan cuma angkanya (maks. 8; daftar penuh
  tetap di `/tickets`).
- `AntrianDetailDialog.svelte` — popup berisi semua yang dicatat kasir: pelanggan, telepon,
  unit, no. seri, **keluhan**, **sandi/pola**, tanggal masuk, no. antrian, tahap.
  Tombol **Ambil Pekerjaan** ada di dalamnya.
- Isinya diambil dari `GET /v1/tickets/:id` **saat popup dibuka**, bukan dari baris daftar.
  Alasannya bukan kerapian: daftar tiket tidak mengembalikan keluhan, telepon, maupun
  sandi — dan menambahkannya ke daftar berarti **mengirim sandi setiap unit ke setiap
  layar yang memuat daftar** (papan Kanban, daftar kasir), padahal yang butuh cuma popup.
- Popup dipakai **hanya untuk antrian** (memutuskan mengambil atau tidak). Tiket yang
  sudah dipegang tetap membuka halaman kerja penuh — biaya, daftar periksa, dan
  perpindahan tahap tak muat di popup. Komponen yang sama dipakai di beranda **dan** di
  `/tickets`, supaya isinya tak pernah berbeda di dua tempat.

### T3 — teknisi tidak memilih teknisi lain

Backend **sudah** menolaknya (`requirePermission('ticket.assign_technician')`, tidak
diberikan ke Technician). Jadi dropdown itu kontrol yang tampak hidup padahal pasti gagal —
anti-pattern yang Track F ada untuk membasminya. Pemilik menemukannya sebagai
**kebingungan**, bukan sebagai error. Sekarang teknisi hanya membaca nama pemegang tiket.
Tombol "Ambil Pekerjaan" **tidak** ikut hilang: itu menugaskan diri sendiri, izinnya beda.

### T4 — riwayat unit masuk di halaman Terima Unit

Lima unit terbaru di bawah form. Dimuat dari server (bertahan setelah refresh) **dan**
ditambah dari sisi klien tiap tiket baru dibuat (tidak perlu memuat ulang saat melayani
antrean). Dicatat **sebelum** `resetForNextCustomer()` mengosongkan form — sesudahnya
nama pelanggan dan unitnya sudah hilang.

Ini "unit masuk terbaru se-toko", bukan "yang saya input": `service_tickets` tidak
menyimpan siapa pembuatnya, dan menambah kolom itu adalah perubahan skema yang tak
dibutuhkan untuk tujuan aslinya — memastikan unit tercatat.

### T5 — `?ditolak=` dibuang seluruhnya, dan kenapa itu perlu

Perbaikan T4 di R1.6 (`onMount` + `await tick()` lalu `replaceState()`) **lulus tes waktu
itu, lalu mulai gagal di R1.7** — tanpa satu baris pun kode terkaitnya disentuh. Yang
berubah cuma satu: beranda kebagian isi lebih banyak (kartu antrian + komponen popup),
jadi hidrasi sedikit lebih lama dan satu `tick()` tak lagi cukup untuk menunggu router
SvelteKit siap.

Itu menjelaskan seluruh urutan kegagalan sebelumnya dengan benar: **keempat cara
pembersihan dari sisi klien bergantung pada waktu**, dan yang "berhasil" hanya menang
balapan, bukan menjamin apa pun.

Sekarang alamatnya **tidak pernah kotor sejak awal**: penjaga layout menaruh jalur yang
ditolak di **cookie sekali pakai** (`flowserv_ditolak`, umur 30 detik) lalu memantulkan ke
`/`; `+page.server.ts` membacanya dan **langsung menghapusnya di server**. Tidak ada kode
waktu di browser sama sekali, dan "hilang setelah refresh" jadi jaminan, bukan usaha.

Tes T4 dari R1.6 **sengaja tidak diganti isinya** — yang dijanjikan ke pemakai tetap sama
persis ("ditolak, diberi tahu, alamat bersih, hilang setelah refresh"), dan tes yang
bertahan melewati penggantian mekanisme justru itu gunanya.

### Bukti R1.7

| Uji | Hasil |
|---|---|
| Unit backend | **288 lulus** (backend tak disentuh di R1.7) |
| `npx tsc --noEmit` | 0 galat |
| `npx svelte-check` | 733 berkas, **0 galat** |
| Playwright | lihat `PHASES.md` bagian R1.7 |
| `e2e/r1-7-perbaikan.spec.ts` | **11 tes baru** |

Tes pertama di spec baru itu **mengklik kartunya**, bukan memeriksa keberadaannya — persis
langkah yang absen di R1.6 dan membuat bug C2 lolos.

---

## Uji manual R1.7 oleh pemilik → kesimpulan: **"Ada yang harus diperbaiki dulu"**

**18 poin dijalankan, 14 lulus bersih** — termasuk keempat hal yang R1.7 memang ada untuk
memperbaikinya:

| Yang R1.7 janjikan | Kalimat pemilik |
|---|---|
| kartu Piutang bisa diklik kasir | terbuka; `/finance`, `/finance/ledger`, `/finance/payables` tetap ditolak (*"ya muncul toast — Halaman itu bukan untuk peran Anda"*); teknisi juga ditolak |
| antrian di beranda + popup | *"Ya persis seperti yang di inginkan saya"* |
| teknisi tak melihat pemilih teknisi lain | *"Benar dropdown sudah hilang dan tidak ada sama sekali"*; manajer masih punya |
| riwayat unit masuk di halaman kasir | ada, bertahan setelah F5, barisnya bisa diklik |

Yang tersisa **bukan kegagalan R1.7** — semuanya hal baru yang terlihat justru karena
bagian di atas sudah jalan. Empat catatan yang jadi isi R1.8:

| Poin | Kalimat pemilik | Kenyataannya |
|---|---|---|
| **D1** | *"saya bisa input tiket service meskipun unit service belum di isi dan buat keluhan / kerusakan jadi kolom wajib di isi"* + *"buat kasir bisa memilih teknisi saat membuat tiket service dan juga kasir bisa langsung memberi harga"* | **Benar, dan lebih longgar dari dugaannya** — satu-satunya kolom unit yang wajib adalah "Jenis", dan keluhan tak diperiksa di mana pun |
| **A1** | *"lebih baik jika kasir bisa melihat detail transaksi piutangnya"* | Memang belum ada; endpoint & izinnya sudah cukup, murni frontend |
| **B2** | *"untuk nomor antrian masih `-` apakah memang seperti itu?"* | **Bukan bug fitur** — endpoint intake selalu mengisinya; **seed**-nya yang tidak |
| **C2** | *"di bagian mana di halaman mana saya harus mencarinya"* (tombol Ambil Pekerjaan) | **Tombolnya ada**; **poin ujinya** yang usang sejak R1.7 memindahkan jalannya ke popup beranda |

Dan tiga kalimat yang sejak itu jadi definisi R2, disebut pemilik tiga kali dengan kata
berbeda:

> *"buat per step jadi tiap step itu ada requirement data yang harus di isi nanti si
> teknisinya tinggal next next next jadi tidak bingung bila di gabung seperti sekarang
> akan membingungkan teknisi"* (B3)
> *"lebih di perjelas sekarang di tahap apa dan harus isi apa bisa next dan prev"* (B5)
> *"ini masih harus ada pengembangan lagi dan lakukan secara bertahap masih terkesan
> memaksakan saya prefer per step di bagian detail servicenya"* (E3)

---

## Fase R1.8 — Perbaikan hasil uji R1.7 (2026-08-03)

### Tiga catatan pemilik yang ternyata BUKAN bug

Diperiksa ke kode lebih dulu, bukan ditebak — kebiasaan yang sejak R1.6 selalu menghemat
satu putaran perbaikan yang salah sasaran:

| Catatan | Kenyataannya |
|---|---|
| nomor antrian `-` | `routes/tickets.ts` **selalu** mengisinya, di dalam transaksi intake, per cabang, reset tiap hari. **Seed** yang menulis tiket langsung ke tabel dan melewati endpoint |
| tombol "Ambil Pekerjaan" tak ketemu | Ada di `TicketWorkspace.svelte:225`; yang hilang **jalan ke sana**, karena R1.7 sengaja memindahkannya ke popup beranda |
| rincian piutang | Memang belum ada — jadi T2 |

**Kedua kalinya data contoh membuat pemilik menguji hal yang salah** (di R1.5: kartu
Piutang bernilai 0 karena seed tak pernah membuat faktur POS). Itu pelajaran tersendiri:
seed yang tidak menyerupai data asli **membuat pemilik melaporkan bug yang tidak ada**.

### Yang dibangun

| Tugas | Isi |
|---|---|
| **T1 🔴** | Merek, model, keluhan **wajib** — ditegakkan **backend dulu** (`lib/intake-fields.ts`, satu definisi dipakai POST + PATCH). Aturannya **lintas-kolom**: merek/model wajib hanya saat unit BARU. Keluhan minimal 3 huruf (menutup jalan pintas mengetik `-`); merek/model **tanpa** panjang minimum ("LG"/"X" sah). Isi tetap bebas — "Advan G30" di luar katalog tersimpan |
| **T2** | Tombol **Rincian** di daftar piutang. Modal POS **tidak** dipakai ulang walau isinya nyaris persis: ia membawa Void + Ubah yang digerbangi izin yang kasir tak punya — memasang kontrol yang pasti gagal adalah anti-pattern yang Track F dan R1.7-T3 berantas |
| **T3** | `queueNumber` + `queueDate` diisi di data contoh |
| **T5** | Panel **"Belum ada di katalog"** di `/devices`, tanpa kolom baru |
| **T6** | Kasir boleh menunjuk teknisi saat intake, **opsional** — digerbangi `ticket.create`, bukan `ticket.assign_technician`: menugaskan saat MEMBUAT ≠ memindahkan pekerjaan berjalan |
| **T7** | Kolom baru `intake_estimated_cost` — perkiraan konter, **bukan** baris biaya. Aturan S5 tidak dicabut (biaya sungguhan di Intake tetap 422) |

### Empat hal yang hanya ketahuan dengan MENJALANKANNYA

1. **`device_model_id IS NULL` ternyata tidak cukup (T5).** Percobaan pertama menampilkan
   **"Samsung Galaxy A10"** sebagai belum-berkatalog — padahal jelas ada di katalog. Kolom
   itu hanya terisi bila kasir memilih dari autocomplete; mengetik namanya sendiri tetap
   NULL. Panel yang menyuruh admin menambahkan sesuatu yang **sudah ada** lebih buruk
   daripada tidak ada panel. Ditutup dengan `NOT EXISTS` pembanding teks; 6 baris → 2 yang
   benar-benar asing.
2. **Penolakan teknisi sempat keluar sebagai 400 generik (T6).** `BusinessError` ditelan
   `catch` lama yang selalu membalas `400 INTAKE_FAILED`. Endpoint intake tertinggal karena
   ia **lebih tua dari `BusinessError` itu sendiri**. Sekarang 404 `TECHNICIAN_NOT_FOUND`.
3. **Tes lebar baris T7 menemukan bug cetak yang sudah lama ada.** Baris *"Barang diambil
   dengan menunjukkan"* panjangnya **33 karakter** di kertas 32 kolom — huruf terakhirnya
   terpotong di printer sungguhan **sejak tanda terima itu dibuat**. Ditemukan tes, bukan
   pembacaan ulang kode.
4. **`p8-global-search` ternyata lulus karena alasan yang salah.** Ia menuntut grup "Tiket"
   muncul untuk **Budi**, padahal seed hanya membuat tiket untuk **Andi**; selama ini `f7`
   kebetulan berjalan lebih dulu dan membuatkannya. Dibuktikan dengan menjalankannya
   sendirian di DB bersih → merah. Bentuk cacat yang sama yang berulang di seluruh riwayat
   ini: **tes yang memeriksa sesuatu "ada" tanpa memastikan siapa yang mengadakannya.**

**Bukti R1.8:** 304 unit (dari 288) · 21 e2e API · **Playwright 212/212 di DB bersih**
(dari 191, 21 baru) · `tsc` bersih · `svelte-check` 734 berkas 0 error. 24 titik fixture
intake di 10 spec diperbarui **menempuh jalan kasir sungguhan**, bukan dilonggarkan.

---

## Uji manual R1.8 oleh pemilik → kesimpulan: **"Ada yang harus diperbaiki dulu"**

**Dan ini putaran pertama yang tak punya satu pun poin GAGAL.** Ketujuh bagian (A–G)
dijalankan; semua yang R1.8 janjikan terbukti. Kesimpulannya tetap "perbaiki dulu", tapi
isinya berubah sifat: **lanjutan, bukan kegagalan** — lima dari enam catatan berbunyi
*"sudah benar, dan sekarang saya butuh …"*.

Yang terbukti jalan, dengan kalimat pemilik:

| Poin | Kalimat pemilik |
|---|---|
| A1–A3 | *"ya validasinya jalan — Merek unit wajib diisi. Bila mereknya tidak umum, ketik saja apa adanya"* |
| A4 | *"bisa menyimpan data meskipun smartphone tidak ada dalam katalog device"* |
| A5 | *"sandi statusnya optional bisa kosong bisa di isi"* |
| B1–B3 | *"bisa di lihat oleh kasir"*; *"jangan ada tombol edit di bagian tagihan"*; `/finance` dkk *"masih di tolak dan itu bagus"* |
| C2 | *"sudah benar… berarti untuk tampilan teknisi sudah fix"* |
| D2/D3 | Samsung berkatalog tak muncul di panel; merek asing yang sama dua kali tetap satu baris `2× masuk` |
| E1–E4 | antrian & langsung-bertuan keduanya jalan; *"jangan"* untuk kasir memindahkan tiket berjalan |
| F1–F4 | perkiraan tersimpan, teknisi melihatnya, biaya sungguhan di Intake tetap ditolak, tanpa perkiraan tak ada baris Rp0 |
| G1–G5 | keempat alur lama + pesan validasi masih utuh |

Enam catatan yang jadi isi **R1.9**:

| Poin | Kalimat pemilik | Sifatnya |
|---|---|---|
| **A6** 🔴 | *"di bagian mana saya bisa mengakses pelanggan saat menggunakan role kasir, tidak ada buttonnya jadi saya belum bisa mencoba bagian ini?"* | **Bug** — izin ada, menu tidak. Satu poin uji jadi tak bisa dijalankan sama sekali |
| **B1** | *"apakah bisa lebih detail, misalnya pelanggan itu mempunyai dua nota yang belum di bayar… di lihat sub totalnya nanti bisa di klik lagi untuk melihat detail per notanya"* | Lanjutan |
| **C1** | *"nomor antrian ini apakah per hari di reset atau terus increment? sebaiknya di reset tiap hari yang jadi triggernya nanti ketika buka kasir karena saya ingin ada fitur buka tutup kasir"* | Pertanyaan + **fitur baru** (FIN-002) |
| **D1** | *"sebaiknya ada tombol hapus di bagian katalog devicenya dan untuk UI dan UXnya juga harus di perbaiki"* | Lanjutan |
| **F2** | *"nanti teknisi bisa saja mengubah angka estimasi itu jika memang di temukan ada kerusakan yang lainnya"* | **Butuh keputusan** — menabrak pemisahan kolom yang T7 sengaja buat |
| **F5** | *"biarkan ini kasir yang memilih ada opsi cetak nota"* | Lanjutan |

Rencana penanganannya: [`R1.9-perbaikan-hasil-uji-R1.8.md`](R1.9-perbaikan-hasil-uji-R1.8.md).

---

## Yang menunggu R2 — dan satu hal yang menghalanginya

Terkumpul dari empat putaran uji, semuanya masih berlaku:

1. **Form per tahap**, bukan semua ditumpuk di halaman detail (uji-R1.5 E1, diulang
   uji-R1.6 B3: *"membingungkan cara inputnya"*).
2. **Tiket tidak boleh maju sebelum data tahapnya lengkap** (uji-R1.5 E3).
3. **Alur baru:** *"setelah diagnosis tiket kembali di berikan kepada kasir yang nantinya
   bisa memilih alurnya dan pemberian nota service juga dari kasir sehingga nota yang
   keluar ke pelanggan bukan dari teknisi melainkan dari kasir"*.
4. **Tombol "minta pindah teknisi"** — pemilik: *"bisa di assign oleh manager bisa di
   ambil oleh teknisi lain"*.
5. **Laporan bulanan teknisi:** *"unit berhasil unit gagal unit garansi sisa pekerjaan"*.
6. **Teknisi tidak melihat harga modal**, hanya harga jual.

**Yang menghalangi:** butir 2 menuntut satu masukan pemilik yang belum diberikan —
**apa yang wajib terisi di tiap tahap sebelum tiket boleh maju.** Pertanyaannya sudah
diajukan **empat kali**: dua kali sebagai tabel kosong (akhir `uji-R1.6-perbaikan.md` dan
`uji-R1.7-perbaikan.md`), lalu dua kali sebagai usul-tinggal-centang
(`R1.8-perbaikan-hasil-uji-R1.7.md` dan `uji-R1.8-perbaikan.md`) setelah disimpulkan bahwa
tabel kosong menuntut pemilik merancang aturan dari nol. Keempatnya belum dijawab.

**Baris pertamanya sebenarnya sudah terjawab tanpa tabel** — pemilik menulisnya sambil
menguji di uji-R1.7 D1 (*"buat keluhan / kerusakan jadi kolom wajib di isi"*), R1.8-T1
menegakkannya, dan pemilik sendiri sudah mengujinya lulus di R1.8 poin A. Jadi yang benar-
benar tersisa hanya **empat baris**: Diagnosa, Pengerjaan, QC, Serah Terima.

Menebaknya lalu menegakkan tebakan itu **persis kesalahan yang S5 sudah pernah buat dan
cabut**: gerbang penagihan sempat dipasang berdasarkan `allowsInvoicing` hasil backfill,
lalu dicabut setelah 2 tes e2e menabraknya dan ternyata tes-nya yang benar.

| Tahap | Wajib terisi sebelum boleh lanjut? |
|---|---|
| Terima Unit (Intake) | nama + no. HP + keluhan? sandi/pola? |
| Diagnosa | hasil diagnosa? perkiraan biaya? perkiraan lama pengerjaan? |
| Pengerjaan | catatan pengerjaan? suku cadang yang dipakai? |
| QC | semua baris checklist tercentang, atau boleh sebagian? |
| Selesai / Serah Terima | nota sudah dibuat? lunas, atau boleh ada sisa? |

---

## Hal yang belum bisa diuji siapa pun

**Cetak label otomatis dengan printer fisik** (uji-R1.5 D5, uji-R1.6 tidak menyentuhnya,
uji-R1.8 F5 dilewati dengan sadar). Jalur cetaknya dibangun dan diuji tanpa hardware sejak
Phase 6; "kertas benar-benar keluar dan terpotong" hanya bisa dibuktikan di perangkat asli.
Checklist di `printer-agent/README.md`. Sama statusnya dengan 6D.1.

**Dan satu lagi yang lebih luas, dicatat di sini supaya tidak hilang bersama berkasnya:**
seluruh sisi aplikasi di luar servis & peran — **stok, pembelian, supplier, keuangan,
cetak, setelan** — **belum pernah diuji pemilik secara menyeluruh.** Itu tujuan
`uji-00-kondisi-sekarang.md` (~150 poin), yang ditulis 2026-07-31 dan **tak pernah
dijalankan satu poin pun** (0 dari ~150 tercentang) karena uji per-fase selalu lebih
mendesak. Berkasnya dihapus 2026-08-04 — premisnya sudah usang (ia masih menulis "kasir
tidak bisa membuat tiket", yang R1 perbaiki) — tapi **kenyataan bahwa area itu belum
teruji tetap berlaku** dan tidak boleh ikut terhapus. Rumahnya sekarang: pilot (Milestone
B2.6) dan checklist per-fase saat area itu benar-benar disentuh.

---

## Berkas yang dihapus dari `plan/`

Konvensi folder ini: sebuah berkas rencana hidup **hanya selama tugasnya aktif**. Yang
durable pindah ke `PHASES.md` + berkas ini; teks aslinya tetap utuh di git history.

### Gelombang 1 — 2026-08-01 (5 berkas)

`uji-R1-peran-akses.md`, `R1.5-perbaikan-hasil-uji-R1.md`, `uji-R1.5-perbaikan.md`,
`R1.6-perbaikan-hasil-uji-R1.5.md`, `uji-R1.6-perbaikan.md` — ceritanya ada di bagian
R1 / R1.5 / R1.6 di atas.

### Gelombang 2 — 2026-08-04 (4 berkas)

| Berkas | Kenapa dihapus | Isinya ke mana |
|---|---|---|
| `uji-R1.7-perbaikan.md` | Sudah diisi pemilik, R1.8 sudah menutup seluruh temuannya | Bagian **"Uji manual R1.7"** di atas — 14 poin lulus + 4 catatan + tiga kalimat yang jadi definisi R2 |
| `R1.8-perbaikan-hasil-uji-R1.7.md` | Rencana R1.8; T1–T7 selesai & sudah diuji pemilik | Bagian **"Fase R1.8"** di atas, termasuk empat temuan yang hanya ketahuan dengan menjalankannya |
| `uji-R1.8-perbaikan.md` | Sudah diisi pemilik; jadi sumber R1.9 | Bagian **"Uji manual R1.8"** di atas + [`R1.9-perbaikan-hasil-uji-R1.8.md`](R1.9-perbaikan-hasil-uji-R1.8.md). Teks aslinya di commit `a87291d` |
| `uji-00-kondisi-sekarang.md` | **Tak pernah dijalankan** (0 dari ~150 poin) dan premisnya usang | Paragraf di atas — yang penting bukan checklistnya, melainkan **fakta bahwa area itu belum teruji** |

**Urutannya penting, dan sengaja begitu:** tiap catatan uji **di-commit lebih dulu**, baru
berkasnya dihapus. Jadi kalimat asli pemilik — bagian paling berharga dari seluruh proses
ini, karena tiap bug di riwayat ini ditemukan dengan **memakai** aplikasinya — tetap bisa
dibaca kata per kata kapan pun.
