# Fase R2 — Halaman Tiket Menyesuaikan Peran

> **Dibuka 2026-08-06**, setelah pemilik menutup R1.11 dengan **18/18 `OK`** dan menulis
> *"Spertinya kita lanjut ke R2"*.
>
> Rencana induknya [`tahap-b-peran-dan-qc.md`](tahap-b-peran-dan-qc.md) bagian **FASE R2**
> (Task R2.1–R2.4). Berkas ini adalah rencana **kerja**-nya: urutan, bukti yang harus ada,
> dan hal-hal yang sudah diperiksa ke kode supaya tidak ditemukan setengah jalan.

---

## Kenapa fase ini ada

Keluhan aslinya pemilik, tiga putaran uji berturut-turut, dengan kata yang berbeda-beda:

> *"teknisi jadi bingung harus mengisi yang mana"* (uji R1.5 E1)
> *"buat per step jadi tiap step itu ada requirement data yang harus di isi, nanti si
> teknisinya tinggal next next next jadi tidak bingung"*
> *"teknisi masih bisa edit keluhan Pola dan lainnya di halaman detail"* (uji R1.10 A7)

Yang ketiga sudah ditambal di R1.11 — **tiga tombol** disembunyikan. R2 mengerjakan yang
sebenarnya: halaman tiket berhenti menjadi layar Super Admin yang dipangkas seadanya.

**R2 terkunci lima fase lamanya** oleh satu butir yang hanya pemilik bisa jawab (apa yang
wajib terisi di tiap tahap). Dijawab 2026-08-04. **Dan ia terkunci sekali lagi tanpa
disadari siapa pun**: aturan *"Diagnosa wajib terisi sebelum lanjut"* mustahil ditegakkan
selama **teknisi tidak bisa menyimpan diagnosa sama sekali** — bug yang baru ketahuan saat
merencanakan R1.11 dan diperbaiki di sana. Jadi R2 baru benar-benar bisa dikerjakan
sekarang, bukan 2026-08-04.

---

## Urutan kerja (dan kenapa urutannya begitu)

Berbeda dari fase R1.x yang tugasnya sejajar, empat task R2 **berantai** — masing-masing
memakai hasil sebelumnya.

```
R2.1  pecah TicketWorkspace          → refactor MURNI, tampilan tak berubah sedikit pun
  ↓
R2.2  lapisan "peran ini lihat apa"  → fungsi murni + tes, baru disambungkan
  ↓
R2.4  gerbang "data tahapnya lengkap" → BACKEND dulu, layar per tahap menyusul
  ↓
R2.3  tes per peran + regresi         → menutup ketiganya
```

**R2.4 sengaja didahulukan dari R2.3**: gerbangnya adalah aturan bisnis yang harus ditolak
API, dan tes per-peran (R2.3) akan menyentuh layar yang bentuknya baru selesai setelah
R2.4. Menulis tesnya lebih dulu berarti menulisnya dua kali.

---

## Task R2.1 — Pecah `TicketWorkspace` jadi komponen-bagian

- [ ] `lib/components/tickets/sections/`: `CustomerDeviceSection`, `PrintSection`,
      `DiagnosisSection`, `TechnicianSection`, `ChargesSection`, `ChecklistSection`,
      `StageSection`
- [ ] `TicketWorkspace.svelte` jadi **penyusun**, bukan perender

**Aturan yang mengikat task ini:**

1. **Ini refactor murni.** Setelah selesai, tampilan Super Admin harus **identik**.
   Buktinya: `p4-ticket-detail-polish.spec.ts` dan `intake-to-close.spec.ts` lulus **tanpa
   satu baris pun di spec itu diubah**. Kalau spec-nya harus disunting, ini bukan refactor
   lagi dan harus dihentikan.
2. **Jangan pecah `TicketDetailState`** di fase ini. Memecah tampilan dan memecah state
   sekaligus membuat kegagalan sulit dilacak.

**Sudah dihitung ulang ke berkasnya hari ini, karena angka di rencana induk sudah basi —
dan meleset ke arah yang berbahaya (mengira pekerjaannya lebih kecil dari kenyataan):**

