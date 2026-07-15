# GLOBAL BACKEND ARCHITECTURE RULES
*(Clean Architecture – Modular First)*

## 🎯 Objective
To maintain consistency in the modular backend architecture, ensuring that:
* **Circular dependencies** do not occur.
* **Refactoring** is not repeated between modules.
* The flow from **inventory** to **transactions** to **accounting** remains stable.

---

## 🏗️ Architecture Layer Standard
*(MANDATORY for core modules)*

Each business core module must follow this structure:
`modules/<module-name>/`
- `application/`
- `domain/`
- `infrastructure/`
- `presentation/`
- `<module>-container.ts`

### Layer Rules:

#### 1. Domain Layer
* **Must not** import frameworks.
* **Must not** import databases.
* Only includes **entities**, **types**, and **port interfaces**.

#### 2. Application Layer
* Contains **use cases**.
* May use repository **ports**.
* **Orchestrates** logic.

#### 3. Infrastructure Layer
* Implements **repositories** and **adapters**.
* Provides **database access** and **external services**.

#### 4. Presentation Layer
* Includes **controllers**.
* Defines **routes**.
* Specifies **validation schemas**.

---

## 🚦 Dependency Direction
*(MUST BE FOLLOWED)*

**Global dependency architecture:**
`products` → `inventory` → `transactions` → `accounting`

**Transactions:**
* Sales
* Purchases

### Rules:
* **Products**: Must **not** import other modules.
* **Inventory**: May only reference `ProductRef` from products.
* **Sales and Purchases**: Must **not** directly access the inventory repository; instead, they **must** go through the inventory use case.
* **Accounting**: Must **not** directly access the inventory table; it only receives transaction results.

---

## 📂 Shared / Lib
* **Must not** contain business logic.

---

## 🔄 Cross-Module Communication Rule
All communication between modules must occur through:
* **Use cases** OR
* **Domain events** (future)

**Prohibited:**
* Importing repositories from other modules.
* Importing entities from other modules.

**Use the following patterns:**
* `ProductRef`
* `CustomerRef`
* `SupplierRef`

---

## 🛠️ Services Classification Rule
The `services/` directory may only contain:
* Backward compatibility facades.
* Thin wrappers.

**Logic Placement:**
* **Orchestration**: Move to `application/use-cases`.
* **Pure Domain Logic**: Move to `domain/services`.

---

## 🔌 Infrastructure Consistency Rule
The adapter structure must be consistent:
`infrastructure/adapters/`

**All adapter files:**
* `*.adapter.ts` must be located within the `adapters/` folder.

---

## 📝 Activity Logger Rule
The activity logger may only be used in:
* `application/use-cases`

**Must NOT be used in:**
* Controllers
* Repositories

---

## 📦 Container Rule
All dependency wiring may only be performed in:
* `<module>-container.ts`

**Prohibited**: Wiring inside controllers.

---

## 🧪 Testing Rule
**Minimum requirements:**
* **Unit tests** for FIFO (inventory).
* **Integration tests** for transaction flow.

---

## 🔄 Refactor Strategy Rule (Anti Refactor Loop)
If a module is not part of the core transaction flow, use the following approach:
* **Structural alignment** only.
* Without redesigning the domain.

---

## 🛡️ Production Hardening Rules

### 1. Inventory Mutation Guard
* Every call to Inventory Stock Mutation MUST return a validation object: `{ batchIdsCreated: string[], totalQuantityApplied: number, success: boolean }`.
* If the applied quantity does not match the requested quantity, the caller MUST ROLLBACK the transaction.
* Partial applies are prohibited.

### 2. Accounting Idempotency
* Every Journal Entry MUST have a unique reference key.
* Format for Purchases: `PURCHASE-{purchaseId}`.
* The accounting module MUST reject duplicate keys to prevent double-entry.

### 3. Domain Event Foundation
* Domain entities should implement a basic `gatherEvents()` or `addEvent()` pattern.
* Events are collected within the entity during the transaction.
* Dispatching is prohibited until the event bus is explicitly enabled.

> [!NOTE]
> Simple CRUD modules do not require full Clean Architecture.
