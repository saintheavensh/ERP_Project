# Book 06 - Database Architecture

This directory contains the Logical Data Model and database schema specifications for the Universal Service ERP.

The design is intentionally **Vendor-Neutral (Agnostic)**. While it adheres to standard RDBMS principles (Foreign Keys, Constraints), it is not strictly locked to a single technology. Developers may implement this schema using PostgreSQL (e.g., Supabase), MySQL, SQL Server, or SQLite.

## Core Database Principles
1. **Immutability (Historical Data Must Survive):** Physical `DELETE` statements are prohibited for operational data. All tables use `deleted_at` for soft-deletion.
2. **Referential Integrity:** Foreign keys use `ON DELETE RESTRICT` to prevent accidental cascading data loss.
3. **Auditability:** All tables include `created_at` and `updated_at` timestamps.

## Schema Documents

* **[B06-DB-001 Database Architecture Principles](B06-DB-001%20Database%20Architecture%20Principles.md):** Rules for naming conventions, keys, and soft deletes.
* **[B06-DB-002 Core Entities Schema](B06-DB-002%20Core%20Entities%20Schema.md):** Branches, Roles, Users, Customers, and Devices.
* **[B06-DB-003 Service Operations Schema](B06-DB-003%20Service%20Operations%20Schema.md):** Service Orders, Estimates, QC, and Warranty.
* **[B06-DB-004 Inventory & Purchasing Schema](B06-DB-004%20Inventory%20&%20Purchasing%20Schema.md):** Suppliers, Products, POs, Batches (FIFO), and Stock Movements.
* **[B06-DB-005 Financial Transactions Schema](B06-DB-005%20Financial%20Transactions%20Schema.md):** Invoices, Payments, and Technician Commissions.
