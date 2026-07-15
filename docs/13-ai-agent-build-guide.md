# Panduan Membangun Aplikasi dengan AI Agent

Dokumen ini untuk Anda secara spesifik: level coding dasar, dibantu AI agent (Claude Code atau sejenisnya), kuat di JavaScript. Tujuannya bukan cuma menyelesaikan proyek, tapi juga supaya Anda bisa belajar bertahap dari kode yang dihasilkan.

## Peran Anda vs AI Agent

| | Tugas |
|---|---|
| **AI Agent** | Menulis kode, membuat migrasi database, menjalankan test |
| **Anda** | Memastikan *perilaku* aplikasi sesuai bisnis (bukan mengevaluasi kode baris per baris), mencoba aplikasi secara langsung, meminta penjelasan untuk belajar |

Anda **tidak perlu** bisa membaca kode dengan lancar untuk mengarahkan proyek ini dengan baik — yang penting Anda tahu **apa yang seharusnya terjadi** (dan dokumentasi di `docs/` sudah menjelaskan itu).

## Sebelum Mulai: Checklist

- [ ] Sudah baca `docs/02`, `04`, `05`, `06`, `10` minimal sekali
- [ ] `db/schema.ts` dan `drizzle.config.ts` sudah ada (sudah disiapkan)
- [ ] Node.js, PostgreSQL (atau Docker), dan VS Code sudah terpasang
- [ ] Python sudah terpasang (untuk printer agent, Fase 4b)
- [ ] Tahu cara menjalankan AI agent pilihan di folder proyek

## Urutan Membangun — Jangan Loncat Tahap

Bangun **1 alur utuh dulu** sebelum melebar ke banyak fitur. Kalau langsung membangun semua modul sekaligus, akan sangat sulit bagi Anda untuk tahu bagian mana yang salah ketika terjadi error.

### Fase 0 — Setup Proyek
> Prompt contoh: *"Baca docs/10-tech-stack-infra.md. Buatkan project Hono baru bernama flowserv-api dengan Drizzle ORM. Salin db/schema.ts dan drizzle.config.ts yang sudah saya siapkan ke project ini, lalu jalankan migrasi database dengan drizzle-kit."*

**Verifikasi:** jalankan `npx drizzle-kit studio` — akan terbuka tampilan visual seperti spreadsheet untuk melihat semua tabel. Ini cara termudah cek struktur database tanpa baca SQL.

### Fase 1 — Flow Engine (Jantung Produk)
> Prompt contoh: *"Baca docs/02-architecture-modular.md dan docs/04-workflow-service-ticket.md. Buatkan modul flow-engine yang bisa: baca FlowTemplate + FlowNode dari database (pakai Drizzle), validasi perpindahan node berdasarkan FlowTransition, dan catat setiap perpindahan ke TicketStageHistory. Sertakan unit test untuk validasi ini."*

Bagian ini paling kompleks dan paling berisiko — kalau salah, semua modul lain ikut salah. **Selalu minta unit test di fase ini.**

### Fase 2 — Vertical Slice: 1 Alur Utuh
> Prompt contoh: *"Baca docs/04 dan docs/05. Buatkan route Hono untuk: buat tiket → reserve part → tandai part terpakai (ambil dari stock_batches dengan FIFO, batch tertua dulu) → buat invoice POS → catat pembayaran → posting ke finance ledger. Boleh pakai 1 Flow Template default saja dulu, skip Customer Approval dan Quality Control. Validasi input pakai Zod."*

**Verifikasi:** coba lewat Postman/Thunder Client satu-satu urutan API-nya, cek di Drizzle Studio apakah stok & batch berkurang sesuai urutan FIFO, invoice muncul, ledger tercatat.

### Fase 3 — RBAC Enforcement + Audit Log
> Prompt contoh: *"Baca docs/03-rbac-roles.md dan docs/11-non-functional-requirements.md. Buatkan middleware Hono requirePermission(code) untuk cek izin, DAN middleware auditLog yang otomatis mencatat setiap aksi mutasi (siapa, aksi apa, entitas mana) ke tabel audit_logs. Pasang keduanya di setiap route yang relevan."*

