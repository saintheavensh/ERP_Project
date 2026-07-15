# Backend Documentation

## HonoJS + Bun Backend

---

## 1. Overview

Backend Saint Heavens dibangun dengan **HonoJS** - web framework yang ringan dan cepat, berjalan di atas **Bun** runtime. Database menggunakan **SQLite** dengan **Drizzle ORM**.

### 1.1 Key Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Bun | 1.1+ | JavaScript/TypeScript runtime |
| HonoJS | 4.x | Web framework |
| Drizzle ORM | 0.45+ | Type-safe database ORM |
| better-sqlite3 | 12.x | SQLite driver |
| Zod | 3.x | Request validation |
| @hono/zod-validator | 0.7+ | Hono + Zod integration |

---

## 2. Project Structure

```
apps/backend/
├── src/
│   ├── index.ts                    # Main entry point
│   ├── db/
│   │   ├── index.ts                # Database connection
│   │   ├── schema.ts               # Drizzle schema definitions
│   │   └── seed.ts                 # Seed data script
│   ├── lib/
│   │   └── response.ts             # API response helpers
│   ├── middlewares/
│   │   └── auth.middleware.ts      # JWT authentication
│   └── modules/
│       ├── auth/
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   └── auth.repository.ts
│       ├── inventory/
│       ├── sales/
│       ├── purchases/
│       ├── customers/
│       ├── service/
│       ├── suppliers/
│       ├── categories/
│       ├── notifications/
│       ├── purchase-returns/
│       ├── defective-items/
│       └── uploads/
├── drizzle/                        # SQL migrations
├── public/uploads/                 # Static file storage
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

---

## 3. Entry Point

```typescript
// src/index.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";

// Controllers
import authController from "./modules/auth/auth.controller";
import inventoryController from "./modules/inventory/inventory.controller";
import salesController from "./modules/sales/sales.controller";
import purchaseController from "./modules/purchases/purchases.controller";
import { customersController } from "./modules/customers/customers.controller";
// ... more controllers

const app = new Hono();

// Global Middlewares
app.use("*", cors());
app.use("*", logger());

// Static files
app.use("/uploads/*", serveStatic({ root: "./public" }));

// Routes
app.route("/auth", authController);
app.route("/inventory", inventoryController);
app.route("/sales", salesController);
app.route("/purchases", purchaseController);
app.route("/customers", customersController);
// ... more routes

// Health check
app.get("/health", async (c) => {
    return c.json({ status: "ok" });
});

export default {
    port: 4000,
    fetch: app.fetch,
};
```

---

## 4. Module Pattern

Setiap module mengikuti pattern **Controller → Service → Repository**:

### 4.1 Directory Structure

```
modules/customers/
├── customers.controller.ts   # HTTP handling, request validation
├── customers.service.ts      # Business logic
└── customers.repository.ts   # Database queries
```

### 4.2 Controller Layer

Handles HTTP requests, validation, and response formatting:

```typescript
// customers.controller.ts
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { CustomersService } from "./customers.service";

const app = new Hono();
const service = new CustomersService();

// Validation schema
const customerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    phone: z.string().min(1, "Phone is required"),
    email: z.string().email().optional().or(z.literal("")),
    address: z.string().optional(),
    creditLimit: z.number().min(0).optional().default(0),
});

// GET /customers
app.get("/", async (c) => {
    const query = c.req.query("q");
    const customers = await service.getAll(query);
    return c.json({ success: true, data: customers });
});

// GET /customers/:id
app.get("/:id", async (c) => {
    const id = c.req.param("id");
    const customer = await service.getById(id);
    return c.json({ success: true, data: customer });
});

// POST /customers
app.post("/", zValidator("json", customerSchema), async (c) => {
    const data = c.req.valid("json");
    const customer = await service.create(data);
    return c.json({ success: true, data: customer }, 201);
});

// PUT /customers/:id
app.put("/:id", zValidator("json", customerSchema.partial()), async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const customer = await service.update(id, data);
    return c.json({ success: true, data: customer });
});

// DELETE /customers/:id
app.delete("/:id", async (c) => {
    const id = c.req.param("id");
    await service.delete(id);
    return c.json({ success: true, message: "Deleted" });
});

