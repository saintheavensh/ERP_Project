# Business Flows

Detailed breakdown of the core business processes, from user input to database updates.

## 1. Sales Flow (POS)
**Goal**: Process a customer checkout, reduce stock, and record revenue.

### Steps
1.  **Input**: Cashier selects Customer, Items (Products), and Payment Method.
2.  **Validation**:
    *   System checks if **Cash Register** is Open.
    *   If Payment is "Tempo" (Credit), checks Customer's Credit Limit.
3.  **Stock Deduction**:
    *   System finds available **Product Batches** (FIFO - First In First Out).
    *   Deducts quantity from specific batches (`productBatches.currentStock`).
    *   Deducts total stock from product master (`products.stock`).
4.  **Persistence**:
    *   Creates `Sale` record (Header).
    *   Creates `SaleItem` records (Line items linked to batches).
    *   Creates `SalePayment` records.
5.  **Financial Recording (Accounting)**:
    *   **Journal Entry**:
        *   Debit: `Cash` (or `Accounts Receivable` / `Bank`).
        *   Credit: `Sales Revenue`.
        *   Debit: `COGS` (Cost of Goods Sold).
        *   Credit: `Inventory Asset`.
    *   **Cash Register**: Logs transaction if cash is involved.
6.  **Output**: Returns Sale ID and Change amount.

**Involved Modules**: `Sales`, `Inventory`, `Accounting`, `Settings` (Payment Methods), `Customers`.

---

## 2. Purchase Flow (Procurement)
**Goal**: Buy stock from suppliers and update inventory cost.

### Phase 1: Ordering
1.  **Input**: User selects Supplier and Items to order.
2.  **Persistence**: Creates `Purchase` record with status `ORDERED`. Matches items to Supplier's available variants.
3.  **Notify**: Warehouse notified of incoming order.

### Phase 2: Receiving
1.  **Input**: Warehouse staff confirms Quantity Received.
2.  **Persistence**: Updates `PurchaseItem` with `qtyReceived`.
3.  **Status**: Updates Purchase status to `RECEIVED`.

### Phase 3: Verification (Stock Entry)
1.  **Input**: Manager sets Final Buy Price and Sell Price.
2.  **Inventory Update**:
    *   **Creates New Batches**: One batch per item per PO. Sets `initialStock` and `buyPrice`.
    *   **Updates Product Master**: Adds accepted quantity to `products.stock`.
3.  **Financial Recording**:
    *   **Journal Entry**:
        *   Debit: `Inventory Asset` (Total Goods Value).
        *   Debit: `Shipping Expense` (if applicable).
        *   Credit: `Accounts Payable` (Total Vendor Invoice).
4.  **Status**: Updates Purchase status to `VERIFIED`.

**Involved Modules**: `Purchases`, `Inventory`, `Accounting`, `Suppliers`, `Notifications`.

---

## 3. Service Flow (Repair)
**Goal**: Manage device repair lifecycle from intake to payment.

### Phase 1: Intake (Reception)
1.  **Input**: Customer details, Device info, Complaint.
2.  **Validation**: Register must be open.
3.  **Persistence**:
    *   Creates `Service` ticket (`SRV-YYYYMMDD-XXX`).
    *   Logs initial activity.
4.  **Notify**: Assigns Technician and sends WhatsApp to Customer ("Device Received").

### Phase 2: Process (Technician)
1.  **Diagnosis**: Technician updates Diagnosis notes and Cost Estimate.
2.  **Repair**: Status moves to `Working`. Spare parts are added to the ticket.
3.  **Completion**:
    *   Status moves to `Selesai` (Done).
    *   **Inventory Update**: Deducts stock for any **Spare Parts** used from Inventory.
    *   Notify: WhatsApp to Customer ("Device Ready").

### Phase 3: Handover (Cashier)
1.  **Input**: Customer picks up device and pays.
2.  **Validation**: Register must be open.
3.  **Financial Recording**:
    *   **Journal Entry**:
        *   Debit: `Cash`.
        *   Credit: `Service Revenue`.
        *   Debit: `COGS Service` (Spareparts cost).
        *   Credit: `Inventory Asset` (Spareparts value).
4.  **Status**: Updates Service status to `Diambil` (Picked Up).

**Involved Modules**: `Service`, `Inventory` (Spareparts), `Accounting`, `Notifications`, `WhatsApp`, `Customers`.
