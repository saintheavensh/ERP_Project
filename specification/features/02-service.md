# Service Lifecycle Features

## Purpose
Define the complete service workflow from customer arrival to device return. This is the core operational domain of FlowServ.

## Core Principle
> Every service starts with intake. Not every intake becomes a service.

Quick Service (customer waits) and Regular Service (customer leaves device) use the **same framework** — the only difference is customer presence during repair.

## Service Lifecycle Flow

```
Customer Arrives → Complaint Recorded → Device Registered → Diagnosis
    → Estimate Created → Customer Decision
        → Approved: Service Order Created → Parts Reserved → Repair
            → QC → Completion → Invoice → Payment → Closed
        → Rejected: Intake record kept, reason recorded
```

## Features

| ID | Feature | Description | Business Rules |
|----|---------|-------------|---------------|
| SVC-001 | Service Intake | Record complaint, customer, device. Intake exists independently from repair | Every repair starts with intake |
| SVC-002 | Quick vs Regular | Classify based on customer presence. Same flow, different flag | Classification after approval |
| SVC-003 | Dynamic Intake Forms | Configurable intake form fields per service type | Phase 2 |
| SVC-004 | Service Lifecycle | State machine driven by Flow Engine. States: intake → diagnosis → approval → repair → QC → completion | Transition rules enforced |
| SVC-005 | Service Order | Created after customer approves. Links to Flow Template | Auto-created on approval |
| SVC-006 | Diagnosis & Estimation | Technician records: actual cause, required repair, required parts, estimated cost (labor + parts + time) | Tech/Cashier can prepare |
| SVC-007 | Customer Approval | Send estimate to customer via portal/WA. Customer approves or rejects with 1 tap | Track approval timestamp |
| SVC-008 | Parts Reservation | System auto-reserves required parts when ticket enters repair stage. FIFO batch selection | Soft-lock, not hard deduction |
| SVC-009 | Repair Execution | Technician works on repair. Progress updates. Part consumption (mark as used) | Parts consumed = hard deduction |
| SVC-010 | Change Order | New findings during repair trigger a sub-flow: new estimate → re-approval from customer | Must record reason |
| SVC-011 | Quality Control | Senior technician verifies repair quality via checklist before completion | QC pass required for completion |
| SVC-012 | Completion & Handover | Device ready for pickup. Customer notified. Handover recorded with timestamp | Record who handed over |
| SVC-013 | Cancellation | Cancel ticket with reason. Release reserved parts. Audit logged | Only CS/Branch Mgr |
| SVC-014 | Business Rules | Enforce: device registered before approval, QC before completion, no skip stages | System-enforced via Flow Engine |
| SVC-015 | Reporting | Total intakes, approved/rejected rates, conversion rate, avg repair time, revenue per category | Phase 2 |

## Rejection Reasons (tracked for analytics)
- Price Too Expensive
- Customer Declined
- No Spare Part Available
- Thinking About It
- Other (free text)

## Audit Requirements
All of the following must be auditable: intake creation, complaint changes, device assignment, estimate creation, approval decisions, stage transitions.