export { app as customersController };
```

### 4.3 Service Layer

Contains business logic and orchestrates repository calls:

```typescript
// customers.service.ts
import { v4 as uuidv4 } from "uuid";
import { CustomersRepository } from "./customers.repository";
import { HTTPException } from "hono/http-exception";

export class CustomersService {
    private repository = new CustomersRepository();

    async getAll(query?: string) {
        return await this.repository.findAll(query);
    }

    async getById(id: string) {
        const customer = await this.repository.findById(id);
        if (!customer) {
            throw new HTTPException(404, { message: "Customer not found" });
        }
        return customer;
    }

    async create(data: any) {
        // Check duplicate phone
        const existing = await this.repository.findByPhone(data.phone);
        if (existing) {
            throw new HTTPException(400, { message: "Phone already registered" });
        }

        const id = `CUST-${uuidv4().substring(0, 8).toUpperCase()}`;
        const [customer] = await this.repository.create({
            ...data,
            id,
            points: 0,
            debt: 0,
        });

        return customer;
    }

    async update(id: string, data: any) {
        const existing = await this.repository.findById(id);
        if (!existing) {
            throw new HTTPException(404, { message: "Customer not found" });
        }

        // Check phone uniqueness on change
        if (data.phone && data.phone !== existing.phone) {
            const phoneCheck = await this.repository.findByPhone(data.phone);
            if (phoneCheck) {
                throw new HTTPException(400, { message: "Phone already registered" });
            }
        }

        const [updated] = await this.repository.update(id, data);
        return updated;
    }

    async delete(id: string) {
        const existing = await this.repository.findById(id);
        if (!existing) {
            throw new HTTPException(404, { message: "Customer not found" });
        }
        await this.repository.delete(id);
    }
}
```

### 4.4 Repository Layer

Handles database queries using Drizzle ORM:

```typescript
// customers.repository.ts
import { eq, like, or, desc } from "drizzle-orm";
import { db } from "../../db";
import { members } from "../../db/schema";

export class CustomersRepository {
    async findAll(query?: string) {
        if (!query) {
            return await db.query.members.findMany({
                orderBy: [desc(members.createdAt)],
            });
        }

        return await db.query.members.findMany({
            where: or(
                like(members.name, `%${query}%`),
                like(members.phone, `%${query}%`)
            ),
            orderBy: [desc(members.createdAt)],
        });
    }

    async findById(id: string) {
        return await db.query.members.findFirst({
            where: eq(members.id, id),
        });
    }

    async findByPhone(phone: string) {
        return await db.query.members.findFirst({
            where: eq(members.phone, phone),
        });
    }

    async create(data: typeof members.$inferInsert) {
        return await db.insert(members).values(data).returning();
    }

    async update(id: string, data: Partial<typeof members.$inferInsert>) {
        return await db.update(members)
            .set(data)
            .where(eq(members.id, id))
            .returning();
    }

    async delete(id: string) {
        return await db.delete(members).where(eq(members.id, id));
    }
}
```

---

## 5. Authentication Middleware

```typescript
// middlewares/auth.middleware.ts
import { Context, Next } from "hono";
import { verify } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function authMiddleware(c: Context, next: Next) {
    const authHeader = c.req.header("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
        return c.json({ message: "Unauthorized" }, 401);
    }

    const token = authHeader.slice(7);

    try {
        const payload = verify(token, JWT_SECRET) as {
            id: string;
            username: string;
            role: string;
        };
        
        c.set("user", payload);
        await next();
    } catch (e) {
        return c.json({ message: "Invalid token" }, 401);
    }
}
```

Usage in controller:

```typescript
import { authMiddleware } from "../../middlewares/auth.middleware";

const app = new Hono();

// Apply to all routes
app.use("*", authMiddleware);

// Or specific routes
app.get("/protected", authMiddleware, async (c) => {
    const user = c.get("user");
    return c.json({ message: `Hello ${user.username}` });
});
```

---

## 6. Database Connection

```typescript
// db/index.ts
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

const sqlite = new Database("local.db");
export const db = drizzle(sqlite, { schema });
```

### Drizzle Config

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    dialect: "sqlite",
    dbCredentials: {
        url: "./local.db",
    },
});
```

---

## 7. API Response Helpers

