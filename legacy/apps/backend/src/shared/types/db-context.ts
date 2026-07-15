import type { PgTransaction } from "drizzle-orm/pg-core";
import type { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import * as schema from "../infrastructure/database/schema";

/**
 * A strictly-typed Transaction Context for cross-module operations.
 * Wraps Drizzle's PgTransaction bound exactly to the application's schema,
 * extended with mandatory tenant and request metadata for SaaS isolation.
 */
export type TransactionContext = PgTransaction<
    NodePgQueryResultHKT,
    typeof schema,
    ExtractTablesWithRelations<typeof schema>
> & {
    readonly tenantId: string;
    readonly requestId: string;
    readonly startedAt: number;
    readonly userId?: string;
};

// Export DBContext temporarily to prevent immediate build breakages in non-inventory modules, 
// but alias it to TransactionContext so it immediately gains type safety everywhere.
export type DBContext = TransactionContext;
