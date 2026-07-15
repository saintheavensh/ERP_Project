# Approval Framework

## Purpose
Standardize how approval workflows and threshold-based authorization work across modules.

## Approval Pattern

```
[Action Requested] → [Check Threshold] → [Within Limit?]
    → YES: Auto-approved, proceed
    → NO:  Create ApprovalRequest → Notify approver → Wait
              → Approved: proceed
              → Rejected: record reason, notify requester
```

## Configurable Thresholds (per tenant)

| Action | Default Threshold | Approver |
|--------|------------------|----------|
| Approve service quote | > $200 | Senior Technician |
| Approve service quote | > $1,000 | Branch Manager |
| Manual stock adjustment | > $500 | Branch Manager |
| Void POS transaction | Any amount | Branch Manager |
| Process refund | Any amount | Finance Staff |
| Discount above limit | > 10% | Branch Manager |

## Rules
1. Thresholds are stored as configuration data, not hardcoded
2. Approval requests are tracked with: requester, approver, timestamp, decision, reason
3. Escalation: if approver doesn't respond within configurable time, escalate to next level
4. All approval decisions are recorded in audit log
