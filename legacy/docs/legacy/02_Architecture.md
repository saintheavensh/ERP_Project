# System Architecture

## Saint Heavens POS & Service Management System

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Svelte 5 + SvelteKit Frontend               │   │
│  │   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │   │Dashboard │ │   POS    │ │ Service  │ │ Inventory│   │   │
│  │   └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                         HTTP/REST                                │
│                              ▼                                   │
├─────────────────────────────────────────────────────────────────┤
│                         SERVER LAYER                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   HonoJS + Bun Runtime                   │   │
│  │   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │   │   Auth   │ │  Sales   │ │ Purchases│ │ Inventory│   │   │
│  │   └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  │   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │   │ Service  │ │Customers │ │Suppliers │ │Categories│   │   │
│  │   └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                         Drizzle ORM                              │
│                              ▼                                   │
├─────────────────────────────────────────────────────────────────┤
│                         DATA LAYER                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    SQLite Database                        │   │
│  │   Tables: users, products, sales, purchases, services    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### 2.1 Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Svelte** | 5.x | UI Framework dengan Runes |
| **SvelteKit** | 2.x | Full-stack framework, routing |
| **TailwindCSS** | 3.4 | Styling utility-first |
| **TanStack Query** | 5.x | Server state management |
| **Bits UI** | 1.x | Accessible component primitives |
| **Lucide Svelte** | Latest | Icon library |
| **Axios** | 1.x | HTTP client |
| **Zod** | 3.x | Schema validation (shared) |

### 2.2 Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Bun** | 1.1 | JavaScript runtime |
| **HonoJS** | 4.x | Web framework |
| **Drizzle ORM** | 0.45 | Database ORM |
| **better-sqlite3** | 12.x | SQLite driver |
| **Zod** | 3.x | Request validation |
| **UUID** | 13.x | ID generation |

### 2.3 Shared Package

| Technology | Purpose |
|------------|---------|
| **@repo/shared** | Shared types, Zod schemas |

### 2.4 Development Tools

| Tool | Purpose |
|------|---------|
| **Turborepo** | Monorepo build system |
| **TypeScript** | Type safety |
| **Drizzle Kit** | Database migrations |
| **Vite** | Frontend bundler |

---

## 3. Project Structure

```
inventory-monorepo/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── db/
│   │   │   │   ├── index.ts        # Database connection
│   │   │   │   ├── schema.ts       # Drizzle schema
│   │   │   │   └── seed.ts         # Seed data
│   │   │   ├── lib/
│   │   │   │   └── response.ts     # API response helpers
│   │   │   ├── middlewares/
│   │   │   │   └── auth.middleware.ts
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   └── auth.repository.ts
│   │   │   │   ├── inventory/
│   │   │   │   ├── sales/
│   │   │   │   ├── purchases/
│   │   │   │   ├── customers/
│   │   │   │   ├── service/
│   │   │   │   ├── suppliers/
│   │   │   │   ├── categories/
│   │   │   │   ├── notifications/
│   │   │   │   ├── purchase-returns/
│   │   │   │   ├── defective-items/
│   │   │   │   └── uploads/
│   │   │   └── index.ts            # Main entry point
│   │   ├── drizzle/                # SQL migrations
│   │   ├── public/uploads/         # Static file uploads
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   │
│   └── frontend/
│       ├── src/
│       │   ├── lib/
│       │   │   ├── components/
│       │   │   │   ├── ui/         # Base UI components
│       │   │   │   └── custom/     # App-specific components
│       │   │   ├── services/       # API service wrappers
│       │   │   ├── stores/         # Svelte stores
│       │   │   ├── api.ts          # Axios instance
│       │   │   └── utils.ts        # Helper functions
│       │   ├── routes/
│       │   │   ├── +layout.svelte  # Main layout
│       │   │   ├── +page.svelte    # Dashboard
│       │   │   ├── login/
│       │   │   ├── products/
│       │   │   ├── sales/
│       │   │   ├── purchases/
│       │   │   ├── customers/
│       │   │   ├── service/
│       │   │   ├── suppliers/
│       │   │   ├── categories/
│       │   │   ├── purchase-returns/
│       │   │   ├── reports/
│       │   │   └── settings/
│       │   └── app.css
│       ├── static/
│       └── package.json
│
├── packages/
│   └── shared/
│       └── src/
│           └── index.ts            # Shared schemas & types
│
├── turbo.json
└── package.json
```

