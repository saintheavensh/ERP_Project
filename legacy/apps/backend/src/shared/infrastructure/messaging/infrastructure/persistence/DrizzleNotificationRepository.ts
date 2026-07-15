import { eq, desc, sql } from "drizzle-orm";
import { db } from "../../../../../shared/infrastructure/database/client";
import { notifications } from "../../../../../shared/infrastructure/database/schema";
import { DBContext } from "../../../../types/db-context";
import type { INotificationRepository, NotificationType, NotificationChannel } from "../../domain";
import { Notification } from "../../domain";
import { Result } from "../../../../core/Result";
import { injectable } from "inversify";

@injectable()
export class DrizzleNotificationRepository implements INotificationRepository {
    async findByUserId(userId: string, dbOrTx?: DBContext): Promise<Result<Notification[]>> {
        try {
            const client = (dbOrTx as any) || db;
            const results = await client
                .select()
                .from(notifications)
                .where(eq(notifications.userId, userId))
                .orderBy(desc(notifications.createdAt))
                .limit(50);

            const domainNotifications = results.map((row: any) => {
                const notificationResult = Notification.create({
                    userId: row.userId,
                    type: row.type as NotificationType,
                    channel: (row.channel || 'internal') as NotificationChannel,
                    title: row.title,
                    content: row.content || row.message,
                    entityType: row.entityType,
                    entityId: row.entityId
                }, row.id);
                // Manually set props that create() might not allow customizing easily if we want to preserve DB state
                const n = notificationResult.getValue();
                (n as any).props.isRead = row.isRead;
                (n as any).props.readAt = row.readAt;
                (n as any).props.createdAt = row.createdAt;
                return n;
            });

            return Result.ok(domainNotifications);
        } catch (error: any) {
            return Result.fail(`Failed to find notifications: ${error.message}`);
        }
    }

    async findById(id: string, dbOrTx?: DBContext): Promise<Result<Notification | null>> {
        try {
            const client = (dbOrTx as any) || db;
            const [row] = await client
                .select()
                .from(notifications)
                .where(eq(notifications.id, id));

            if (!row) return Result.ok(null);

            const notificationResult = Notification.create({
                userId: row.userId,
                type: row.type as NotificationType,
                channel: (row.channel || 'internal') as NotificationChannel,
                title: row.title,
                content: row.content || row.message,
                entityType: row.entityType,
                entityId: row.entityId
            }, row.id);

            const n = notificationResult.getValue();
            (n as any).props.isRead = row.isRead;
            (n as any).props.readAt = row.readAt;
            (n as any).props.createdAt = row.createdAt;

            return Result.ok(n);
        } catch (error: any) {
            return Result.fail(`Failed to find notification: ${error.message}`);
        }
    }

    async save(notification: Notification, dbOrTx?: DBContext): Promise<Result<void>> {
        try {
            const client = (dbOrTx as any) || db;
            const data = {
                id: notification.id,
                userId: notification.userId,
                type: notification.type,
                channel: notification.channel,
                title: notification.title,
                content: notification.content,
                message: notification.content, // Backward compat with 'message' column if it exists
                isRead: notification.isRead,
                readAt: notification.readAt,
                createdAt: notification.createdAt,
                entityType: notification.entityType,
                entityId: notification.entityId
            };

            await client.insert(notifications)
                .values(data)
                .onConflictDoUpdate({
                    target: notifications.id,
                    set: {
                        isRead: data.isRead,
                        readAt: data.readAt
                    }
                });

            return Result.ok();
        } catch (error: any) {
            return Result.fail(`Failed to save notification: ${error.message}`);
        }
    }
}