| | Rencana induk | **Sebenarnya (2026-08-06)** |
|---|---|---|
| `TicketWorkspace.svelte` | 440 baris | **543** |
| `ticket.detail.svelte.ts` | 753 baris | **855** |

Tabel "bagian & nomor baris" di rencana induk ikut bergeser ~100 baris. **Jangan dipakai
sebagai peta — baca berkasnya.**

---

## Task R2.2 — Lapisan "apa yang boleh dilihat peran ini"

- [ ] Satu berkas **murni**: `lib/states/tickets/ticket-view.ts` —
      `ticketSectionsFor(roleName, ticket) → { showDiagnosis, canAssignOthers, … }`
- [ ] `TicketWorkspace` memakai hasilnya untuk memutuskan bagian mana yang **dirender**
- [ ] Tes unit di `vitest.config.ts` frontend (yang sengaja tak memuat plugin SvelteKit —
      begitu fungsi ini butuh `$lib` atau rune, ia bukan logika murni lagi)

**Ini bagian paling mudah dirusak di seluruh R2:**

- **Menyembunyikan tombol bukan keamanan.** Backend tetap satu-satunya gerbang. Fungsi ini
  hanya boleh menyembunyikan yang backend **memang akan tolak**.
- Tiap baris harus bisa ditunjuk ke **permission backend** yang bersangkutan. Baris tanpa
  pasangan di backend = tanda desainnya belum benar. Ini pelajaran R1.10-T3/T4, yang
  membuat dua izin baru justru supaya aturan frontend punya padanan nyata.
- Peran `'no-role'` dapat tampilan **paling sempit**, bukan error.

**Modal yang sudah ada dan harus dipakai ulang, bukan ditulis ulang:**
`lib/auth/capabilities.ts` (R1.11) sudah memetakan peran → boleh-tidaknya menyunting kolom
intake, dan `lib/auth/route-access.ts` memetakan peran → halaman. `ticket-view.ts` adalah
lapisan ketiga di keluarga yang sama; kalau ia mulai menyalin isi keduanya, gabungkan.

---

## Task R2.4 — Form per tahap + gerbang "data tahapnya lengkap" 🔓

Aturan yang **sudah** pemilik setujui tanpa koreksi (2026-08-04):

| Tahap | Wajib sebelum tombol lanjut boleh ditekan | Status |
|---|---|---|
| **Terima Unit** (kasir) | nama, no. HP, jenis+merek+model, keluhan. Sandi/pola **tidak** | ✅ R1.8-T1, sudah diuji lulus |
| **Diagnosa** (teknisi) | hasil diagnosa **+ perkiraan biaya**. Lama pengerjaan **tidak** | ⏳ |
| **Pengerjaan** (teknisi) | **tidak ada yang wajib** | ⏳ |
| **QC** | **semua** baris checklist terjawab | ⏳ (lihat batasan di bawah) |
| **Selesai / Serah Terima** (kasir) | nota sudah dibuat. **Boleh ada sisa** (tempo) | ⏳ |

- [ ] Gerbang ditegakkan di **`POST /v1/tickets/:id/transition`**, bersebelahan dengan
      `assertStageAllows()` milik S5 → **422 `STAGE_REQUIREMENTS_NOT_MET`** yang **menyebut
      apa yang kurang**, bukan penolakan bisu
- [ ] Aturannya **diturunkan dari `stage_kind`**, bukan sakelar bebas per tahap — supaya
      tahap yang disisipkan lewat editor alur ikut benar tanpa dikonfigurasi ulang
- [ ] Fungsi murni + tes unit **sebelum** disambungkan ke HTTP, satu tes per baris tabel
- [ ] Ditolak **via curl** sebagai peran yang sebenarnya, bukan cuma tombolnya mati
- [ ] Layar per tahap ("sekarang tahap apa, isi apa", bisa **next & prev**) dibangun **di
      atas** gerbang yang sudah jalan — bukan sebaliknya