---

## 4. Module Pattern

Setiap module backend mengikuti pattern **Controller → Service → Repository**:

```
┌─────────────────┐
│   Controller    │  ← HTTP handling, validation
├─────────────────┤
│     Service     │  ← Business logic
├─────────────────┤
│   Repository    │  ← Database queries
└─────────────────┘
```

### Contoh: Customers Module

```typescript
// customers.controller.ts
customersController.post("/", zValidator("json", schema), async (c) => {
    const data = c.req.valid("json");
    const customer = await service.create(data);
    return c.json({ success: true, data: customer });
});

// customers.service.ts
async create(data) {
    const existing = await this.repository.findByPhone(data.phone);
    if (existing) throw new HTTPException(400, { message: "Phone exists" });
    return await this.repository.create({ ...data, id: generateId() });
}

// customers.repository.ts
async create(data) {
    return await db.insert(members).values(data).returning();
}
```

---

## 5. Data Flow Diagrams

### 5.1 Sales Transaction Flow

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Cashier │───▶│ Frontend│───▶│ Backend │───▶│Database │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
     │              │              │              │
     │  1. Add items to cart       │              │
     │─────────────▶│              │              │
     │              │              │              │
     │  2. Submit sale             │              │
     │─────────────▶│              │              │
     │              │ 3. POST /sales              │
     │              │─────────────▶│              │
     │              │              │ 4. Validate  │
     │              │              │ 5. FIFO batch│
     │              │              │ 6. Deduct    │
     │              │              │    stock     │
     │              │              │─────────────▶│
     │              │              │ 7. Create    │
     │              │              │    sale      │
     │              │              │─────────────▶│
     │              │              │              │
     │              │ 8. Return sale ID           │
     │              │◀─────────────│              │
     │  9. Show success            │              │
     │◀─────────────│              │              │
```

### 5.2 Service Workflow

```
[antrian] ──▶ [dicek] ──▶ [konfirmasi] ──▶ [dikerjakan] ──▶ [selesai] ──▶ [diambil]
    │            │             │               │               │
    │            ▼             ▼               ▼               ▼
    │       Diagnosa     Estimasi        Perbaikan      Pembayaran
    │                     Biaya                          & Pickup
    │
    └──────────────────────────────────────────────────▶ [batal]
```

---

## 6. Authentication Flow

```
┌─────────┐         ┌─────────┐         ┌─────────┐
│  User   │         │ Frontend│         │ Backend │
└─────────┘         └─────────┘         └─────────┘
     │                   │                   │
     │ 1. Enter credentials                  │
     │──────────────────▶│                   │
     │                   │ 2. POST /auth/login
     │                   │──────────────────▶│
     │                   │                   │ 3. Verify password
     │                   │                   │ 4. Generate JWT
     │                   │ 5. Return token   │
     │                   │◀──────────────────│
     │                   │ 6. Store in localStorage
     │ 7. Redirect to dashboard              │
     │◀──────────────────│                   │
     │                   │                   │
     │ 8. API requests   │                   │
     │──────────────────▶│                   │
     │                   │ 9. Include Bearer token
     │                   │──────────────────▶│
     │                   │                   │ 10. Verify token
     │                   │                   │ 11. Process request
```

---

## 7. Deployment Architecture

### Development

```
┌─────────────────┐     ┌─────────────────┐
│ Frontend (5173) │────▶│ Backend (4000)  │
│   SvelteKit     │     │   Bun + Hono    │
└─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │ SQLite (file)   │
                        │ local.db        │
                        └─────────────────┘
```

### Production (Recommended)

```
                    ┌─────────────────┐
                    │   Cloudflare    │
                    │     (CDN)       │
                    └────────┬────────┘
                             │
         ┌───────────────────┴───────────────────┐
         ▼                                       ▼
┌─────────────────┐                   ┌─────────────────┐
│  Static Files   │                   │   API Server    │
│ (Vercel/Netlify)│                   │   (VPS/Docker)  │
└─────────────────┘                   └────────┬────────┘
                                               │
                                               ▼
                                      ┌─────────────────┐
                                      │   SQLite/Turso  │
                                      └─────────────────┘
```
