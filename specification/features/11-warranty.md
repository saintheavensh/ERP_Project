# Warranty Features

> **Implementation status (2026-07-20):** Not started
> No warranty templates, activation, claims, or history exists. Supplier warranty
> policy fields exist on the supplier record but nothing consumes them.
> Planned for Phase 8.

## Purpose
Manage warranty lifecycle: template definition, auto-activation after service, claim processing, and warranty service orders.

## Features

| ID | Feature | Description | Business Rules |
|----|---------|-------------|---------------|
| WAR-001 | Foundation | Warranty records linked to completed service tickets | Auto-created on ticket completion |
| WAR-002 | Templates | Define warranty terms per service category: duration, conditions, coverage scope | Admin configures |
| WAR-003 | Activation | Warranty automatically activates when service ticket is completed and paid | Start date = completion date |
| WAR-004 | Claims | Customer submits warranty claim (via portal or in-person). System validates eligibility | Check: within period, matching issue |
| WAR-005 | Warranty Service Orders | Approved claims create new service tickets tagged as warranty. Parts cost tracked separately | No customer charge for covered items |
| WAR-006 | History | View all warranty records per customer, device, or service ticket | CS/Tech access |
| WAR-007 | Dashboard | Active warranties, claim rates, expiring warranties, repeat failure patterns | Phase 2 |
| WAR-008 | Business Rules | Cannot claim after expiry, warranty void conditions (e.g., physical damage) | System-enforced |

## Integration
- **Service**: Warranty creates new service tickets
- **Customer**: Warranty linked to customer and device
- **Inventory**: Warranty parts consumption tracked separately for cost analysis
- **Finance**: Warranty repairs affect margin differently (no revenue, only COGS)