**⚠️ Satu baris tabel ini belum bisa berarti apa-apa hari ini, dan itu harus dikatakan apa
adanya ke pemilik:** "QC: semua baris terjawab" menuntut jawaban bisa dibedakan antara
*belum diperiksa* dan *diperiksa, hasilnya jelek*. Hari ini keduanya sama-sama
`checked: false`. Sampai **R3** memisahkannya, gerbang QC hanya bisa menuntut **"tiap baris
sudah disentuh"** — dan itu **tidak boleh dilaporkan sebagai "QC lulus"**.

**Aturan penegakan (S5, sudah dibayar sekali):** jangan menegakkan tebakan. Gerbang
penagihan pernah dipasang berdasarkan `allowsInvoicing` hasil backfill, lalu dicabut karena
2 tes e2e menabraknya dan **tes-nya yang benar**. Tabel di atas bukan tebakan — pemilik
menyetujuinya kalimat per kalimat — tapi apa pun **di luar** tabel itu adalah tebakan.

---

## Task R2.3 — Tes

- [ ] `e2e/tahap-b-tiket-per-peran.spec.ts`: untuk tiap peran, buka **tiket yang sama** dan
      buktikan bagian yang seharusnya ada memang ada, dan yang tidak seharusnya **tidak ada
      di DOM** (bukan sekadar tak terlihat)
- [ ] Satu tes khusus: **teknisi tidak melihat dropdown "tugaskan teknisi lain"** — tombol-403
      yang jadi alasan fase ini ada
- [ ] Jalankan ulang: `p4-ticket-detail-polish`, `intake-to-close`, `tahap-b-qc-checklist`,
      `tahap-a-change-order`, `tahap-b-pos-service-flow`

**Dua aturan tes yang mengikat sejak R1.10 & R1.11, dan keduanya lahir dari bug nyata:**

1. **Kalau aturannya tentang sesuatu yang ORANG lakukan, tesnya wajib MENEKAN TOMBOLNYA.**
   Panggilan API boleh menemani, tidak boleh menggantikan. (R1.10-T1: backend benar selama
   sebulan, kontrolnya tidak pernah dibuat, tesnya memanggil `page.request.patch`.)
2. **Tes yang menekan tombol harus menekannya SEBAGAI PERAN YANG AKAN MENEKANNYA.**
   (R1.11-T1: setiap tes diagnosa berjalan sebagai Super Admin, yang **melewati seluruh
   RBAC** — jadi selama empat hari tesnya menguji jalur yang tidak pernah dilewati teknisi.)

---

## Definition of Done R2

- tampilan Super Admin tak berubah — dibuktikan **spec lama lulus tanpa diedit**
- spec per-peran lulus
- gerbang tahap **ditolak via curl** sebagai peran sungguhan, bukan cuma tombolnya mati
- `tsc` bersih · `svelte-check` 0 error · unit backend & frontend hijau
- **checklist uji manual R2 dijalankan pemilik** ← gerbang R3

---

## Yang TIDAK dikerjakan di R2, supaya tidak dicari

1. **QC jadi modul sendiri** (template QC berkategori, ✓/✗, dipakai ulang) — **R3**.
2. **Retur pelanggan & supplier** — **R5**.
3. **Buka/Tutup Kasir (FIN-002)** — **R6**, keputusan pemilik: setelah R2.
4. **Realtime/WebSocket** — pemilik memilih penyegaran berkala; jedanya jadi **5 detik**
   di R1.11-T7.
5. **Audit `new XState(data)` di 19 halaman** — **R4**.

## Yang MASUK R2 karena ditunda ke sini, jangan sampai hilang lagi

- **Device dipilih dari riwayat pelanggan saat intake** + riwayat pekerjaan per device +
  **hapus fitur tambah device di halaman pelanggan** (*"agar alurnya lebih rapi dan tidak
  ada kebingungan"*) — uji R1.9 poin A3, disetujui pemilik 2026-08-05. Bahannya sudah ada:
  `GET /v1/customers/:id/assets` jalan, dan intake sudah menerima `?customerId=&assetId=`.
- **Alur "setelah diagnosis tiket kembali ke kasir, nota servis juga dari kasir"** — uji R1.6.
- **Tombol minta pindah teknisi** dan **laporan bulanan teknisi** (unit berhasil / gagal /
  garansi / sisa) — terkumpul dari empat putaran uji.
- **Teknisi tidak melihat harga modal.**
