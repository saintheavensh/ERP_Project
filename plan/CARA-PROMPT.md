# Cara Memberi Prompt ke AI Agent untuk Mengerjakan Folder `plan/`

> Tiap file `H*.md` sudah ditulis supaya **self-contained** — isinya tujuan, alasan, file
> yang disentuh, langkah, verifikasi, dan jebakan. Jadi prompt-nya justru harus **pendek**.
> Tugas prompt bukan menjelaskan ulang task-nya, tapi memasang pagar di sekelilingnya.

---

## Template utama (pakai ini 90% waktu)

```
Baca @plan/H1-delete-dead-schema.md dan kerjakan sampai selesai.

Aturan:
- Ikuti CLAUDE.md dan specification/coding-guidelines.md.
- Kerjakan HANYA task ini. Jangan lanjut ke task berikutnya.
- Selesai = semua checkbox di bagian "Verification" terbukti dengan output nyata
  (test lolos / response API / click-path yang benar-benar dijalankan).
  Kode yang "kelihatannya benar" belum selesai.
- Kalau ada checkbox yang tidak bisa kamu buktikan, katakan apa adanya dan
  tandai [/] bukan [x]. Jangan tebak.
- Selesai verifikasi: update checklist di plan/README.md, lalu commit dengan
  conventional commit.
```

Ganti nama file-nya saja untuk task lain. Itu sudah cukup.

### Kenapa tiap baris ada

| Baris | Mencegah |
|---|---|
| `@plan/H1-...` | agent menebak isi task dari judulnya saja |
| "Ikuti CLAUDE.md" | agent memakai pola arsitektur karangannya sendiri |
| "HANYA task ini" | agent lanjut ke H2, H3 dan menumpuk perubahan yang sulit di-review |
| "Verification terbukti" | **ini yang paling penting** — lihat di bawah |
| "tandai [/] bukan [x]" | centang palsu, persis yang bikin audit 2026-07-20 terjadi |
| "commit" | pekerjaan menumpuk jadi satu commit raksasa |

### Soal baris "Verification"

`PHASES.md` pernah punya **tujuh** task bercentang `[x]` untuk kode yang tidak pernah
ditulis. Semuanya ditulis dengan niat baik oleh orang yang baru selesai menulis kodenya dan
belum pernah menjalankannya.

Itulah kenapa tiap file `H*.md` punya bagian **Verification** yang konkret, dan kenapa
baris itu wajib ada di prompt. Tanpa itu, agent akan bilang "sudah selesai" begitu kode
selesai diketik — bukan begitu selesai terbukti jalan.

---

## Varian prompt

### Untuk task besar (H7, H11, H12) — minta rencana dulu

H7, H11, dan H12 adalah task ukuran **L**. Untuk yang ini, jangan langsung suruh koding:

```
Baca @plan/H7-ticket-charges.md.

Jangan menulis kode dulu. Jelaskan dulu:
1. Urutan langkah yang akan kamu ambil
2. File apa saja yang akan dibuat/diubah
3. Bagian mana yang menurutmu paling berisiko

Setelah saya setujui, baru kerjakan.
```

Gunanya: kalau agent salah paham, kamu tahu sebelum ada 500 baris kode yang harus dibuang.
Untuk task S dan M, ini tidak perlu — malah memperlambat.

### Melanjutkan task yang belum selesai

```
Lanjutkan @plan/H7-ticket-charges.md.

Cek dulu apa yang sudah ada di kode sekarang, jangan mengulang yang sudah jadi.
Laporkan checkbox Verification mana yang sudah lolos dan mana yang belum,
sebelum melanjutkan.
```

Baris "cek dulu" penting — tanpa itu agent sering menulis ulang dari nol.

### Review setelah task selesai

Jalankan di sesi **baru** (`/clear` dulu), supaya agent tidak me-review pekerjaannya
sendiri dengan asumsi yang sama:

