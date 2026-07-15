# Feature Catalog — Master List

> **~170 features identified** across all domains. ✅ = MVP, 🟡 = Phase 2.
> This is the single reference for "what needs to be built."

---

## Customer (11 features)

| ID | Feature | MVP | Roles | Detail |
|----|---------|-----|-------|--------|
| CUST-001 | Customer Registration | ✅ | CS, Cashier | [01-customer-device.md](./01-customer-device.md) |
| CUST-002 | Customer Profile Management | ✅ | CS, Branch Mgr | |
| CUST-003 | Customer Lifecycle Tracking | ✅ | System | |
| CUST-004 | Customer Contact Management | ✅ | CS | |
| CUST-005 | Customer Service History | ✅ | CS, Tech, Branch Mgr | |
| CUST-006 | Customer Warranty History | 🟡 | CS, Branch Mgr | |
| CUST-007 | Customer Communication Log | 🟡 | CS | |
| CUST-008 | Duplicate Customer Detection | ✅ | System, CS | |
| CUST-009 | Customer Portal (tracking, approval) | ✅ | Customer | |
| CUST-010 | Customer Business Rules Enforcement | ✅ | System | |
| CUST-011 | Customer Reporting | 🟡 | Branch Mgr, Owner | |

## Device (10 features)

| ID | Feature | MVP | Roles | Detail |
|----|---------|-----|-------|--------|
| DEV-001 | Device Registration | ✅ | CS, Tech | [01-customer-device.md](./01-customer-device.md) |
| DEV-002 | Device Lifecycle Management | ✅ | System | |
| DEV-003 | Device Identification (IMEI/Serial) | ✅ | CS, Tech | |
| DEV-004 | Device Ownership Tracking | ✅ | System | |
| DEV-005 | Device Service History | ✅ | Tech, CS | |
| DEV-006 | Device Warranty History | 🟡 | CS, Branch Mgr | |
| DEV-007 | Device Status Management | ✅ | Tech, CS | |
| DEV-008 | Device-Sparepart Compatibility | ✅ | Tech, Inv Staff | |
| DEV-009 | Device Business Rules | ✅ | System | |
| DEV-010 | Device Reporting | 🟡 | Branch Mgr | |

## Service (22 features)

| ID | Feature | MVP | Roles | Detail |
|----|---------|-----|-------|--------|
| SVC-001 | Service Intake (complaint, device registration) | ✅ | CS, Tech | [02-service.md](./02-service.md) |
| SVC-002 | Quick Service vs Regular Service Classification | ✅ | CS | |
| SVC-003 | Dynamic Intake Forms | 🟡 | Admin | |
| SVC-004 | Service Lifecycle (state machine via Flow Engine) | ✅ | System | |
| SVC-005 | Service Order Creation | ✅ | CS, Tech | |
| SVC-006 | Diagnosis & Estimation | ✅ | Tech | |
| SVC-007 | Customer Approval (via portal/WA) | ✅ | Customer, System | |
| SVC-008 | Parts Reservation (auto from ticket) | ✅ | System | |
| SVC-009 | Repair Execution & Progress | ✅ | Tech | |
| SVC-010 | Change Order (new findings mid-repair) | ✅ | Tech | |
| SVC-011 | Quality Control Checklist | ✅ | Sr. Tech | |
| SVC-012 | Service Completion & Handover | ✅ | CS, Tech | |
| SVC-013 | Service Cancellation Flow | ✅ | CS, Branch Mgr | |
| SVC-014 | Service Business Rules | ✅ | System | |
| SVC-015 | Service Reporting | 🟡 | Branch Mgr, Owner | |
| SBL-001 | Service Quotation Management | ✅ | Tech, Cashier | [03-service-billing.md](./03-service-billing.md) |
| SBL-002 | Service Deposit (DP) Management | ✅ | Cashier | |
| SBL-003 | Service Invoice Generation | ✅ | System, Cashier | |
| SBL-004 | Service Payment Processing | ✅ | Cashier | |
| SBL-005 | Service Refund | ✅ | Cashier, Finance | |
| SBL-006 | Service Revenue Dashboard | 🟡 | Branch Mgr, Owner | |
| CAT-001 | Service Category & Pricing Architecture | ✅ | Admin | [04-service-category.md](./04-service-category.md) |
| CAT-002 | Time Estimation per Category | 🟡 | System | |
| CAT-003 | Warranty Rules per Category | 🟡 | Admin | |

