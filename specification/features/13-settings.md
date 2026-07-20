# Settings Features

> **Implementation status (2026-07-20):** Minimal
> **Built:** `GET /v1/settings/payment-methods` only.
> **Not built:** company settings, user/role management UI, operational settings,
> financial settings, document/printing settings, notification settings. Note that
> margin config columns (`marginStrategy`, `targetMargin`) exist on categories and
> items but no endpoint sets them — margin calculation currently lives entirely in the
> frontend simulator. Planned for Phase 5 and Phase 7 (RBAC UI).

## Purpose
System-wide configuration: company info, user/role management, operational parameters, financial settings, printing, and notifications.

## Features

| ID | Feature | Description | Business Rules |
|----|---------|-------------|---------------|
| SET-001 | Foundation | Centralized settings per tenant, organized by category | Admin access only |
| SET-002 | Company Settings | Company name, logo, address, contact info, branches | Owner manages |
| SET-003 | User & Role Settings | User management + visual RBAC permission matrix. Create custom roles | Admin manages |
| SET-004 | Operational Settings | Default Flow Templates, service categories, diagnosis templates, QC checklists, approval thresholds | Admin manages |
| SET-005 | Financial Settings | Currency, tax rates, fiscal year, default COA, payment methods | Admin/Finance manages |
| SET-006 | Document & Printing | Printer device registration, template editing (WYSIWYG), document-to-printer assignment | Admin/Branch Mgr manages |
| SET-007 | Notification Settings | Configure which events trigger notifications, delivery channels (in-app, email, WA) | Phase 2 |
| SET-008 | Business Rules | Settings changes are audit-logged, critical settings need confirmation | System-enforced |

## Integration
- **All Modules**: Settings feed configuration values to every module
- **RBAC**: Role & permission management is a settings function
- **Printer**: Printer device/template management is a settings function
- **Audit**: All settings changes recorded in audit log
