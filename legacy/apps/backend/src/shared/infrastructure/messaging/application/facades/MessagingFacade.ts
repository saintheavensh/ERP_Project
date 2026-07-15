import { injectable } from "inversify";
import { SendNotificationUseCase } from "../use-cases/SendNotificationUseCase";
import { SendWhatsAppUseCase } from "../use-cases/SendWhatsAppUseCase";
import { GetNotificationsUseCase } from "../use-cases/GetNotificationsUseCase";
import { MarkNotificationAsReadUseCase } from "../use-cases/MarkNotificationAsReadUseCase";
import { Result } from "../../../../core/Result";
import { Notification, NotificationType, NotificationChannel } from "../../domain";

export interface NotificationDTO {
    id: string;
    userId: string;
    type: string;
    channel: string;
    title: string;
    content: string;
    isRead: boolean;
    readAt: Date | null;
    createdAt: Date;
    entityType?: string;
    entityId?: string;
}

@injectable()
export class MessagingFacade {
    constructor(
        private sendNotificationUseCase: SendNotificationUseCase,
        private sendWhatsAppUseCase: SendWhatsAppUseCase,
        private getNotificationsUseCase: GetNotificationsUseCase,
        private markAsReadUseCase: MarkNotificationAsReadUseCase
    ) { }

    async sendEmail(to: string, subject: string, body: string, userId: string = "system"): Promise<Result<void>> {
        return await this.sendNotificationUseCase.execute({
            userId,
            channel: 'email',
            type: 'service_update' as NotificationType,
            title: subject,
            content: body,
            subject,
            to
        });
    }

    async sendWhatsApp(to: string, message: string): Promise<Result<void>> {
        return await this.sendWhatsAppUseCase.execute({ to, message });
    }

    async getUserNotifications(userId: string): Promise<Result<NotificationDTO[]>> {
        const result = await this.getNotificationsUseCase.execute({ userId });
        if (result.isFailure) return Result.fail(result.errorValue());

        const dtos: NotificationDTO[] = result.getValue().map(n => ({
            id: n.id,
            userId: n.userId,
            type: n.type,
            channel: n.channel,
            title: n.title,
            content: n.content,
            isRead: n.isRead,
            readAt: n.readAt,
            createdAt: n.createdAt,
            entityType: n.entityType,
            entityId: n.entityId
        }));

        return Result.ok(dtos);
    }

    async sendNotification(input: {
        userId: string;
        type: string;
        channel: string;
        title: string;
        content: string;
        entityType?: string;
        entityId?: string;
    }): Promise<Result<void>> {
        return await this.sendNotificationUseCase.execute({
            ...input,
            type: input.type as NotificationType,
            channel: input.channel as NotificationChannel
        });
    }

    async markAsRead(notificationId: string): Promise<Result<void>> {
        return await this.markAsReadUseCase.execute({ notificationId });
    }
}