## Technician (15 features)

| ID | Feature | MVP | Roles | Detail |
|----|---------|-----|-------|--------|
| TECH-001 | Technician Profile Management | ✅ | Admin, Branch Mgr | [05-technician.md](./05-technician.md) |
| TECH-002 | Technician Skill Management | ✅ | Admin | |
| TECH-003 | Auto/Manual Assignment (with recommendation) | ✅ | Branch Mgr, System | |
| TECH-004 | Service Execution Tracking | ✅ | Tech | |
| TECH-005 | Waiting Parts Workflow | ✅ | Tech, System | |
| TECH-006 | External Purchase Workflow | 🟡 | Tech, Branch Mgr | |
| TECH-007 | Reimbursement Workflow | 🟡 | Tech, Finance | |
| TECH-008 | Technician QC Role | ✅ | Sr. Tech | |
| TECH-009 | Technician Performance Metrics & Ranking | 🟡 | Branch Mgr | |
| TECH-010 | Technician Dashboard (My Jobs, Quick Actions) | ✅ | Tech | |
| TECH-011 | Technician Commission Calculation | 🟡 | Finance | |
| TECH-012 | Technician Business Rules | ✅ | System | |
| TECH-013 | Technician Calendar / Schedule View | ✅ | Tech, Branch Mgr | |
| TECH-014 | Technician Workload Heatmap | 🟡 | Branch Mgr | |
| TECH-015 | Reassignment with Reason Tracking | ✅ | Branch Mgr | |

## Inventory (14 features)

| ID | Feature | MVP | Roles | Detail |
|----|---------|-----|-------|--------|
| INV-001 | Inventory Foundation & Master Data | ✅ | Inv Staff | [06-inventory.md](./06-inventory.md) |
| INV-002 | Inventory Lifecycle (states) | ✅ | System | |
| INV-003 | FIFO Batch Architecture | ✅ | System | |
| INV-004 | Batch Management (multi-supplier) | ✅ | Inv Staff | |
| INV-005 | Stock Movement Ledger (append-only) | ✅ | System | |
| INV-006 | Service Consumption (auto FIFO) | ✅ | Tech, System | |
| INV-007 | Warranty Consumption | 🟡 | System | |
| INV-008 | Supplier Return | ✅ | Inv Staff, Branch Mgr | |
| INV-009 | Customer Return (restocking) | ✅ | Inv Staff | |
| INV-010 | Stock Adjustment (with approval) | ✅ | Inv Staff, Branch Mgr | |
| INV-011 | Stock Opname / Audit | 🟡 | Inv Staff | |
| INV-012 | Reorder Management (auto/manual PO) | ✅ | Inv Staff, System | |
| INV-013 | Inventory Reporting | 🟡 | Inv Staff, Branch Mgr | |
| INV-014 | Inventory Business Rules | ✅ | System | |

## Purchasing (12 features)

| ID | Feature | MVP | Roles | Detail |
|----|---------|-----|-------|--------|
| PUR-001 | Purchase Foundation | ✅ | Inv Staff | [07-purchasing.md](./07-purchasing.md) |
| PUR-002 | Purchase Request | ✅ | Inv Staff, Tech | |
| PUR-003 | Purchase Order Management | ✅ | Inv Staff | |
| PUR-004 | Goods Receiving (qty matching) | ✅ | Inv Staff | |
| PUR-005 | Inventory Reservation from PO | ✅ | System | |
| PUR-005A | Waiting Parts Procurement | ✅ | Inv Staff, Tech | |
| PUR-005B | External Technician Procurement | 🟡 | Tech, Branch Mgr | |
| PUR-006 | Supplier Credit Purchase | 🟡 | Inv Staff, Finance | |
| PUR-007 | Purchase Returns | ✅ | Inv Staff | |
| PUR-008 | Purchase Recommendations (auto) | 🟡 | System | |
| PUR-009 | Purchasing Dashboard | 🟡 | Inv Staff, Branch Mgr | |
| PUR-010 | Purchasing Business Rules | ✅ | System | |

