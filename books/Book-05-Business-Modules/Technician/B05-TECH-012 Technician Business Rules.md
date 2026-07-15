# B05-TECH-012

# Technician Business Rules

## Purpose

Defines official technician rules governing assignments, repairs, purchasing, reimbursement, and quality control.

---

# Rule 1

Every Service Order must have an assigned technician before repair work begins.

---

# Rule 2

System recommendations assist assignments.

Final assignment decisions remain human-controlled.

---

# Rule 3

Technicians may update repair statuses.

---

# Rule 4

Technicians may not delete Service Orders.

---

# Rule 5

Technicians may request spare parts.

---

# Rule 6

Waiting Parts must be linked to spare part requirements.

---

# Rule 7

Purchase Requests may support multiple Service Orders.

---

# Rule 8

Reserved spare parts belong to the associated Service Order.

---

# Rule 9

External purchases are permitted.

---

# Rule 10

External purchases must include supporting documentation whenever available.

---

# Rule 11

External purchases must be linked to a Service Order.

---

# Rule 12

Technicians may use:

* Personal Funds
* Cashier Funds

for approved external purchases.

---

# Rule 13

Personal fund purchases may generate reimbursement requests.

---

# Rule 14

Reimbursement requires approval before payment.

---

# Rule 15

Repair completion does not automatically activate warranty.

---

# Rule 16

Warranty becomes active only after:

```text id="tb001"
Repair Completed
↓
QC Passed
↓
Warranty Activated
```

---

# Rule 17

Warranty is optional.

---

# Rule 18

Warranty may be configured per repair item.

---

# Rule 19

Failed QC returns the repair to technician workflow.

---

# Rule 20

All technician actions must be auditable.

---

# Summary

Technician Business Rules ensure operational consistency, accountability, and repair quality.

---

# End Of Document
