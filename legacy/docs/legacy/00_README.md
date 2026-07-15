# Saint Heavens POS & Service Management System

Dokumentasi teknis dan spesifikasi produk untuk aplikasi manajemen toko aksesoris handphone dan service center.

## 📚 Daftar Dokumen

| File | Deskripsi |
|------|-----------|
| [01_PRD.md](./01_PRD.md) | Product Requirements Document - Kebutuhan bisnis dan fitur |
| [02_Architecture.md](./02_Architecture.md) | Arsitektur sistem dan teknologi stack |
| [03_Frontend.md](./03_Frontend.md) | Dokumentasi frontend Svelte 5 |
| [04_Backend.md](./04_Backend.md) | Dokumentasi backend HonoJS |
| [05_Database.md](./05_Database.md) | Skema database dan relasi |
| [06_API_Reference.md](./06_API_Reference.md) | Referensi API endpoints |
| [07_Deployment.md](./07_Deployment.md) | Panduan deployment |

## 🛠️ Tech Stack

- **Frontend**: Svelte 5, SvelteKit, TailwindCSS, TanStack Query
- **Backend**: Bun, HonoJS, Drizzle ORM
- **Database**: SQLite
- **Monorepo**: Turborepo with Bun workspaces

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Run development
bun dev

# Backend runs at http://localhost:4000
# Frontend runs at http://localhost:5173
```

## 📁 Project Structure

```
coba/
├── apps/
│   ├── backend/          # HonoJS API server
│   │   ├── src/
│   │   │   ├── db/       # Drizzle schema & migrations
│   │   │   ├── modules/  # Feature modules (controller/service/repository)
│   │   │   └── middlewares/
│   │   └── drizzle/      # SQL migrations
│   └── frontend/         # SvelteKit app
│       └── src/
│           ├── routes/   # Page routes
│           └── lib/      # Components, services, utils
├── packages/
│   └── shared/           # Shared types & validation schemas
└── docs/                 # This documentation
```
