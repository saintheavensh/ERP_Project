/**
 * Adapter for activity logging. Implements IActivityLogger from domain.
 * Delegates to the existing ActivityLogService infrastructure.
 */
import type { IActivityLogger, ActivityLogEntry } from "@domain/activity-logger.port";
import type { TransactionContext } from "@shared/types/db-context";
import { ActivityLogService } from "@shared/utils/logging";

export class ActivityLoggerAdapter implements IActivityLogger {
    private mapAction(action: string): "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE" | "LOGIN" | "LOGOUT" | "EXPORT" | "ASSIGN" {
        const mapping: Record<string, "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE"> = {
            create: "CREATE",
            update: "UPDATE",
            delete: "DELETE",
            adjustment: "STATUS_CHANGE",
        };
        return mapping[action] ?? "UPDATE";
    }

    async log(entry: ActivityLogEntry, tx: TransactionContext): Promise<void> {
        return ActivityLogService.log(
            {
                userId: entry.userId,
                action: this.mapAction(entry.action),
                entityType: entry.entityType,
                entityId: entry.entityId,
                description: entry.description,
                details: entry.details as Record<string, unknown> | undefined
            },
            tx
        );
    }
}
