# Saint Heavens - POS & Service Management System

A comprehensive Point of Sale and Service Management solution built with modern web technologies.

## 🚀 Recent Updates (Jan 2026)
- **Technician Dashboard**: Dedicated view for technicians with performance stats and job queues.
- **RBAC**: Strict role-based access control for data isolation.
- **Real-time Sync**: WebSocket integration for instant updates.

## 📚 Documentation
- [Assessment & Bug Report](./ASSESSMENT.md) - **NEW**
- [Architecture](./02_Architecture.md)
- [Backend Structure](./04_Backend.md)
- [Frontend Structure](./03_Frontend.md)
- [Database Schema](./05_Database.md)

## 🛠️ Tech Stack
- **Runtime:** Bun
- **Backend:** HonoJS
- **Frontend:** Svelte 5 + SvelteKit
- **Database:** SQLite + Drizzle ORM
- **Real-time:** Redis + WebSockets

## 🚦 Getting Started

### Prerequisites
- [Bun](https://bun.sh) (v1.1+)
- Redis (optional, for real-time features)

### Installation

1. **Install Dependencies**
   ```bash
   bun install
   ```

2. **Setup Database**
   ```bash
   bun run db:push
   bun run db:seed
   ```

3. **Start Development Server**
   ```bash
   bun run dev
   ```

## 🧪 Testing

Run strict type checking:
```bash
bun run check
```

See [ASSESSMENT.md](./ASSESSMENT.md) for a detailed review of the current application state.