```typescript
// lib/response.ts
import { Context } from "hono";

export function apiSuccess(
    c: Context,
    data: any,
    message?: string,
    statusCode: number = 200
) {
    return c.json(
        {
            success: true,
            message,
            data,
        },
        statusCode
    );
}

export function apiError(
    c: Context,
    error: any,
    message?: string,
    statusCode: number = 500
) {
    console.error("[API_ERROR]", error);
    return c.json(
        {
            success: false,
            message: message || "An error occurred",
            error: error?.message || String(error),
        },
        statusCode
    );
}
```

---

## 8. Request Validation with Zod

```typescript
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

// Define schema
const saleItemSchema = z.object({
    productId: z.string(),
    variant: z.string().default("Standard"),
    qty: z.number().min(1),
    price: z.number().min(0),
});

const paymentSchema = z.object({
    method: z.enum(["cash", "transfer", "qris", "tempo"]),
    amount: z.number().min(0),
    reference: z.string().optional(),
});

const saleSchema = z.object({
    memberId: z.string().optional(),
    customerName: z.string().optional(),
    payments: z.array(paymentSchema).min(1),
    userId: z.string(),
    notes: z.string().optional(),
    items: z.array(saleItemSchema).min(1),
    discountAmount: z.number().optional(),
});

// Use in route
app.post("/", zValidator("json", saleSchema), async (c) => {
    const data = c.req.valid("json"); // Typed & validated
    // Process sale...
});
```

---

## 9. Error Handling

### HTTPException

```typescript
import { HTTPException } from "hono/http-exception";

// In service
if (!product) {
    throw new HTTPException(404, { message: "Product not found" });
}

if (stock < qty) {
    throw new HTTPException(400, { message: "Insufficient stock" });
}
```

### Global Error Handler

```typescript
// In index.ts
app.onError((err, c) => {
    if (err instanceof HTTPException) {
        return c.json({ message: err.message }, err.status);
    }
    console.error(err);
    return c.json({ message: "Internal Server Error" }, 500);
});
```

---

## 10. Database Transactions

```typescript
// In service
import { db } from "../../db";

async createSale(data: any) {
    return await db.transaction(async (tx) => {
        // 1. Create sale record
        const [sale] = await tx.insert(sales).values({/*...*/}).returning();
        
        // 2. Create sale items
        for (const item of data.items) {
            await tx.insert(saleItems).values({/*...*/});
            
            // 3. Deduct stock
            await tx.update(productBatches)
                .set({ currentStock: sql`current_stock - ${item.qty}` })
                .where(eq(productBatches.id, batchId));
        }
        
        // 4. Create payments
        for (const payment of data.payments) {
            await tx.insert(salePayments).values({/*...*/});
        }
        
        return sale;
    });
}
```

---

## 11. File Uploads

```typescript
// modules/uploads/uploads.controller.ts
import { Hono } from "hono";
import { writeFile } from "fs/promises";
import { join } from "path";

const app = new Hono();

app.post("/", async (c) => {
    const body = await c.req.parseBody();
    const file = body.file as File;
    
    if (!file) {
        return c.json({ message: "No file provided" }, 400);
    }
    
    const filename = `${Date.now()}-${file.name}`;
    const filepath = join("./public/uploads", filename);
    
    const buffer = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(buffer));
    
    const url = `/uploads/${filename}`;
    return c.json({ success: true, url });
});

export default app;
```

---

## 12. Available Scripts

```json
// package.json
{
    "scripts": {
        "dev": "bun run --watch src/index.ts",
        "check": "tsc --noEmit",
        "db:generate": "drizzle-kit generate",
        "db:migrate": "drizzle-kit migrate",
        "db:push": "drizzle-kit push",
        "db:studio": "drizzle-kit studio",
        "db:seed": "bun run src/db/seed.ts"
    }
}
```

| Command | Description |
|---------|-------------|
| `bun dev` | Start dev server with hot reload |
| `bun run db:generate` | Generate migration from schema changes |
| `bun run db:migrate` | Apply migrations |
| `bun run db:push` | Push schema directly (dev only) |
| `bun run db:studio` | Open Drizzle Studio GUI |
| `bun run db:seed` | Run seed script |

---

## 13. Environment Variables

```env
# .env
JWT_SECRET=your-super-secret-key
DATABASE_URL=./local.db
PORT=4000
```
