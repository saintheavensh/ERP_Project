# Architecture Rules & Violations

Current as of: 2026-02-20

## 1. Direct Database Access (Leaky Abstractions)

**Rule**: A module should **NEVER** query or modify tables owned by another module directly. It must use the other module's Service.

**Violations Detected**:

*   **Sales Module modifying Inventory**:
    *   `SalesService` imports `productBatches` schema and directly runs `tx.update(productBatches)`.
    *   **Risk**: If Inventory logic changes (e.g., we add "Reserved Stock"), Sales code will break or corrupt data.
    *   **Fix**: Create `InventoryService.deductStock(items: {productId, qty}[])` and call it from Sales.

*   **Purchases Module modifying Inventory**:
    *   `PurchasesService` directly inserts into `productBatches` and updates `products.stock`.
    *   **Risk**: Logic for "Weighted Average Cost" or future stock tracking features is scattered.
    *   **Fix**: Call `InventoryService.addStock(items: {productId, qty, buyPrice}[])`.

*   **Service Module modifying Inventory**:
    *   `ServiceService` manually updates `productBatches` when a job is completed.
    *   **Risk**: Inconsistent stock deduction logic compared to Sales.
    *   **Fix**: Use the same `InventoryService.deductStock()` method as Sales.

---

## 2. Duplicated Business Logic

**Rule**: Critical calculations (Price, Stock, Tax) should exist in **one place only**.

**Violations Detected**:

*   **Stock Deduction Logic**:
    *   Found in: `SalesService`, `ServiceService`, `InventoryService` (adjustments).
    *   Each module re-implements the logic to find batches and decrement counts.
    *   **Risk**: A bug fixed in Sales (e.g., negative stock check) might still exist in Service.

*   **Journal Entry Creation**:
    *   Found in: `SalesService`, `PurchasesService`, `ServiceService`, `OperationalCostsService`.
    *   Each module manually constructs the Debit/Credit array strings (`1-1000`, `4-1000`, etc.).
    *   **Risk**: Hardcoded Account IDs (`1-1000`) scattered across the system make changing the Chart of Accounts a nightmare.
    *   **Fix**: Centralize in `AccountingService.recordRevenue(type, amount, ref)` or use a configuration map.

---

## 3. Circular Dependencies & Dynamic Imports

**Rule**: Modules should form a DAG (Directed Acyclic Graph). Module A -> B is fine. A -> B -> A is bad.

**Violations Detected**:

*   **Sales <-> Settings**:
    *   `SalesService` uses `await import("../../settings/services/settings.service")` inside a method.
    *   **Cause**: `Settings` likely imports something from Sales (or shared types), preventing a clean top-level import.
    *   **Risk**: Makes testing difficult (mocking dynamic imports is hard) and hides dependencies from static analysis.

*   **Accounting <-> Journal**:
    *   `CashRegisterService` imports `JournalService` dynamically.
    *   **Cause**: Tightly coupled financial logic.

---

## Summary of Action Plan

1.  **Refactor Inventory**: Consolidate all `productBatches` access into `InventoryService`.
2.  **Refactor Accounting**: Create helper methods for common Journal types (Revenue, Expense) instead of letting every module build raw Journal lines.
3.  **Dependency Injection**: Use proper Dependency Injection (or just better module structuring) to remove dynamic `await import(...)` hacks.