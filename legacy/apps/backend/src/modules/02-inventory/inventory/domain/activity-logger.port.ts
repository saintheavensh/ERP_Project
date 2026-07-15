import { TransactionContext } from "@shared/types/db-context";

/**
 * Port for activity logging. Keeps use cases independent of logging infrastructure.
 */
export interface ActivityLogEntry {
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    description: string;
    details?: unknown;
}

export interface IActivityLogger {
    log(entry: ActivityLogEntry, tx: TransactionContext): Promise<void>;
}
