# Customer & Device Features

## Customer Module

### Purpose
Manage customer data, communication, service history, and the external-facing Customer Portal.

### Features

| ID | Feature | Description | Business Rules |
|----|---------|-------------|---------------|
| CUST-001 | Registration | Record customer name (required), phone, email (optional). Absence of optional fields must not block intake. | Name is mandatory |
| CUST-002 | Profile Management | View/edit customer profile, contact info, preferences | Only CS/Branch Mgr can edit |
| CUST-003 | Lifecycle Tracking | Track customer status: new → active → inactive | System-managed based on activity |
| CUST-004 | Contact Management | Store multiple phone numbers, emails per customer | Primary contact marked |
| CUST-005 | Service History | View all past service tickets for this customer across branches | Read-only for CS/Tech |
| CUST-006 | Warranty History | View all warranty records linked to customer's devices | Phase 2 |
| CUST-007 | Communication Log | Record phone calls, messages, notes about customer | Phase 2 |
| CUST-008 | Duplicate Detection | System warns when similar customer records exist (name + phone match) | Suggest merge, don't auto-merge |
| CUST-009 | Customer Portal | External portal: view ticket status, approve/reject quotes, service history. Access via magic link (no password) | Token expires 7 days |
| CUST-010 | Business Rules | Enforce: customer must exist before ticket creation; optional fields don't block flow | System-enforced |
| CUST-011 | Reporting | Customer volume, repeat customers, conversion rates | Phase 2 |

### Integration
- **Service**: Customer is required for every Service Ticket
- **Device**: Customer owns devices (Customer Asset)
- **POS**: Customer linked to POS transactions
- **Portal**: Magic link authentication for customer-facing features

---

## Device Module

### Purpose
Register and track devices (phones, tablets, laptops, etc.) brought in for service. Track ownership, service history, and sparepart compatibility.

### Features

| ID | Feature | Description | Business Rules |
|----|---------|-------------|---------------|
| DEV-001 | Registration | Record brand, model, color, condition. System should search existing device before creating new | Search before create |
| DEV-002 | Lifecycle | Track device states: registered → in-service → returned → archived | System-managed |
| DEV-003 | Identification | Store IMEI, serial number, or other unique identifiers | Optional but recommended |
| DEV-004 | Ownership Tracking | Link device to customer. Device can change ownership | Track ownership history |
| DEV-005 | Service History | View all past service tickets for this device | Accessible to Tech/CS |
| DEV-006 | Warranty History | View warranty records per device | Phase 2 |
| DEV-007 | Status Management | Track: at customer, at service center, in repair, ready for pickup, returned | Status changes logged |
| DEV-008 | Sparepart Compatibility | Map which spare parts are compatible with which device models | Used for part recommendation |
| DEV-009 | Business Rules | Device registration must occur before service approval | System-enforced |
| DEV-010 | Reporting | Most serviced devices, device brand distribution | Phase 2 |

### Integration
- **Customer**: Device belongs to a customer
- **Service**: Device is the subject of service tickets
- **Inventory**: Device model determines compatible spare parts
