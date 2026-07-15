# Service Category Features

## Purpose
Define service types, pricing rules, time estimations, and warranty policies per category.

## Features

| ID | Feature | Description | Business Rules |
|----|---------|-------------|---------------|
| CAT-001 | Category & Pricing | Define service categories (e.g., "LCD Replacement", "Battery Swap"). Each has: base labor price, estimated time, difficulty level | Pricing configurable per tenant |
| CAT-002 | Time Estimation | System suggests estimated completion time based on category + historical data | Phase 2 |
| CAT-003 | Warranty Rules per Category | Define warranty period and conditions per service category | Phase 2 |

## Integration
- **Service**: Category assigned during diagnosis
- **Technician**: Category maps to required skills for assignment recommendation
- **Finance**: Category pricing feeds into quotation and invoice