```
Review commit terakhir terhadap @plan/H1-delete-dead-schema.md.

Cek satu per satu:
- Apakah semua checkbox Verification benar-benar terpenuhi?
- Ada checkbox yang ditandai [x] tapi bukti sebenarnya tidak ada?
- Ada yang dikerjakan di luar scope task ini?

Jangan perbaiki apa pun. Laporkan saja temuannya.
```

Atau langsung pakai `/code-review` yang sudah tersedia di Claude Code.

### Kalau agent nyasar

```
Berhenti. Kamu keluar dari scope @plan/H4-constraints.md.

Yang diminta task itu hanya: [sebutkan]. Yang kamu kerjakan: [sebutkan].
Kembalikan perubahan di luar scope, lalu selesaikan task aslinya.
```

Lebih baik hentikan lebih awal daripada membiarkan dan membereskan belakangan.

---

## Kebiasaan yang bikin hasilnya jauh lebih baik

**`/clear` di antara task.** Tiap task adalah pekerjaan terpisah. Konteks H1 tidak membantu
H2, malah bikin agent bingung dan boros. Bersihkan, lalu mulai task berikutnya bersih.

**Satu task = satu commit = satu sesi.** Kalau satu task tidak muat dalam satu sesi, itu
tanda task-nya kebesaran — pecah. H7 sudah ada catatan cara memecahnya di dalam filenya.

**Jalankan `npm run db:reset` sendiri sesudahnya.** Jangan percaya laporan "seed berhasil"
begitu saja. Perintahnya cepat, dan kamu langsung tahu kalau ada yang rusak.

**Buka aplikasinya.** Beberapa kerusakan (file relations Drizzle, mounting route) tidak
ketahuan oleh `tsc` maupun `npm test` — hanya muncul saat halaman dibuka. Bagian
Verification sudah menyebut click-path untuk kasus-kasus ini; benar-benar jalankan.

**Urutan itu ada alasannya.** H9 butuh H7. H11 butuh H6. H10 butuh H4. Kalau lompat, agent
akan membangun di atas skema yang sebentar lagi berubah. Urutan di
[README.md](./README.md) bukan saran.

---

## Yang sebaiknya dihindari

**Jangan gabung beberapa task.** "Kerjakan H1 sampai H5 sekalian" menghasilkan satu commit
besar yang tidak bisa di-review dan tidak bisa di-revert per bagian.

**Jangan tempel isi task file ke prompt.** Sudah ada di repo — cukup `@plan/H1-...`. Menempel
manual bikin dua versi yang bisa beda.

**Jangan bilang "buat production-ready" atau "buat sebaik mungkin".** Terlalu kabur; agent
akan menambah hal yang tidak diminta. Bagian Verification sudah mendefinisikan "cukup baik"
secara spesifik.

**Jangan minta lanjut kalau verifikasi belum lolos.** Kalau agent bilang "3 dari 8 checkbox
belum terbukti", itu bukan hampir selesai. Itu belum selesai.

---

## Contoh nyata: mulai besok

Task pertama adalah [H0](./H0-seed-and-reset.md) — seed lengkap dan `db:reset`. Ukuran M,
dan hasilnya dipakai semua task setelahnya, jadi layak dikerjakan pelan-pelan.

```
Baca @plan/H0-seed-and-reset.md dan kerjakan sampai selesai.

Aturan:
- Ikuti CLAUDE.md dan specification/coding-guidelines.md.
- Kerjakan HANYA task ini.
- Perhatian khusus: bagian "Data yang wajib ada" tidak boleh dipangkas.
  Terutama item multi-batch dengan harga berbeda dan item dengan stok 1 pcs —
  dua itu yang bikin FIFO dan reservasi bisa dites nanti.
- Selesai = semua checkbox "Verifikasi" terbukti dengan output nyata.
  Jalankan `npm run db:reset` dua kali dan tunjukkan hasilnya.
- Kalau ada yang tidak bisa dibuktikan, tandai [/] dan katakan apa yang kurang.
- Setelah lolos: update checklist di plan/README.md, lalu commit.
```

Setelah itu tinggal ganti nama file untuk H1, H2, dan seterusnya.
