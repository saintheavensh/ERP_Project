# B05-INV-002

# Inventory Lifecycle

---

# Purpose

This document defines the complete inventory lifecycle within Universal Service ERP.

It describes how inventory enters, exists within, moves through, and exits the system.

This document serves as the authoritative reference for inventory state transitions.

---

# Overview

Inventory is not static.

Every inventory item moves through a lifecycle.

The system must always know:

* Current State
* Previous State
* Next State
* Responsible User
* Related Transaction

---

# Business Philosophy

Inventory must follow physical reality.

If inventory moves physically:

Inventory must move logically.

If inventory does not move physically:

Inventory must not move logically.

---

# Inventory Lifecycle

Official lifecycle:

```text id="invlife001"
Purchase
↓
Receive
↓
Batch Creation
↓
Available
↓
Usage / Movement
↓
Historical Record
```

---

# Lifecycle Stage 1

Purchase

---

# Description

Inventory begins from purchasing activity.

Examples:

```text id="invlife002"
Purchase Order
```

```text id="invlife003"
Direct Purchase
```

---

# Inventory Impact

None.

At this stage:

Stock does not yet exist.

---

# Rule

Purchase transactions alone do not increase stock.

---

# Lifecycle Stage 2

Receive

---

# Description

Physical goods arrive.

Examples:

```text id="invlife004"
Supplier Delivery
```

```text id="invlife005"
Replacement Shipment
```

---

# Inventory Impact

Stock becomes eligible for inventory.

---

# Rule

Receiving confirms physical possession.

---

# Lifecycle Stage 3

Batch Creation

---

# Description

Every receiving transaction creates inventory batches.

Example:

```text id="invlife006"
LCD-RN12-001
```

---

# Batch Information

Each batch stores:

* Supplier
* Purchase Date
* Cost
* Quantity
* Remaining Quantity

---

# Rule

No inventory may exist without a batch.

---

# Lifecycle Stage 4

Available

---

# Description

Inventory is available for use.

This is the normal operating state.

---

# Available Stock

Inventory may be:

```text id="invlife007"
Available
```

for:

* Service
* Warranty
* Sales

---

# Rule

Available inventory can participate in FIFO consumption.

---

# Lifecycle Stage 5

Consumption

---

# Description

Inventory leaves available stock.

---

# Supported Consumption Types

```text id="invlife008"
Service Consumption
```

```text id="invlife009"
Warranty Consumption
```

```text id="invlife010"
Sales Consumption
```

```text id="invlife011"
Scrap Consumption
```

```text id="invlife012"
Adjustment Consumption
```

---

# Rule

Every consumption transaction must identify:

* Batch
* Quantity
* User
* Reason

---

# Lifecycle Stage 6

Historical Record

---

# Description

Consumed inventory becomes historical data.

Inventory records remain permanently accessible.

---

# Rule

Historical records are never deleted.

---

# Inventory State Model

Official states:

```text id="invlife013"
Available
```

```text id="invlife014"
Reserved
```

```text id="invlife015"
Consumed
```

```text id="invlife016"
Returned
```

```text id="invlife017"
Damaged
```

```text id="invlife018"
Scrapped
```

---

# Available State

Description:

Inventory ready for use.

Allowed transitions:

```text id="invlife019"
Available
↓
Reserved
```

```text id="invlife020"
Available
↓
Consumed
```

```text id="invlife021"
Available
↓
Damaged
```

---

# Reserved State

Future Feature

---

# Description

Inventory allocated to a specific service order.

Example:

```text id="invlife022"
Last LCD unit
reserved for Service Order
SO-001
```

---

# Allowed Transitions

```text id="invlife023"
Reserved
↓
Consumed
```

```text id="invlife024"
Reserved
↓
Available
```

---

# Consumed State

Description:

Inventory has been used.

Examples:

* Installed in service
* Sold to customer
* Used for warranty

---

# Rule

Consumed inventory cannot return to available state.

---

# Returned State

Description:

Inventory returned after a transaction.

---

# Sources

Examples:

* Customer Return
* Supplier Replacement Process

---

# Rule

Returned items require evaluation before reuse.

---

# Damaged State

Description:

Inventory damaged while stored.

Examples:

```text id="invlife025"
Broken LCD
```

```text id="invlife026"
Water Damage
```

---

# Rule

Damaged inventory cannot be sold.

---

# Scrapped State

Description:

Inventory permanently removed.

---

# Examples

```text id="invlife027"
Broken Beyond Repair
```

```text id="invlife028"
Expired Material
```

---

# Rule

Scrapped inventory is irreversible.

---

# Inventory Entry Points

Official inventory entry points:

---

## Purchasing

Primary inventory source.

---

## Supplier Replacement

Replacement inventory received from suppliers.

---

## Customer Return Restock

Approved customer returns.

---

## Manual Adjustment

Owner-authorized corrections.

---

# Inventory Exit Points

Official inventory exit points:

---

## Service Usage

Inventory installed during repair.

---

## Warranty Usage

Inventory used during warranty claims.

---

## Sales

Inventory sold to customers.

---

## Supplier Return

Inventory returned to supplier.

---

## Scrap

Inventory permanently discarded.

---

## Adjustment

Inventory correction.

---

# Lifecycle Validation Rules

---

## Rule 1

Inventory must exist before consumption.

---

## Rule 2

Inventory cannot become negative.

---

## Rule 3

Every movement requires audit history.

---

## Rule 4

Every movement requires a transaction type.

---

## Rule 5

Inventory history is immutable.

---

# Exception Handling

---

## Missing Stock

Action:

Block transaction.

---

## Missing Batch

Action:

Block transaction.

---

## Invalid Quantity

Action:

Reject transaction.

---

## Negative Result

Action:

Reject transaction.

---

# Reporting Requirements

Inventory Lifecycle reporting must support:

* Entry History
* Exit History
* Consumption History
* Damaged History
* Scrap History
* Adjustment History

---

# Relationship To Other Modules

Depends on:

* Purchasing
* Supplier
* Service
* Warranty
* Sales

Referenced by:

* Reporting
* Finance
* Dashboard

---

# Summary

Key decisions:

* Inventory follows a defined lifecycle.
* Purchasing alone does not create stock.
* Receiving creates inventory eligibility.
* Batch creation is mandatory.
* Available inventory is the operational state.
* Consumption permanently removes inventory from available stock.
* Historical records are never deleted.
* Every state transition requires audit tracking.

---

# End Of Document
