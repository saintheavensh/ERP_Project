# Tech Stack & Infrastructure

> **Status: Final.** Direvisi mengikuti preferensi Anda (JavaScript kuat, laptop terbatas, belajar sambil membangun). Ini sudah melalui diskusi pros/cons — dianggap terkunci, tidak dibuka lagi kecuali ada masalah teknis nyata saat implementasi.

## Stack Final

| Layer | Pilihan | Alasan |
|---|---|---|
| **Backend** | **Hono** (TypeScript, di atas Node.js) | Ringan, cepat, tanpa abstraksi tersembunyi — kode lebih mudah ditelusuri untuk belajar |
| **ORM** | **Drizzle** | Skema sangat dekat ke SQL asli — membantu belajar database sungguhan, bukan cuma manggil fungsi. Skema lengkap ada di `db/schema.ts` |
| **Database** | PostgreSQL | JSONB (Flow Template) + Row-Level Security (isolasi tenant) |
| **Validasi** | **Zod** + `drizzle-zod` | Pairing standar Hono; `drizzle-zod` auto-generate validasi dari schema Drizzle — satu sumber kebenaran, tidak dobel kerja |
| **Frontend** | **SvelteKit** | Jauh lebih ringan di laptop dibanding Next.js (Vite, tanpa virtual DOM) |
| **UI Components** | Tailwind + shadcn-svelte / Skeleton UI | Setara shadcn/ui di ekosistem React |
| **Drag & Drop** | `svelte-dnd-action` | Untuk Ticket Kanban Board & Flow Template Builder |
| **Printer** | **Python** (Flask + `python-escpos`), agent lokal per kasir | Library ESC/POS terbaik ada di Python; browser tidak bisa akses printer USB langsung. Detail: [14-printer-integration.md](./14-printer-integration.md) |
| **Realtime** | WebSocket native (`hono/ws` atau `ws`) | Hono belum punya gateway abstraction seperti NestJS — tetap mudah disetel manual |
| **Auth (internal)** | JWT dengan `tenant_id` sebagai claim (`hono/jwt`) | Selaras [09-api-design.md](./09-api-design.md) |
| **Auth (customer portal)** | Magic link — token sekali pakai, expire 7 hari, dikirim via WA/SMS | Tidak perlu sistem password terpisah untuk customer |
| **Containerization** | Docker | Standar deployment |
| **Hosting (MVP)** | Railway atau Render | Lebih sederhana dari AWS/GCP mentah |
| **Hosting (enterprise)** | AWS/GCP (migrasi nanti) | Kalau butuh kontrol infra lebih detail |
| **CI/CD** | GitHub Actions | Terintegrasi dengan repo |

## Runtime: Node.js vs Bun

Hono jalan baik di keduanya. **Rekomendasi: mulai dari Node.js** — kompatibilitas library paling luas (BullMQ, dsb.), risiko paling kecil untuk pemula. **Bun** adalah opsi upgrade di masa depan kalau ingin install/dev server lebih cepat lagi — catat sebagai opsi, bukan keputusan sekarang.

## Kompensasi untuk Struktur yang Biasanya "Gratis" dari NestJS

Karena Hono tidak memaksakan modul/dependency injection, strukturnya harus dijaga lewat konvensi eksplisit:

- **RBAC**: bukan `Guard` seperti NestJS, tapi **middleware biasa** — misal `requirePermission('ticket.approve_quote')` dipasang di route yang butuh: `app.post('/tickets/:id/transition', requirePermission('...'), handler)`.
- **Struktur folder backend** (menggantikan module NestJS):

```
flowserv-api/
├─ db/
│  └─ schema.ts        (Drizzle — sudah dibuat)
├─ drizzle.config.ts
├─ src/
│  ├─ modules/
│  │  ├─ tickets/
│  │  │  ├─ routes.ts
│  │  │  └─ service.ts
│  │  ├─ inventory/
│  │  ├─ pos/
│  │  ├─ finance/
│  │  └─ rbac/
│  ├─ flow-engine/      (logic Flow Template/Node/Transition — jantung produk)
│  ├─ middleware/
│  │  ├─ auth.ts
│  │  ├─ rbac.ts
│  │  └─ tenant-scope.ts
│  └─ index.ts          (entry point, mount semua router modul)
```

## Struktur Frontend (SvelteKit)

```
flowserv-web/
├─ src/
│  ├─ routes/
│  │  ├─ dashboard/
│  │  ├─ tickets/
│  │  ├─ inventory/
│  │  ├─ pos/
│  │  └─ admin/
│  │     ├─ flow-templates/
│  │     └─ roles/
│  └─ lib/
│     ├─ components/
│     ├─ stores/
│     └─ api/           (fetch wrapper ke backend Hono)
```

## Implementasi Pencarian Global

Mulai simpel — jangan overengineering di MVP:
- Gunakan **PostgreSQL `ILIKE`** atau extension **`pg_trgm`** (trigram similarity) untuk pencarian toleran-typo di nama produk, SKU, device model, ID tiket, nama/no. HP customer.
- Index yang relevan: `gin_trgm_ops` index pada kolom yang sering dicari.
- Elasticsearch/dedicated search engine BARU dipertimbangkan kalau volume data sudah sangat besar dan Postgres mulai terasa lambat — bukan keputusan awal.

## Pertimbangan Skala Enterprise

- Row-Level Security di Postgres sebagai lapisan isolasi kedua setelah filter `tenant_id` di kode.
- Read replica untuk laporan finance/analytics berat.
- Partisi tabel `stock_movements` dan `ticket_stage_history` kalau volume sudah sangat besar.

## Yang Masih Perlu Diputuskan Nanti (Bisnis/Vendor, Bukan Blocker Teknis)

- Provider WhatsApp Business API
- Payment gateway (QRIS, dsb.)
- Merk/model printer thermal spesifik yang akan didukung (pengaruh ke konfigurasi `python-escpos`)

## Prinsip untuk AI Agent

Gunakan tabel di atas sebagai stack default untuk seluruh kode yang dihasilkan. Jangan campur framework lain (misal jangan tiba-tiba pakai Express atau Prisma) kecuali diminta eksplisit.
