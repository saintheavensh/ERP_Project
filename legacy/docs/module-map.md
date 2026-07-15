# System Module Map

Current as of: 2026-02-20

## 1. Core & System Domain
Foundational modules that provide the infrastructure for the application.

### `Auth`
*   **Responsibility**: Manages user authentication (Login, Logout), JWT token generation, and permission validation.
*   **Key Services**:
    *   `AuthService`: Core logic for credential verification.
*   **Related Modules**: `Users` (for fetching credentials).

### `Users`
*   **Responsibility**: Manages employee accounts, profiles, and role assignments.
*   **Key Services**:
    *   `UsersService`: CRUD for user data.
*   **Related Modules**: `Auth` (consumed by), `Service`, `Sales` (for assigning activities to users).

### `Settings`
*   **Responsibility**: Handles global application configuration, including store details and payment methods.
*   **Key Services**:
    *   `SettingsService`: General config management.
*   **Related Modules**: `Payment-Methods` (sub-feature), `Accounting` (for linking GL accounts).

### `Dashboard`
*   **Responsibility**: Aggregates high-level metrics for the landing page.
*   **Key Services**:
    *   `DashboardService`: Fetches summary stats.
*   **Related Modules**: Consumes `Sales`, `Purchases`, `Service` to compute totals.

---

## 2. Inventory & Supply Chain Domain
Modules responsible for tracking goods, procurement, and stock management.

### `Inventory`
*   **Responsibility**: The central source of truth for Products, Variants, and Stock Batches (FIFO tracking).
*   **Key Services**:
    *   `InventoryService`: Product CRUD and general stock logic.
    *   `StockOpnameService`: Manages physical stock counting sessions.
*   **Related Modules**: `Categories`, `Brands`, `Devices`, `Purchases` (increases stock), `Sales` (decreases stock).

### `Purchases`
*   **Responsibility**: Manages the procurement workflow (Ordering -> Receiving -> Stock Entry).
*   **Key Services**:
    *   `PurchasesService`: Handles PO creation and stock ingestion.
*   **Related Modules**: `Inventory` (updates batches), `Accounting` (creates expense journals), `Suppliers`.

### `Suppliers`
*   **Responsibility**: Manages vendor database and contact information.
*   **Key Services**: `SuppliersService`
*   **Related Modules**: `Purchases`.

---

## 3. Commercial Domain (Revenue Generation)
Modules that directly generate revenue through sales or services.

### `Sales` (POS)
*   **Responsibility**: Point of Sale system. Handles checkout, cart management, and payment processing.
*   **Key Services**:
    *   `SalesService`: Complex logic for order processing, stock deduction, and payment validation.
*   **Related Modules**: `Inventory` (checks stock), `Accounting` (records evenue), `Members` (customer association).

### `Service` (Repair)
*   **Responsibility**: End-to-end workflow for device repairs (Receive -> Diagnose -> Work -> QC -> Complete).
*   **Key Services**:
    *   `ServiceService`: Manages repair tickets and status transitions.
*   **Related Modules**: `Service-Tools` (consumes tools), `Inventory` (consumes spare parts), `Customers`.

### `Customers`
*   **Responsibility**: Database of end-customers (Members) for CRM and history tracking.
*   **Key Services**: `CustomersService`
*   **Related Modules**: `Sales`, `Service`.

---

## 4. Finance & Accounting Domain
Modules ensuring financial integrity and tracking business performance.

### `Accounting`
*   **Responsibility**: The financial backbone. Tracks the General Ledger (GL) and Cash flow.
*   **Key Services**:
    *   `AccountingService`: General accounting logic.
    *   `JournalService`: Double-entry bookkeeping core.
    *   `CashRegisterService`: Tracks daily cash drawer sessions.
    *   `AssetsService`: Fixed asset management and depreciation.
    *   `RevenueTargetService`: Tracking sales goals.
*   **Related Modules**: `Sales`, `Purchases`, `Operational-Costs`.

### `Reports`
*   **Responsibility**: Generates analytical reports for business intelligence.
*   **Key Services**:
    *   `ReportsService`: Aggregates data for profit/loss, sales trends, etc.
*   **Related Modules**: Read-only access to almost all other modules.

### `Operational-Costs`
*   **Responsibility**: Tracks daily business expenses (Rent, Electricity, etc.).
*   **Key Services**: `OperationalCostsService`
*   **Related Modules**: `Accounting` (records expense journals).
