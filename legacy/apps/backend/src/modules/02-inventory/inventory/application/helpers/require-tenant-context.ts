/**
 * requireTenantContext — Guardrail for repository adapters.
 *
 * Extracts __tenantId from a TransactionContext.
 * Throws if missing, empty, or invalid type.
 *
 * Every repository method MUST call this at the start
 * to guarantee tenant isolation.
 */
import type { TransactionContext } from "@shared/types/db-context";

export function requireTenantContext(tx: TransactionContext): string {
    const tenantId = (tx as unknown as Record<string, unknown>).__tenantId;
    if (typeof tenantId !== "string" || tenantId.trim().length === 0) {
        throw new Error(
            "Missing tenant context in transaction. " +
            "All repository operations require tx.__tenantId. " +
            "Ensure the operation flows through InventoryTransactionAuthority."
        );
    }
    return tenantId;
}
