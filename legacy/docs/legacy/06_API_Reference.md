# API Reference

## REST API Endpoints

---

## 1. Base URL

```
Development: http://localhost:4000
```

## 2. Authentication

All endpoints (except `/auth/login`) require Bearer token:

```
Authorization: Bearer <jwt_token>
```

---

## 3. Response Format

### Success Response

```json
{
    "success": true,
    "message": "Operation successful",
    "data": { ... }
}
```

### Error Response

```json
{
    "success": false,
    "message": "Error message",
    "error": "Detailed error"
}
```

---

## 4. Endpoints

### 4.1 Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | User login |

#### POST /auth/login

**Request Body:**
```json
{
    "username": "admin",
    "password": "password123"
}
```

**Response (200):**
```json
{
    "success": true,
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIs...",
        "user": {
            "id": "USR-XXXXXXXX",
            "username": "admin",
            "name": "Administrator",
            "role": "admin"
        }
    }
}
```

---

### 4.2 Inventory (Products)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/inventory` | List all products |
| GET | `/inventory/:id` | Get product by ID |
| POST | `/inventory` | Create product |
| PUT | `/inventory/:id` | Update product |
| DELETE | `/inventory/:id` | Delete product |
| GET | `/inventory/suppliers/:id/variants` | Get supplier variants |

#### GET /inventory

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "id": "PRD-XXXXXXXX",
            "code": "SKU001",
            "name": "iPhone Case",
            "categoryId": "CAT-XXXXXXXX",
            "stock": 50,
            "minStock": 10,
            "category": { "id": "...", "name": "Cases" },
            "batches": [...]
        }
    ]
}
```

#### POST /inventory

**Request Body:**
```json
{
    "code": "SKU001",
    "name": "iPhone Case",
    "categoryId": "CAT-XXXXXXXX",
    "minStock": 10
}
```

---

### 4.3 Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/categories` | List all categories |
| GET | `/categories/:id` | Get category by ID |
| POST | `/categories` | Create category |
| PUT | `/categories/:id` | Update category |
| DELETE | `/categories/:id` | Delete category |

#### POST /categories

**Request Body:**
```json
{
    "name": "Accessories",
    "description": "Phone accessories"
}
```

---

### 4.4 Suppliers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/suppliers` | List all suppliers |
| GET | `/suppliers/:id` | Get supplier by ID |
| POST | `/suppliers` | Create supplier |
| PUT | `/suppliers/:id` | Update supplier |
| DELETE | `/suppliers/:id` | Delete supplier |

#### POST /suppliers

**Request Body:**
```json
{
    "name": "PT Supplier ABC",
    "contact": "John Doe",
    "phone": "08123456789",
    "address": "Jakarta"
}
```

---

### 4.5 Customers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customers` | List all customers |
| GET | `/customers/:id` | Get customer by ID |
| POST | `/customers` | Create customer |
| PUT | `/customers/:id` | Update customer |
| DELETE | `/customers/:id` | Delete customer |
| GET | `/customers/:id/sales` | Get customer sales |
| GET | `/customers/:id/unpaid-sales` | Get unpaid sales |
| POST | `/customers/:id/payment` | Process debt payment |

#### POST /customers

**Request Body:**
```json
{
    "name": "John Customer",
    "phone": "08123456789",
    "email": "john@example.com",
    "address": "Jl. Contoh No. 123",
    "creditLimit": 5000000,
    "discountPercent": 5
}
```

#### POST /customers/:id/payment

**Request Body:**
```json
{
    "amount": 500000,
    "notes": "Pembayaran via transfer BCA",
    "saleId": "SAL-XXXXXXXX",
    "proofImage": "/uploads/proof.jpg"
}
```

---

### 4.6 Purchases

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/purchases` | List purchases |
| GET | `/purchases/:id` | Get purchase by ID |
| POST | `/purchases` | Create purchase |
| DELETE | `/purchases/:id` | Delete purchase |

#### GET /purchases

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| search | string | Search by ID or notes |
| startDate | ISO date | Filter from date |
| endDate | ISO date | Filter to date |
| mine | boolean | Only current user's purchases |
| limit | number | Limit results |

#### POST /purchases

**Request Body:**
```json
{
    "supplierId": "SUP-XXXXXXXX",
    "notes": "Restocking accessories",
    "date": "2026-01-08",
    "items": [
        {
            "productId": "PRD-XXXXXXXX",
            "variant": "Original",
            "qty": 50,
            "buyPrice": 50000,
            "sellPrice": 75000
        }
    ]
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "id": "PO-XXXXXXXX",
        "supplierId": "SUP-XXXXXXXX",
        "totalAmount": 2500000,
        "items": [
            {
                "productId": "PRD-XXXXXXXX",
                "batchId": "B-XXXXXXXX",
                "qty": 50
            }
        ]
    }
}
```

---

### 4.7 Sales

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sales` | List sales |
| GET | `/sales/:id` | Get sale by ID |
| POST | `/sales` | Create sale |

#### GET /sales

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | ISO date | Filter from date |
| endDate | ISO date | Filter to date |
| status | string | Filter by payment status |

#### POST /sales

**Request Body:**
```json
{
    "memberId": "CUST-XXXXXXXX",
    "customerName": "Walk-in Customer",
    "userId": "USR-XXXXXXXX",
    "notes": "Sale notes",
    "discountAmount": 10000,
    "items": [
        {
            "productId": "PRD-XXXXXXXX",
            "variant": "Original",
            "qty": 2,
            "price": 75000
        }
    ],
    "payments": [
        {
            "method": "cash",
            "amount": 100000
        },
        {
            "method": "transfer",
            "amount": 40000,
            "reference": "TRF-123456"
        }
    ]
}
```

**Notes:**
- `items.variant` is used to select batch automatically (FIFO)
- Multiple payment methods supported
- If `method: "tempo"`, payment is recorded as debt

---

### 4.8 Purchase Returns

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/purchase-returns` | List returns |
| GET | `/purchase-returns/:id` | Get return by ID |
| POST | `/purchase-returns` | Create return |

#### POST /purchase-returns

**Request Body:**
```json
{
    "supplierId": "SUP-XXXXXXXX",
    "notes": "Defective items",
    "items": [
        {
            "productId": "PRD-XXXXXXXX",
            "batchId": "B-XXXXXXXX",
            "qty": 5,
            "reason": "Factory defect"
        }
    ]
}
```

---

### 4.9 Defective Items

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/defective-items` | List defective items |
| POST | `/defective-items` | Create defective record |
| PUT | `/defective-items/:id/process` | Mark as processed |

---

### 4.10 Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | Get user notifications |
| PUT | `/notifications/:id/read` | Mark as read |
| PUT | `/notifications/read-all` | Mark all as read |

---

### 4.11 Uploads

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/uploads` | Upload file |

#### POST /uploads

**Request (multipart/form-data):**
```
file: <binary file>
```

**Response:**
```json
{
    "success": true,
    "url": "/uploads/1704672000000-image.jpg"
}
```

---

## 5. Error Codes

| Status | Description |
|--------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid/missing token) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 6. Validation Errors

**Response (400):**
```json
{
    "success": false,
    "issues": [
        {
            "path": ["name"],
            "message": "Name is required"
        },
        {
            "path": ["phone"],
            "message": "Phone is required"
        }
    ]
}
```
