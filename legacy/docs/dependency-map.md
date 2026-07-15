# Backend Module Dependency Map

Current as of: 2026-02-20

## 1. Core Modules
Foundational modules used across the system.

### `Settings`
*   **Used By**: `Sales`, `Service`, `Dashboard`, `WhatsApp`.
*   **Why**: Provides global configuration (Payment Methods, WhatsApp Config, Warranty Presets).

### `Notifications`
*   **Used By**: `Purchases`, `Service`.
*   **Why**: To send internal alerts (New PO) or external status updates (Service Done).

### `Auth` & `Users`
*   **Used By**: All modules (Implicitly via Middleware).
*   **Why**: Access control and user identification.

---

## 2. Feature Modules
Business-logic heavy modules.

### `Accounting`
*   **Used By**: `Sales`, `Purchases`, `Service`, `Inventory`, `Dashboard`.
*   **Dependencies**: None (Leaf module for transactions).
*   **Why**:
    *   **JournalService**: Records financial impact (Revenue/Expense) for every transaction.
    *   **CashRegisterService**: Validates if the "Shift" is open before processing payments.
    *   **Liabilities**: Tracks debt from Purchases.

### `Inventory`
*   **Used By**: `Sales` (Read-only check), `Purchases` (Stock Entry), `Service` (Spare parts).
*   **Dependencies**: `Categories` (Temporary), `Accounting` (Register check).
*   **Why**: Central source of truth for Stock levels.

### `Sales`
*   **Used By**: `Dashboard` (Stats).
*   **Dependencies**:
    *   `Accounting` (Record Revenue, Check Register).
    *   `Inventory` (Check Batch Availability).
    *   `Settings` (Get Payment Methods).
    *   `Customers` (Link Member).

### `Purchases`
*   **Used By**: `Dashboard` (Stats).
*   **Dependencies**:
    *   `Accounting` (Record Expense/AP).
    *   `Inventory` (Update Batches).
    *   `Notifications` (Alert Warehouse).

### `Service`
*   **Used By**: `Dashboard` (Stats).
*   **Dependencies**:
    *   `Accounting` (Record Service Revenue).
    *   `Inventory` (Consume Spare Parts).
    *   `Settings` (Warranty Logic).
    *   `Notifications` (Technician Assignment).

### `Dashboard`
*   **Used By**: None (Top-level aggregator).
*   **Dependencies**: `Reports`, `Sales`, `Service`, `Accounting`.
*   **Why**: Aggregates data from all business modules for the landing page.

---

## 3. Utility Modules

### `WhatsApp`
*   **Used By**: `Service` (Status updates).
*   **Dependencies**: `Settings` (Gateway Config).

---

## Analysis

### 🎯 Most Central Module: **Accounting**
The `Accounting` module (specifically `JournalService` and `CashRegisterService`) is the backbone of the system.
*   **Criticality**: High. If Accounting fails, Sales, Purchases, and Service cannot complete transactions.

### ⚠️ Risky Dependencies
1.  **Sales -> Settings (Dynamic Import)**
    *   `SalesService` uses `await import("../../settings...")` to load `SettingsService`.
    *   **Risk**: Hidden dependency that bypasses static analysis. Likely a workaround for a Circular Reference.

2.  **Inventory -> Accounting**
    *   `InventoryService` checks `CashRegisterService.isRegisterOpen()`.
    *   **Risk**: Logic leakage. Inventory updates shouldn't necessarily depend on a Cash Register session unless it's a specific POS adjustment.

3.  **Inventory -> Categories**
    *   Explicit `// Temporary import` comment found in code.
    *   **Risk**: Tight coupling between Product creation and Category templates.

### 🔄 Circular Dependencies
*   **Sales <-> Settings**: Strong indication of circularity due to the dynamic import usage in Sales. Settings likely imports Sales types or logic for some reason.

---

## 4. Architecture Hierarchy

Based on the dependency analysis, here is the architectural layering of the system.

### Layer 4 - Interface (Top Level)
**Modules**: All Modules (via `*.controller.ts` and `*.routes.ts`)
*   **Role**: Handles HTTP requests, Validation (Zod), and Response formatting.
*   **Why**: Every module exposes an interface layer to be accessible via API.

### Layer 3 - Feature Modules (Workflows)
**Modules**: `Sales`, `Purchases`, `Service`, `Dashboard`.
*   **Role**: Orchestrates business processes by combining multiple Domain Services.
*   **Why**:
    *   `Sales` coordinates Inventory + Accounting + CRM.
    *   `Service` coordinates Repair Logic + Inventory + Notification.
    *   These modules **depend on** Layer 2 but should **never** be depended upon by Layer 2.

### Layer 2 - Domain Services (Business Logic)
**Modules**: `Inventory`, `Accounting`, `Customers`, `Suppliers`, `Products`.
*   **Role**: Manages the core entities and "Truth" of the business.
*   **Why**:
    *   `Inventory` manages physical stock.
    *   `Accounting` manages financial truth.
    *   These modules are independent of *how* they are used (e.g., Stock can be deducted by a Sale or a Service).

### Layer 1 - Core (Infrastructure)
**Modules**: `Auth`, `Users`, `Settings`, `Notifications`, `WhatsApp`.
*   **Role**: Provides cross-cutting concerns and infrastructure support.
*   **Why**:
    *   `Auth` is needed by everyone.
    *   `Settings` provides config to everyone.
    *   `Notifications` is a utility channel for everyone.
    *   Changes here affect the entire system.
