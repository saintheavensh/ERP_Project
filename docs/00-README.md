# FlowServ — Dokumentasi Produk & Arsitektur
> *Nama kerja (working title) — silakan diganti sesuai branding Anda.*

Dokumentasi ini adalah sumber kebenaran (source of truth) untuk memahami **apa** yang dibangun, **kenapa** dibangun seperti itu, dan **bagaimana** cara kerjanya — ditujukan untuk AI agent (Claude Code, dsb.) maupun developer baru yang bergabung ke tim.

## Apa itu FlowServ?

Platform SaaS multi-tenant enterprise yang menyatukan Inventory Management, Service/Ticket Management, dan POS & Finance — dikendalikan RBAC granular yang bisa dikonfigurasi per tenant.

## Apa yang Membuat Ini Berbeda?

> **Alur kerja adalah data/konfigurasi, bukan logika yang ditulis ulang di kode.**

Alur Inventory dan Service Ticket disusun dari blok modular ("Flow Node") yang bisa disusun ulang per tenant/cabang/jenis servis tanpa deploy kode baru. Detail: [02-architecture-modular.md](./02-architecture-modular.md).

## Daftar Isi

| # | Dokumen | Isi |
|---|---------|-----|
| 01 | [product-overview.md](./01-product-overview.md) | Visi, masalah, target pengguna, non-goals |
| 02 | [architecture-modular.md](./02-architecture-modular.md) | Arsitektur inti, modularitas, keputusan multi-tenancy |
| 03 | [rbac-roles.md](./03-rbac-roles.md) | Role, permission, matrix akses, default threshold |
| 04 | [workflow-service-ticket.md](./04-workflow-service-ticket.md) | Alur end-to-end tiket servis |
| 05 | [workflow-inventory.md](./05-workflow-inventory.md) | Alur end-to-end inventory, keputusan metode costing |
| 06 | [data-model.md](./06-data-model.md) | Entitas, ERD, field-field utama |
| 07 | [features.md](./07-features.md) | Daftar fitur lengkap per modul, prioritas MVP/Phase 2 |
| 08 | [ui-ux.md](./08-ui-ux.md) | Prinsip desain & layar utama |
| 09 | [api-design.md](./09-api-design.md) | Prinsip API, contoh endpoint & payload |
| 10 | [tech-stack-infra.md](./10-tech-stack-infra.md) | Tech stack final: Hono, SvelteKit, Drizzle, Python printer |
| 11 | [non-functional-requirements.md](./11-non-functional-requirements.md) | Keamanan, multi-tenancy, skalabilitas, kepatuhan |
| 12 | [glossary.md](./12-glossary.md) | Istilah-istilah kunci |
| 13 | [ai-agent-build-guide.md](./13-ai-agent-build-guide.md) | Panduan langkah-demi-langkah membangun dengan AI agent |
| 14 | [printer-integration.md](./14-printer-integration.md) | Arsitektur printer agent (Python lokal) |

Di luar folder `docs/`, ada juga:
- **`db/schema.ts`** — skema database Drizzle, siap pakai
- **`drizzle.config.ts`** — konfigurasi Drizzle Kit

## Status Dokumentasi

✅ **Final** — seluruh keputusan besar (multi-tenancy, metode costing, threshold approval, tech stack lengkap termasuk revisi Hono/SvelteKit/Drizzle/Python, keamanan customer portal) sudah dikunci. **Tidak dibuka lagi untuk diskusi ulang** kecuali ada masalah teknis konkret yang muncul saat implementasi.

🔜 **Opsional, belum dibuat** (beri tahu kalau diperlukan): OpenAPI spec penuh, pricing/billing model detail, wireframe visual (Figma), deployment runbook.

## Cara Pakai Dokumen Ini

1. Baca **01** dan **02** untuk paham "kenapa" dan konsep besarnya.
2. Baca **03** untuk paham siapa boleh melakukan apa.
3. Baca **04** dan **05** untuk paham dua alur kerja inti — paling penting sebelum menulis kode apapun.
4. **06** sebagai peta data, dipasangkan dengan `db/schema.ts` sebagai implementasinya.
5. **07** dan **08** jadi referensi saat implementasi fitur/tampilan spesifik.
6. **09**, **10**, **11**, **14** untuk keputusan teknis: kontrak API, stack, requirement non-fungsional, printer.
7. **12** kalau ada istilah tidak familiar.
8. **13** — mulai dari sini kalau Anda menggunakan AI agent untuk menulis kodenya.
9. Kalau ada keputusan yang tidak terjawab di sini, **jangan asumsi sendiri** — tandai sebagai open question dan konfirmasi dulu. Tapi kalau itu detail implementasi kecil (bukan keputusan arsitektur besar), lebih efisien diputuskan sambil membangun.
