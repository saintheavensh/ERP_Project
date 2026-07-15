# Inventory Refactoring Plan (3 Small PRs)

This document divides the refactoring into three small pull requests (PRs) to ensure security, ease of review, and avoid massive changes.

## Objective
- Stock mutations are only performed through the inventory module (single gate).
- Sales/Purchases no longer directly update the `products`/`productBatches` tables.
- FIFO remains the same, but its logic is centralized.

## PR-1 (Highest Impact): Centralizing STOCK OUT (Sales → InventoryService)

### Scope
1. Adding a new method to `InventoryService`:
   - `deductStockFIFO(input, dbOrTx)`
2. Moving FIFO logic from `SalesService.createSale` to the above method.
3. `SalesService` only calls `InventoryService.deductStockFIFO(...)`.

### Suggested Input
```typescript
{
  saleId: string;
  items: Array<{
    productId: string;
    variant: string;
    quantity: number;
    unitPrice: string;
  }>;
}
```

### Suggested Output
```typescript
{
  allocations: Array<{
    productId: string;
    variantId: string | null;
    batchId: string;
    quantity: number;
    buyPrice: string;
  }>;
  cogsAmount: number;
}
```

### Acceptance Criteria
- Sales no longer directly perform `tx.update(productBatches)`.
- Sales no longer directly perform `tx.update(products.stock)`.
- FIFO and COGS results are the same as the old behavior.
- Existing sales transaction tests still pass.

## PR-2: Centralizing STOCK IN (Purchases Verify → InventoryService)

### Scope
1. Adding a new method to `InventoryService`:
   - `addStockFromPurchaseVerification(input, dbOrTx)`
2. Moving batch creation and product stock updates from `PurchasesService.verifyAndComplete`.
3. `PurchasesService` only orchestrates document PO and accounting.

### Additional Strengthening
- Validating all items `qtyReceived > 0` is processed during verification.
- Mandatory 1:1 mapping of PO items to verification payload.
- Using `variantId` (not by name) in the verification payload.

### Acceptance Criteria
- Purchases no longer directly insert `productBatches`.
- Purchases no longer directly update `products.stock`.
- `purchase_items.batchId` is still correctly filled.

## PR-3: Consistency Safety Net + Anti-Regression

### Scope
1. Adding a stock consistency helper in the inventory:
   - assert `products.stock === SUM(product_batches.current_stock)` per related product.
2. Running the assertion at the end of `addStock...` and `deductStockFIFO` (in the same transaction).
3. Adding critical test cases:
   - FIFO across 2 batches.
   - Incomplete PO item verification should fail.
   - Variant mismatch should fail.
   - Double verification should fail (idempotency/state guard).

### Acceptance Criteria
- If aggregate stock and batch are not synchronized, the transaction rolls back.
- The above edge case tests are available and pass.

## Implementation Notes
- Keep journal account storage in the accounting layer; sales/purchases only send business data.
- This gradual refactoring maintains a stable external API (endpoints do not need to be heavily changed).
- Start with PR-1 as it quickly reduces cross-module coupling.