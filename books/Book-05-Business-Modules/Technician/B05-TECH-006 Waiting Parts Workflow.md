# B05-TECH-006

# Waiting Parts Workflow

## Purpose

Defines repair handling when required spare parts are unavailable.

---

# Business Philosophy

Waiting Parts should be controlled, traceable, and linked directly to purchasing activities.

---

# Trigger Conditions

Activated when:

```text id="wp001"
Required Part
Not Available
```

---

# Workflow

```text id="wpflow001"
Diagnosis
↓
Required Part Identified
↓
Waiting Parts
↓
Purchase Request
↓
Part Arrival
↓
Reserved
↓
Repair Continues
```

---

# Purchase Request Generation

Supported:

### Automatic Draft PR

System may automatically prepare Purchase Requests.

---

### Manual Review

Owner or Purchasing Team approves final request.

---

# Multi-Service Support

One Purchase Request may support:

```text id="wp002"
SO-001
SO-002
SO-003
```

simultaneously.

---

# Service Order Tracking

Every requested part tracks:

* Service Order
* Device
* Customer
* Requested Quantity

---

# Receiving Process

Upon receiving:

```text id="wp003"
Part Received
↓
Reserved Automatically
↓
Assigned To Service Order
```

---

# Reservation Rules

Reserved inventory cannot be used by other Service Orders without authorization.

---

# Visibility

Waiting Parts queue visible to:

* Technician
* Purchasing
* Owner

---

# Dashboard Metrics

Provides:

* Waiting Parts Count
* Average Waiting Time
* Parts Outstanding

---

# Summary

Waiting Parts Workflow ensures spare part shortages are tracked and resolved efficiently.

---

# End Of Document