## Sales & POS (8 features)

| ID | Feature | MVP | Roles | Detail |
|----|---------|-----|-------|--------|
| SAL-001 | Sales Foundation (retail architecture) | ✅ | Cashier | [08-sales-pos.md](./08-sales-pos.md) |
| SAL-002 | POS Walk-In Sales | ✅ | Cashier | |
| SAL-003 | POS Linked to Service Ticket | ✅ | Cashier | |
| SAL-004 | Payment Processing (partial/DP) | ✅ | Cashier | |
| SAL-005 | Sales Returns | ✅ | Cashier, Branch Mgr | |
| SAL-006 | Sales Discounts (with threshold) | ✅ | Cashier, Branch Mgr | |
| SAL-007 | Sales Dashboard | 🟡 | Branch Mgr, Owner | |
| SAL-008 | Sales Business Rules | ✅ | System | |

## Supplier (9 features)

| ID | Feature | MVP | Roles | Detail |
|----|---------|-----|-------|--------|
| SUP-001 | Supplier Registration & Profile | ✅ | Inv Staff | [09-supplier.md](./09-supplier.md) |
| SUP-002 | Supplier Categories | ✅ | Inv Staff | |
| SUP-003 | Supplier Products Mapping | ✅ | Inv Staff | |
| SUP-004 | Supplier Pricing History | ✅ | Inv Staff | |
| SUP-005 | Supplier Performance Tracking | 🟡 | Branch Mgr | |
| SUP-006 | Supplier Credit Terms | 🟡 | Finance | |
| SUP-007 | Supplier Dashboard | 🟡 | Inv Staff | |
| SUP-008 | Supplier Business Rules | ✅ | System | |
| SUP-009 | Product Catalog (price comparison) | ✅ | Inv Staff, Branch Mgr | |

## Finance (20 features)

| ID | Feature | MVP | Roles | Detail |
|----|---------|-----|-------|--------|
| FIN-001 | Finance Foundation | ✅ | Finance | [10-finance.md](./10-finance.md) |
| FIN-002 | Cash Management | ✅ | Cashier, Finance | |
| FIN-003 | Accounts Receivable | ✅ | Finance | |
| FIN-004 | Accounts Payable | ✅ | Finance | |
| FIN-005 | Expense Management | ✅ | Finance, Branch Mgr | |
| FIN-006 | Technician Reimbursement | 🟡 | Finance | |
| FIN-007 | Accounting Engine (double-entry) | ✅ | System | |
| FIN-008 | Chart of Accounts | ✅ | Finance, Admin | |
| FIN-009 | Journal Management | ✅ | Finance | |
| FIN-010 | General Ledger | ✅ | Finance | |
| FIN-011 | Profit & Loss Report | ✅ | Finance, Owner | |
| FIN-012 | Balance Sheet | 🟡 | Finance, Owner | |
| FIN-013 | Cash Flow Report | 🟡 | Finance, Owner | |
| FIN-014 | Financial Reporting (export) | 🟡 | Finance | |
| FIN-015 | Financial Business Rules | ✅ | System | |
| FIN-016 | Opening Balance Management | 🟡 | Finance | |
| FIN-017 | Capital & Owner Equity | 🟡 | Finance, Owner | |
| FIN-018 | Period Closing & Fiscal Year | 🟡 | Finance | |
| FIN-019 | Tax Management | 🟡 | Finance | |
| FIN-020 | Multi-Branch Consolidation | 🟡 | Finance, Owner | |

## Warranty (8 features)

| ID | Feature | MVP | Roles | Detail |
|----|---------|-----|-------|--------|
| WAR-001 | Warranty Foundation | ✅ | System | [11-warranty.md](./11-warranty.md) |
| WAR-002 | Warranty Templates | ✅ | Admin | |
| WAR-003 | Warranty Activation (post-service) | ✅ | System | |
| WAR-004 | Warranty Claims | ✅ | CS, Customer | |
| WAR-005 | Warranty Service Orders | ✅ | Tech | |
| WAR-006 | Warranty History | ✅ | CS, Tech | |
| WAR-007 | Warranty Dashboard | 🟡 | Branch Mgr | |
| WAR-008 | Warranty Business Rules | ✅ | System | |

