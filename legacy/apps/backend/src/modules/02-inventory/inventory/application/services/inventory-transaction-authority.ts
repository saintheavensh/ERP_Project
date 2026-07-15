/**
 * ARCHITECTURAL RULE:
 * All database operations MUST flow through this authority.
 * No module may call db.transaction() directly.
 * Nested transactions must use executeWithExistingTx().
 *
 * InventoryTransactionAuthority — Single entry point for all inventory database operations.
 *
 * All inventory code MUST route through either:
 *   - execute()              → creates a new root transaction
 *   - executeWithExistingTx() → reuses a transaction from a cross-module caller
 *
 * Both paths share _runWithLogging() for deterministic tenant validation,
 * request tracking, and duration logging.
 */
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "@shared/infrastructure/database/schema";
import type { TransactionContext } from "@shared/types/db-context";
import { randomUUID } from "crypto";
import { logger, type LogContext } from "@shared/logging/AppLogger";

export interface AuthorityContext {
    tenantId: string;
    requestId?: string;
}

export class InventoryTransactionAuthority {
    constructor(private readonly db: NodePgDatabase<typeof schema>) { }

    // ─── Section 1: Centralized execution logic ───────────────────────

    /**
     * Shared execution core. Every operation passes through here.
     * Validates tenantId, generates requestId, logs start/success/failure, measures duration.
     */
    private async _runWithLogging<T>(
        tx: TransactionContext,
        context: AuthorityContext,
        handler: (tx: TransactionContext) => Promise<T>
    ): Promise<T> {
        // Tenant invariant — always enforced
        if (typeof context.tenantId !== "string" || context.tenantId.trim().length === 0) {
            throw new Error("InventoryTransactionAuthority: tenantId is strictly mandatory (non-empty string) for all operations.");
        }

        const rid = context.requestId || randomUUID();
        const startedAt = Date.now();
        const logContext: LogContext = { service: "inventory", tenantId: context.tenantId, requestId: rid };

        logger.info("Transaction starting", logContext);

        try {
            const result = await handler(tx);

            const durationMs = Date.now() - startedAt;
            logger.info("Transaction success", logContext, { durationMs });
            return result;
        } catch (error: unknown) {
            const durationMs = Date.now() - startedAt;
            logger.error("Transaction failure", logContext, {
                durationMs,
                error
            });
            throw error;
        }
    }

    // ─── Section 2: Tenant metadata validation ────────────────────────

    /**
     * Validates that the tx's tenant metadata matches the expected tenantId.
     * Throws if:
     *   - tx has no tenant metadata attached
     *   - tx tenantId does not match the provided tenantId
     */
    private validateTxTenant(tx: TransactionContext, tenantId: string): void {
        const txTenantId = tx.tenantId;
        if (!txTenantId) {
            throw new Error("InventoryTransactionAuthority: tx missing tenantId metadata. All transactions must be created through authority.");
        }
        if (txTenantId !== tenantId) {
            throw new Error(
                `InventoryTransactionAuthority: tenant mismatch. tx.tenantId="${txTenantId}" but caller tenantId="${tenantId}". Cross-tenant operations are forbidden.`
            );
        }
    }

    /**
     * Attaches tenant metadata to a raw Drizzle transaction object.
     * Called only by execute() when creating the root transaction.
     */
    private enrichTx(baseTx: any, context: AuthorityContext, requestId: string): TransactionContext {
        return Object.freeze(Object.assign(baseTx, {
            tenantId: context.tenantId,
            requestId,
            startedAt: Date.now()
        })) as unknown as TransactionContext;
    }

    // ─── Section 3: Root transaction entry point ──────────────────────

    /**
     * Creates a new database transaction and runs the handler inside it.
     * Use this when no transaction exists yet (controller → service path).
     *
     * Overloaded:
     *   - execute(context, handler) — preferred new signature
     *   - execute(handler, mutationInput, tenantId, requestId) — deprecated, for external modules
     */
    async execute<T>(
        contextOrHandler: AuthorityContext | ((tx: TransactionContext) => Promise<T>),
        handlerOrMutationInput?: ((tx: TransactionContext) => Promise<T>) | unknown,
        tenantIdLegacy?: string,
        requestIdLegacy?: string
    ): Promise<T> {
        // Resolve overloaded arguments
        let context: AuthorityContext;
        let handler: (tx: TransactionContext) => Promise<T>;

        if (typeof contextOrHandler === "function") {
            /**
             * @deprecated
             * Legacy execute(handler, input, tenantId, requestId) signature.
             * Migrate to execute({ tenantId }, handler).
             */
            handler = contextOrHandler;
            context = {
                tenantId: tenantIdLegacy!,
                ...(requestIdLegacy ? { requestId: requestIdLegacy } : {})
            };
        } else {
            // New signature: execute(context, handler)
            context = contextOrHandler;
            handler = handlerOrMutationInput as (tx: TransactionContext) => Promise<T>;
        }

        const rid = context.requestId || randomUUID();
        const fullContext: AuthorityContext = {
            ...context,
            requestId: rid
        };

        return this.db.transaction(async (baseTx) => {
            const tx = this.enrichTx(baseTx as any, fullContext, rid);
            return this._runWithLogging(tx, fullContext, handler);
        });
    }

    // ─── Section 4: Nested/existing transaction entry point ───────────

    /**
     * Reuses an existing transaction from a cross-module caller.
     * Validates tenant metadata, then runs through shared logging path.
     * Does NOT create a new db.transaction().
     * Does NOT re-freeze the tx (root execute() already froze it).
     */
    async executeWithExistingTx<T>(
        existingTx: TransactionContext,
        context: AuthorityContext,
        handler: (tx: TransactionContext) => Promise<T>
    ): Promise<T> {
        this.validateTxTenant(existingTx, context.tenantId);
        return this._runWithLogging(existingTx, context, handler);
    }
}
