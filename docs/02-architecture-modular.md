# Arsitektur Inti: Modular Workflow Engine

Dokumen ini menjelaskan **konsep arsitektur** di balik diferensiator utama produk: kenapa dan bagaimana alur Inventory dan Service dibuat modular.

## Prinsip Utama

> **Alur kerja = konfigurasi (data), bukan logika yang di-hardcode di kode aplikasi.**

Konsekuensinya:
- Menambah jenis servis baru = membuat/mengubah Flow Template, bukan menulis kode baru.
- Setiap tenant (dan bahkan setiap cabang) bisa punya SOP berbeda di atas mesin yang sama.
- Developer & AI agent membangun *engine* yang menjalankan flow, bukan membangun flow itu satu per satu secara hardcoded.

## Building Block: Flow Template & Flow Node

| Konsep | Penjelasan | Contoh |
|---|---|---|
| **Flow Template** | Definisi urutan stage/node untuk satu jenis proses (servis atau inventory) | "Standard Repair Flow", "Express Service Flow", "Warranty Claim Flow" |
| **Flow Node (Stage)** | Satu langkah dalam Flow Template — punya input/output, role yang berhak eksekusi, dan event yang di-emit | "Diagnosis", "Customer Approval", "Parts Reservation" |
| **Transition Rule** | Syarat pindah dari satu node ke node berikutnya | "Tidak bisa masuk 'Repair In Progress' sebelum 'Customer Approval' = approved" |
| **Trigger/Event** | Aksi otomatis yang terjadi saat node berubah status | Node "Parts Consumed" → trigger stock deduction + finance journal entry |

Setiap node bersifat RBAC-gated: node punya daftar role yang boleh mengeksekusinya (detail di [03-rbac-roles.md](./03-rbac-roles.md)).

## Kenapa Ini Berbeda dari Aplikasi Kebanyakan

Aplikasi service center pada umumnya menyatukan "urutan proses" dengan "kode aplikasi" — sehingga urutan Intake → Diagnosis → Quote → Repair → QC → Invoice itu tetap, tidak bisa diubah tanpa request fitur ke vendor.

Di FlowServ, urutan itu hanyalah **satu Flow Template default** yang bisa:
- Di-clone dan dimodifikasi per tenant
- Punya varian per jenis servis (servis express vs servis kompleks vs klaim garansi)
- Ditambah/dikurangi node-nya lewat UI konfigurasi (lihat [08-ui-ux.md](./08-ui-ux.md) bagian "Flow Template Builder"), bukan lewat request ke developer

## Event-Driven Core: Satu Sumber Kebenaran

Alih-alih Inventory, POS, dan Finance sebagai 3 modul terpisah yang "sinkron" secara berkala, ketiganya adalah **subscriber** dari event yang di-emit oleh Service Ticket dan Inventory Flow.

```
[Service Ticket State Change] ──emit──> [Event Bus]
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    ▼                       ▼                       ▼
            [Inventory Engine]       [Finance Ledger]           [POS/Invoice]
            (reserve/consume          (job costing real-time,   (generate invoice,
             stock)                    COGS, revenue)            catat pembayaran)
```

Contoh konkret: teknisi menandai part "Layar LCD" sebagai *used* di tiket →
1. **Inventory**: stok Layar LCD berkurang 1, status reservasi jadi "consumed"
2. **Finance**: dicatat sebagai COGS di ledger tiket tersebut, margin tiket ter-update otomatis
3. **POS**: harga part otomatis masuk ke draft invoice tiket

Tidak ada proses "sinkronisasi malam hari" atau rekonsiliasi manual bulanan untuk hal ini.

## Multi-Tenancy

- **Tenant** = 1 perusahaan pelanggan SaaS. **Keputusan final:** shared database (satu database untuk semua tenant), setiap tabel domain punya kolom `tenant_id`, diperkuat PostgreSQL Row-Level Security (RLS) sebagai lapisan isolasi kedua. Lebih sederhana dibangun & dirawat dibanding schema-per-tenant — migrasi ke skema/database terpisah bisa dipertimbangkan nanti kalau ada klien enterprise yang mewajibkan dedicated infrastructure.
- **Branch** = cabang di dalam 1 tenant. Flow Template bisa di-override per branch (misal cabang flagship pakai flow lebih detail, cabang kecil pakai flow simpel).
- **Platform Super Admin** (di luar tenant manapun) mengelola provisioning tenant baru, billing, dan monitoring platform — bukan bagian dari RBAC tenant biasa.

## Extensibility (untuk AI Agent & Developer)

Saat menambah kemampuan baru, tanyakan dulu:
- **"Apakah ini node baru dalam flow yang sudah ada?"** → tambahkan sebagai Flow Node baru yang reusable, jangan hardcode logic khusus tenant tertentu.
- **"Apakah ini butuh event baru?"** → definisikan event & subscriber-nya secara eksplisit, supaya konsisten dengan pola event-driven yang sudah ada.
- **"Apakah ini benar-benar unik untuk 1 tenant, atau seharusnya jadi opsi konfigurasi umum?"** Default-nya: buat jadi opsi konfigurasi, bukan kode khusus tenant.

## Catatan Tech Stack

Dokumen ini sengaja tidak mengunci teknologi spesifik (bahasa, framework, database) karena itu keputusan terpisah dari alur bisnis. Begitu ada keputusan (atau preferensi Anda), sebaiknya dibuat dokumen terpisah `07-tech-stack.md` supaya konsisten dipakai AI agent saat generate kode.
