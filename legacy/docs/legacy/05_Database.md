# Database Schema Documentation

## SQLite + Drizzle ORM

---

## 1. Overview

Database menggunakan **SQLite** dengan **Drizzle ORM** untuk type-safe queries. Schema didefinisikan di TypeScript dan dimigrasikan menggunakan Drizzle Kit.

### 1.1 Database Location

```
apps/backend/local.db
```

### 1.2 Schema File

```
apps/backend/src/db/schema.ts
```

---

## 2. Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   users     │       │  categories │       │  suppliers  │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │       │ id (PK)     │
│ username    │       │ name        │       │ name        │
│ password    │       │ description │       │ contact     │
│ role        │       │ createdAt   │       │ phone       │
│ name        │       └──────┬──────┘       │ address     │
│ image       │              │              │ image       │
│ createdAt   │              │              │ createdAt   │
└──────┬──────┘              │              └──────┬──────┘
       │                     │                     │
       │         ┌───────────┴───────────┐         │
       │         ▼                       │         │
       │   ┌─────────────┐               │         │
       │   │  products   │◄──────────────┼─────────┤
       │   ├─────────────┤               │         │
       │   │ id (PK)     │               │         │
       │   │ code        │               │         │
       │   │ name        │               │         │
       │   │ categoryId (FK)             │         │
       │   │ image       │               │         │
       │   │ stock       │               │         │
       │   │ minStock    │               │         │
       │   │ createdAt   │               │         │
       │   └──────┬──────┘               │         │
       │          │                      │         │
       │          ▼                      │         │
       │   ┌─────────────────┐           │         │
       │   │ productBatches  │◄──────────┼─────────┘
       │   ├─────────────────┤           │
       │   │ id (PK)         │           │
       │   │ productId (FK)  │           │
       │   │ supplierId (FK) │           │
       │   │ variant         │           │
       │   │ buyPrice        │           │
       │   │ sellPrice       │           │
       │   │ initialStock    │           │
       │   │ currentStock    │           │
       │   │ createdAt       │           │
       │   └────────┬────────┘           │
       │            │                    │
       ▼            ▼                    ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  purchases  │   │   sales     │   │  members    │
├─────────────┤   ├─────────────┤   ├─────────────┤
│ id (PK)     │   │ id (PK)     │   │ id (PK)     │
│ supplierId (FK) │ memberId (FK)   │ name        │
│ userId (FK) │   │ customerName│   │ phone       │
│ totalAmount │   │ totalAmount │   │ email       │
│ notes       │   │ discountAmt │   │ address     │
│ date        │   │ finalAmount │   │ creditLimit │
└──────┬──────┘   │ paymentMethod   │ debt        │
       │          │ userId (FK) │   │ points      │
       ▼          │ notes       │   │ createdAt   │
┌─────────────┐   │ createdAt   │   └─────────────┘
│purchaseItems│   └──────┬──────┘
├─────────────┤          │
│ id (PK)     │          ▼
│ purchaseId (FK)  ┌─────────────┐
│ productId (FK)   │ saleItems   │
│ variant     │    ├─────────────┤
│ qtyOrdered  │    │ id (PK)     │
│ qtyReceived │    │ saleId (FK) │
│ buyPrice    │    │ productId (FK)
│ sellPrice   │    │ batchId (FK)│
│ batchId (FK)│    │ variant     │
│ createdAt   │    │ qty         │
└─────────────┘    │ price       │
                   │ subtotal    │
                   │ createdAt   │
                   └─────────────┘
