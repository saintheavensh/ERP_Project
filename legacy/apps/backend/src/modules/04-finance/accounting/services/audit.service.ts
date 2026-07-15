import { auditLogs } from "../../../../shared/infrastructure/database/schema";
import { desc, eq, and } from "drizzle-orm";
import { TransactionContext } from "../../../../shared/types/db-context";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "VOID" | "POST" | "CLOSE" | "PAY";

export interface AuditLogInput {
    userId?: string | null | undefined;
    action: AuditAction;
    entityType: string;
    entityId: string;
    tableName: string;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
}

export class AuditService {
    /**
     * Create an audit log entry
     */
    static async log(tenantId: string, input: AuditLogInput, tx: TransactionContext): Promise<void> {
        await tx.insert(auditLogs).values({
            tenantId,
            userId: input.userId,
            action: input.action,
            entityType: input.entityType,
            entityId: input.entityId,
            tableName: input.tableName,
            oldValues: input.oldValues,
            newValues: input.newValues,
            reason: input.reason,
            ipAddress: input.ipAddress,
            userAgent: input.userAgent,
        });
    }

    /**
     * Get audit logs for a specific entity
     */
    static async getByEntity(tenantId: string, entityType: string, entityId: string, tx: TransactionContext) {
        return tx
            .select()
            .from(auditLogs)
            .where(
                and(
                    eq(auditLogs.tenantId, tenantId),
                    eq(auditLogs.entityType, entityType),
                    eq(auditLogs.entityId, entityId)
                )
            )
            .orderBy(desc(auditLogs.createdAt));
    }

    /**
     * Get audit logs with pagination and optional filtering
     */
    static async getAll(tenantId: string, tx: TransactionContext, filters: { limit?: number; offset?: number; entityType?: string; entityId?: string } = {}) {
        const { limit = 100, offset = 0, entityType, entityId } = filters;

        const conditions = [eq(auditLogs.tenantId, tenantId)];
        if (entityType) conditions.push(eq(auditLogs.entityType, entityType));
        if (entityId) conditions.push(eq(auditLogs.entityId, entityId));

        const query = tx.query.auditLogs.findMany({
            where: and(...conditions),
            limit,
            offset,
            orderBy: [desc(auditLogs.createdAt)],
            with: {
                user: true
            }
        });

        return await query;
    }
}