## Dashboard, Widgets & Reporting (17 features)

| ID | Feature | MVP | Roles | Detail |
|----|---------|-----|-------|--------|
| DAS-001 | Dashboard Foundation (per-role default layouts) | ✅ | System | [12-dashboard-reporting.md](./12-dashboard-reporting.md) |
| DAS-002 | Executive Dashboard (cross-branch KPIs) | ✅ | Owner | |
| DAS-003 | Operational Dashboard (daily workload) | ✅ | Branch Mgr | |
| DAS-004 | Financial Dashboard (Simple/Accountant Mode) | ✅ | Owner, Finance | |
| DAS-005 | Service Dashboard (repair pipeline, SLA) | ✅ | Branch Mgr | |
| DAS-006 | Dashboard Alerts (service, inventory, finance, warranty) | ✅ | All roles | |
| DAS-008 | Dashboard Business Rules | ✅ | System | |
| WDG-001 | Widget Framework (registration, lifecycle, rendering) | ✅ | System | |
| WDG-002 | Widget Drag-and-Drop Positioning | ✅ | All roles | |
| WDG-003 | Widget Resize / Collapse / Expand | ✅ | All roles | |
| WDG-004 | Widget Layout Persistence (per user) | ✅ | All roles | |
| WDG-005 | Widget Dashboard Reset to Default | ✅ | All roles | |
| WDG-006 | Role-Based Widget Catalog (show/hide per role) | ✅ | Admin | |
| BRD-001 | Brand/Merk Management | ✅ | Inv Staff | |
| BRD-002 | Brand Classification | ✅ | Inv Staff | |
| BRD-003 | Brand Reporting | 🟡 | Branch Mgr | |
| BRD-004 | Brand Business Rules | ✅ | System | |

## Settings & Platform (8 features)

| ID | Feature | MVP | Roles | Detail |
|----|---------|-----|-------|--------|
| SET-001 | Settings Foundation | ✅ | Admin | [13-settings.md](./13-settings.md) |
| SET-002 | Company Settings | ✅ | Owner | |
| SET-003 | User & Role Settings (RBAC UI) | ✅ | Admin | |
| SET-004 | Operational Settings | ✅ | Admin | |
| SET-005 | Financial Settings | ✅ | Admin, Finance | |
| SET-006 | Document & Printing Settings | ✅ | Admin, Branch Mgr | |
| SET-007 | Notification Settings | 🟡 | Admin | |
| SET-008 | Settings Business Rules | ✅ | System | |

## Core Platform (13 features)

| ID | Feature | MVP | Roles | Detail |
|----|---------|-----|-------|--------|
| PLT-001 | Multi-Tenant Provisioning | ✅ | Super Admin | |
| PLT-002 | Authentication (JWT) | ✅ | All | |
| PLT-003 | RBAC Enforcement (middleware) | ✅ | System | |
| PLT-004 | Flow Engine (Template/Node/Transition) | ✅ | System, Admin | |
| PLT-005 | Flow Template Builder UI | ✅ | Admin | |
| PLT-006 | Audit Log (cross-module) | ✅ | System | |
| PLT-007 | Global Search (typo-tolerant) | ✅ | All | |
| PLT-008 | Notification System (in-app) | ✅ | All | |
| PLT-009 | File Storage (photo before/after) | 🟡 | All | |
| PLT-010 | Printer Integration (Python agent) | ✅ | Cashier | |
| PLT-011 | Event Bus (internal) | ✅ | System | |
| PLT-012 | Webhook (external) | 🟡 | System | |
| PLT-013 | Real-time Updates (WebSocket) | ✅ | All | |

---

## Summary

| | MVP ✅ | Phase 2 🟡 | Total |
|---|---|---|---|
| **Count** | ~100 | ~70 | ~170 |