Digabung jadi 1 fase karena keduanya sama-sama cross-cutting middleware — lebih efisien dibangun bersamaan daripada terpisah.

**Verifikasi:** coba akses endpoint dengan role berbeda (harus kena 403 kalau tidak berhak), lalu cek di Drizzle Studio apakah baris baru muncul di `audit_logs` setiap kali ada aksi.

### Fase 4 — UI Inti (SvelteKit)
Bangun: Ticket Kanban Board (`svelte-dnd-action`), Ticket Detail, Inventory Dashboard, Katalog Produk, Pencarian Global, POS/Kasir Screen (dengan toggle Mode Simpel/Akuntan untuk Finance). Rujuk `docs/08-ui-ux.md`.

### Fase 4b — Printer Dasar (Python, BELUM termasuk Builder)
> Prompt contoh (sesi terpisah): *"Baca docs/14-printer-integration.md. Buatkan Flask app kecil dengan endpoint POST /print yang menerima document_type + data, dan mencetak pakai 1 template default hardcoded per ukuran kertas (58mm/80mm) lewat python-escpos. Belum perlu UI untuk edit template — itu di fase berikutnya."*

**Verifikasi:** jalankan agent lokal, kirim request test lewat Postman, cek printer fisik mencetak dengan benar.

### Fase 5 — Builder UIs (Tunda Sampai Fase 1–4b Stabil)
Dua builder yang sama-sama sebaiknya ditunda sampai mesin di baliknya teruji:
- **Flow Template Builder**: mulai dari form/JSON editor sederhana, baru upgrade ke drag-and-drop.
- **Printer Template Builder**: editor field + preview WYSIWYG (kode render sama dengan yang dipakai cetak asli — lihat prinsip di `docs/14-printer-integration.md`), plus UI untuk atur Printer Assignment per jenis dokumen.

### Fase 6 — Fitur MVP Lainnya
Ikuti checklist 🟢 di `docs/07-features.md` satu per satu.

### Fase 7 — Pilot
Coba ke 1 tenant/bisnis nyata dulu sebelum menambah fitur skala enterprise (multi-gudang, dsb.).

## Cara Memberi Instruksi ke AI Agent

1. **Selalu suruh baca dokumen relevan dulu** — sebutkan path filenya di prompt, jangan andalkan agent menebak konteks bisnis.
2. **Minta perubahan kecil**, bukan banyak sekaligus — 1 modul per sesi, supaya Anda bisa ikuti prosesnya.
3. **Selalu minta unit test** — karena Anda belum bisa membaca logic dengan cepat, test adalah "bukti" bahwa logic-nya benar.
4. **Minta penjelasan bahasa sederhana** — contoh: *"Jelaskan kode ini seolah saya baru belajar coding."*
5. **Jalankan dulu sebelum lanjut** — jangan approve perubahan besar tanpa mencobanya langsung.

## Cara Verifikasi Tanpa Perlu Jago Baca Kode

| Alat | Kegunaan |
|---|---|
| **Drizzle Studio** (`npx drizzle-kit studio`) | Lihat isi database secara visual (seperti Excel) |
| **Postman / Thunder Client** | Coba API secara manual, lihat responsnya |
| **Aplikasi berjalan di browser** | Cara paling penting — coba skenario nyata sebagai user |
| **Unit test yang dijalankan AI agent** | Kalau semua lulus, minimal logic dasarnya benar |

## Kalau AI Agent Menyimpang dari Dokumentasi

Rujuk balik ke dokumen relevan di `docs/`, minta agent membaca ulang sebelum lanjut. Dokumentasi adalah sumber kebenaran — kalau ada perbedaan antara yang dibangun dan yang tertulis, diskusikan dulu apakah dokumennya yang perlu update atau kode-nya yang salah.

## Setelah Dokumentasi Ini: Jangan Buka Diskusi Baru Tanpa Alasan Konkret

Dokumentasi di folder ini sudah final. Mulai sekarang, pertanyaan desain baru sebaiknya muncul **karena Anda sedang membangun sesuatu dan mentok**, bukan karena ingin mempertimbangkan ulang keputusan yang sudah dikunci. Itu tandanya diskusi tersebut memang perlu dan konkret, bukan menunda proses.
