Last updated: 20/02/2026
Generated from AI architecture analysis

# Project Architecture Analysis

Based on the codebase analysis, here is the breakdown of your application architecture.

### 1. Module Grouping (Business Domains)

The backend is structured as a modular monolith (`apps/backend/src/modules`). The modules can be grouped into 4 main business domains:

| Domain | Modules | Description |
| :--- | :--- | :--- |
| **Core & System** | `auth`, `users`, `settings`, `dashboard`, `notifications`, `uploads`, `whatsapp` | Foundation for access control, configuration, and system-wide utilities. |
| **Inventory & Supply Chain** | `inventory` (products), `categories`, `brands`, `devices`, `suppliers`, `purchases`, `purchase-returns`, `defective-items` | Managing stock, product definitions, and procurement. |
| **Commercial (Sales & Service)** | `sales`, `service`, `service-tools`, `customers` | Revenue-generating activities: POS (Point of Sale) and Device Repair Service. |
| **Finance & Accounting** | `accounting`, `payment-methods`, `operational-costs`, `reports` | Financial tracking, General Ledger (GL), and business performance analysis. |

---

### 2. Module Functions

*   **Auth**: Handles authentication (Login, Logout, JWT) and permission checks.
*   **Users**: Manages employee accounts, roles, and profiles.
*   **Inventory**: The "Heart" of the system. Manages products, variants, and specifically **Batches** (FIFO tracking).
*   **Sales**: The POS system. Handles cart checkout, calculating totals, and recording transactions.
*   **Service**: Specialized workflow for device repairs (Reception -> Diagnostic -> Repair -> Quality Control -> Done).
*   **Accounting**: The "Ledger" of the system. Tracks Chart of Accounts (COA), Journals, and Cash Registers.
*   **Settings**: Manages dynamic system configurations like Payment Methods store info.

---

### 3. Module Internal Relationships

The system is **Highly Coupled** around the **Accounting** and **Inventory** modules.

*   **Sales creates Journals**: The `SalesService` directly imports `JournalService` from the Accounting module to record financial impact (Debit Cash/Credit Revenue) immediately upon checkout.
*   **Purchases updates Stock**: The `PurchasesService` directly manipulates `productBatches` to increase stock and also calls `JournalService` to record the expense/asset.
*   **Service uses Tools & Parts**: The Service module interacts with Inventory to consume spare parts during repairs.

---

### 4. Most Frequently Used Module

**🏆 The Winner: Accounting Module**

While `Auth` is used for every request, the **Accounting Module** (`JournalService`, `CashRegisterService`) is the most critical *internal dependency* for business logic.
*   **Sales** depends on it.
*   **Purchases** depends on it.
*   **Operational Costs** depends on it.

Every major action in the system triggers a financial record in the Accounting module.

---

### 5. Architectural Inconsistencies & Observations

1.  **Leaky Abstractions (Direct DB Access)**:
    *   *Observation*: `SalesService` directly writes to the `productBatches` table to deduct stock.
    *   *Best Practice*: It should ideally call `InventoryService.deductStock()`. Direct table access from a sibling module creates tight coupling and makes refactoring the Inventory logic harder in the future.

2.  **Dynamic Imports for Dependency Injection**:
    *   *Observation*: In `SalesService`, there is a line: `await import("../../settings/services/settings.service")`.
    *   *Reason*: This is likely done to avoid **Circular Dependencies** (Settings might import Sales, and Sales imports Settings). It's a pragmatic fix but indicates the modules are intertwined.

3.  **Frontend Layout**:
    *   *Observation*: The frontend distinguishes between `routes/(finance)` (the URL structure) and `features/accounting` (the code logic).
    *   *Verdict*: This is inconsistent naming (`finance` vs `accounting`) but a good separation of concerns (Routing vs Logic).

### Summary
You have a **Accounting-Driven Monolith**. The system is designed to ensure that **every operational action (Sale, Purchase) automatically generates financial data**, which is excellent for business integrity but requires careful maintenance of the Accounting module.
