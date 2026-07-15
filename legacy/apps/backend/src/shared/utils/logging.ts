import { db } from "../../shared/infrastructure/database/client";
import { activityLogs } from "../../shared/infrastructure/database/schema";
import { Logger } from "../../shared/utils/logger/Logger";

export interface LogParams {
    userId: string;
    action: "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE" | "LOGIN" | "LOGOUT" | "EXPORT" | "ASSIGN";
    entityType: string;
    entityId: string;
    description?: string;
    details?: {
        oldValue?: any;
        newValue?: any;
    };
}

export class ActivityLogService {
    static async log(params: LogParams, dbOrTx: any = db) {
        try {
            await dbOrTx.insert(activityLogs).values({
                userId: params.userId,
                action: params.action as any,
                entityType: params.entityType,
                entityId: params.entityId,
                description: params.description || null,
                oldValue: params.details?.oldValue ? JSON.stringify(params.details.oldValue) : null,
                newValue: params.details?.newValue ? JSON.stringify(params.details.newValue) : null,
            } as any);
            new Logger("Legacy").info(`[ACTIVITY_LOG] ${params.action} on ${params.entityType}:${params.entityId} by User:${params.userId}`);
        } catch (error) {
            new Logger("Legacy").error(`[ACTIVITY_LOG_ERROR] Failed to insert log:`, error);
            // Don't throw error to avoid breaking main flow
        }
    }

    // Helper for simple descriptions
    static async logSimple(userId: string, action: LogParams["action"], entityType: string, entityId: string, description: string, dbOrTx: any = db) {
        return this.log({ userId, action, entityType, entityId, description }, dbOrTx);
    }
}