```

---

## 3. Table Definitions

### 3.1 Users (Authentication)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK | UUID, e.g., "USR-XXXXXXXX" |
| username | TEXT | NOT NULL, UNIQUE | Login username |
| password | TEXT | NOT NULL | Hashed password |
| role | TEXT | NOT NULL, DEFAULT 'teknisi' | admin, kasir, teknisi |
| name | TEXT | NOT NULL | Display name |
| image | TEXT | NULLABLE | Profile photo URL |
| created_at | INTEGER | DEFAULT CURRENT_TIMESTAMP | Timestamp |

### 3.2 Categories

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK | UUID |
| name | TEXT | NOT NULL | Category name |
| description | TEXT | NULLABLE | Optional description |
| created_at | INTEGER | DEFAULT CURRENT_TIMESTAMP | Timestamp |

### 3.3 Suppliers

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK | "SUP-XXXXXXXX" |
| name | TEXT | NOT NULL | Supplier name |
| contact | TEXT | NULLABLE | Contact person |
| phone | TEXT | NULLABLE | Phone number |
| address | TEXT | NULLABLE | Address |
| image | TEXT | NULLABLE | Logo/photo |
| created_at | INTEGER | DEFAULT CURRENT_TIMESTAMP | Timestamp |

### 3.4 Members (Customers)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK | "CUST-XXXXXXXX" |
| name | TEXT | NOT NULL | Customer name |
| phone | TEXT | NOT NULL, UNIQUE | Phone number |
| email | TEXT | NULLABLE | Email address |
| address | TEXT | NULLABLE | Address |
| discount_percent | INTEGER | DEFAULT 0 | Member discount % |
| points | INTEGER | DEFAULT 0 | Loyalty points |
| debt | INTEGER | DEFAULT 0 | Outstanding debt (Rp) |
| credit_limit | INTEGER | DEFAULT 0 | Max credit allowed |
| image | TEXT | NULLABLE | Photo |
| created_at | INTEGER | DEFAULT CURRENT_TIMESTAMP | Timestamp |

### 3.5 Products

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK | "PRD-XXXXXXXX" |
| code | TEXT | UNIQUE | SKU/Barcode |
| name | TEXT | NOT NULL | Product name |
| category_id | TEXT | FK → categories.id | Category reference |
| image | TEXT | NULLABLE | Product photo |
| stock | INTEGER | NOT NULL, DEFAULT 0 | Total stock (sum of batches) |
| min_stock | INTEGER | DEFAULT 5 | Minimum stock alert |
| created_at | INTEGER | DEFAULT CURRENT_TIMESTAMP | Timestamp |

### 3.6 Product Batches (Lot Tracking)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK | "B-XXXXXXXX" |
| product_id | TEXT | FK → products.id, NOT NULL | Product reference |
| supplier_id | TEXT | FK → suppliers.id | Supplier reference |
| variant | TEXT | NULLABLE | "Original", "OEM", "Copy" |
| supplier_name | TEXT | NULLABLE | Snapshot of supplier name |
| buy_price | INTEGER | NOT NULL | Purchase price |
| sell_price | INTEGER | NOT NULL | Selling price |
| initial_stock | INTEGER | NOT NULL | Stock when created |
| current_stock | INTEGER | NOT NULL | Current remaining stock |
| created_at | INTEGER | DEFAULT CURRENT_TIMESTAMP | Timestamp |
| updated_at | INTEGER | NULLABLE | Last update timestamp |

### 3.7 Purchases (Stock In)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK | "PO-XXXXXXXX" |
| supplier_id | TEXT | FK → suppliers.id, NOT NULL | Supplier reference |
| user_id | TEXT | FK → users.id | Who created |
| total_amount | INTEGER | NOT NULL | Total purchase value |
| notes | TEXT | NULLABLE | Notes |
| date | INTEGER | DEFAULT CURRENT_TIMESTAMP | Purchase date |

### 3.8 Purchase Items

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO INCREMENT | Auto ID |
| purchase_id | TEXT | FK → purchases.id, NOT NULL | Purchase reference |
| product_id | TEXT | FK → products.id, NOT NULL | Product reference |
| variant | TEXT | NULLABLE | Variant type |
| qty_ordered | INTEGER | NOT NULL | Quantity ordered |
| qty_received | INTEGER | NOT NULL | Quantity received |
| buy_price | INTEGER | NOT NULL | Buy price per unit |
| sell_price | INTEGER | NOT NULL | Sell price per unit |
| batch_id | TEXT | FK → product_batches.id | Generated batch |
| created_at | INTEGER | DEFAULT CURRENT_TIMESTAMP | Timestamp |

### 3.9 Sales (Stock Out)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK | "SAL-XXXXXXXX" |
| member_id | TEXT | FK → members.id | Customer (if member) |
| customer_name | TEXT | NULLABLE | Walk-in customer name |
| total_amount | INTEGER | NOT NULL | Subtotal before discount |
| discount_amount | INTEGER | DEFAULT 0 | Discount applied |
| final_amount | INTEGER | NOT NULL | Total after discount |
| payment_method | TEXT | NOT NULL | cash, transfer, qris |
| payment_status | TEXT | DEFAULT 'paid' | paid, partial, unpaid |
| user_id | TEXT | FK → users.id, NOT NULL | Cashier |
| notes | TEXT | NULLABLE | Notes |
| created_at | INTEGER | DEFAULT CURRENT_TIMESTAMP | Timestamp |

### 3.10 Sale Items

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO INCREMENT | Auto ID |
| sale_id | TEXT | FK → sales.id, NOT NULL | Sale reference |
| product_id | TEXT | FK → products.id, NOT NULL | Product reference |
| batch_id | TEXT | FK → product_batches.id, NOT NULL | Batch used (FIFO) |
| variant | TEXT | NULLABLE | Variant snapshot |
| qty | INTEGER | NOT NULL | Quantity sold |
| price | INTEGER | NOT NULL | Price per unit |
| subtotal | INTEGER | NOT NULL | qty × price |
| created_at | INTEGER | DEFAULT CURRENT_TIMESTAMP | Timestamp |

### 3.11 Sale Payments

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO INCREMENT | Auto ID |
| sale_id | TEXT | FK → sales.id, NOT NULL | Sale reference |
| method | TEXT | NOT NULL | cash, transfer, qris |
| amount | INTEGER | NOT NULL | Payment amount |
| reference | TEXT | NULLABLE | Transfer ref, etc. |
| proof_image | TEXT | NULLABLE | Payment proof image |
| created_at | INTEGER | DEFAULT CURRENT_TIMESTAMP | Timestamp |

### 3.12 Services (Service Center)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO INCREMENT | Auto ID |
| no | TEXT | NOT NULL, UNIQUE | "SRV-YYYY-XXX" |
| customer | TEXT (JSON) | NOT NULL | {name, phone, address?} |
| device | TEXT (JSON) | NOT NULL | {brand, model, imei?, equipment?} |
| complaint | TEXT | NOT NULL | Customer complaint |
| diagnosis | TEXT | NULLABLE | Technician diagnosis |
| notes | TEXT | NULLABLE | Additional notes |
| status | TEXT | DEFAULT 'antrian' | antrian, dicek, konfirmasi, dikerjakan, selesai, diambil, batal |
| technician_id | TEXT | FK → users.id | Assigned technician |
| created_by | TEXT | FK → users.id | Who created ticket |
| cost_estimate | INTEGER | NULLABLE | Estimated cost |
| actual_cost | INTEGER | NULLABLE | Final cost |
| date_in | INTEGER | DEFAULT CURRENT_TIMESTAMP | Check-in date |
| date_out | INTEGER | NULLABLE | Pickup date |

### 3.13 Notifications

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO INCREMENT | Auto ID |
| user_id | TEXT | FK → users.id, NOT NULL | Target user |
| type | TEXT | NOT NULL | low_stock, service_update, etc. |
| title | TEXT | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification body |
| entity_type | TEXT | NULLABLE | Related entity type |
| entity_id | TEXT | NULLABLE | Related entity ID |
| is_read | INTEGER (BOOLEAN) | DEFAULT false | Read status |
| created_at | INTEGER | DEFAULT CURRENT_TIMESTAMP | Timestamp |

### 3.14 Activity Logs

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO INCREMENT | Auto ID |
| user_id | TEXT | FK → users.id, NOT NULL | Who performed action |
| action | TEXT | NOT NULL | CREATE, UPDATE, DELETE, STATUS_CHANGE |
| entity_type | TEXT | NOT NULL | service, sale, product, etc. |
| entity_id | TEXT | NOT NULL | Entity ID |
| old_value | TEXT (JSON) | NULLABLE | Previous value |
| new_value | TEXT (JSON) | NULLABLE | New value |
| description | TEXT | NULLABLE | Human-readable description |
| created_at | INTEGER | DEFAULT CURRENT_TIMESTAMP | Timestamp |

### 3.15 Settings

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| key | TEXT | PK | Setting key |
| value | TEXT (JSON) | NOT NULL | Setting value |

### 3.16 Purchase Returns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK | "RET-XXXXXXXX" |
| supplier_id | TEXT | FK → suppliers.id, NOT NULL | Supplier |
| user_id | TEXT | FK → users.id, NOT NULL | Who created |
| date | INTEGER | DEFAULT CURRENT_TIMESTAMP | Return date |
| notes | TEXT | NULLABLE | Notes |
| created_at | INTEGER | DEFAULT CURRENT_TIMESTAMP | Timestamp |

### 3.17 Purchase Return Items

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO INCREMENT | Auto ID |
| return_id | TEXT | FK → purchase_returns.id, NOT NULL | Return reference |
| product_id | TEXT | FK → products.id, NOT NULL | Product |
| batch_id | TEXT | FK → product_batches.id, NOT NULL | Batch |
| qty | INTEGER | NOT NULL | Quantity returned |
| reason | TEXT | NULLABLE | Reason for return |
| created_at | INTEGER | DEFAULT CURRENT_TIMESTAMP | Timestamp |

### 3.18 Defective Items

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK | "DEF-XXXXXXXX" |
| product_id | TEXT | FK → products.id, NOT NULL | Product |
| batch_id | TEXT | FK → product_batches.id, NOT NULL | Batch |
| supplier_id | TEXT | FK → suppliers.id, NOT NULL | Supplier |
| qty | INTEGER | NOT NULL | Quantity defective |
| source | TEXT | NOT NULL | manual, sales_return, service_return |
| source_ref_id | TEXT | NULLABLE | Reference ID |
| reason | TEXT | NULLABLE | Defect reason |
| status | TEXT | DEFAULT 'pending' | pending, processed |
| created_at | INTEGER | DEFAULT CURRENT_TIMESTAMP | Timestamp |

---

## 4. Database Commands

```bash
cd apps/backend

# Generate migration from schema changes
bun run db:generate

# Apply pending migrations
bun run db:migrate

# Push schema directly (development only)
bun run db:push

# Open Drizzle Studio (GUI)
bun run db:studio

# Run seed script
bun run db:seed
```

---

## 5. Common Queries

### 5.1 Get Products with Category

```typescript
const products = await db.query.products.findMany({
    with: {
        category: true,
        batches: true,
    },
    orderBy: [desc(products.createdAt)],
});
```

### 5.2 Get Sales with Items

```typescript
const sale = await db.query.sales.findFirst({
    where: eq(sales.id, saleId),
    with: {
        items: {
            with: {
                product: true,
                batch: true,
            },
        },
        member: true,
        user: true,
    },
});
```

### 5.3 FIFO Batch Selection

```typescript
const batches = await db.query.productBatches.findMany({
    where: and(
        eq(productBatches.productId, productId),
        gt(productBatches.currentStock, 0)
    ),
    orderBy: [asc(productBatches.createdAt)], // Oldest first (FIFO)
});
```

### 5.4 Low Stock Products

```typescript
const lowStock = await db.query.products.findMany({
    where: sql`${products.stock} <= ${products.minStock}`,
    orderBy: [asc(products.stock)],
});
```
