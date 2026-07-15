import { injectable, inject } from "inversify";
import { TYPES } from "../../../../core/types";
import type { INotificationService, INotificationRepository, NotificationChannel, NotificationType } from "../../domain";
import { Notification } from "../../domain";
import { Result } from "../../../../core/Result";

export interface SendNotificationInput {
    userId: string;
    type: NotificationType;
    channel: NotificationChannel;
    title: string;
    content: string;
    entityType?: string;
    entityId?: string;
    subject?: string; // For email
    to?: string; // For email/whatsapp if userId lookup is not enough
}

@injectable()
export class SendNotificationUseCase {
    constructor(
        @inject(TYPES.INotificationService) private notificationService: INotificationService,
        @inject(TYPES.INotificationRepository) private notificationRepository: INotificationRepository
    ) { }

    async execute(input: SendNotificationInput): Promise<Result<void>> {
        // 1. Create and persist notification entity
        const notificationResult = Notification.create({
            userId: input.userId,
            type: input.type,
            channel: input.channel,
            title: input.title,
            content: input.content,
            entityType: input.entityType,
            entityId: input.entityId
        });

        if (notificationResult.isFailure) {
            return Result.fail(notificationResult.errorValue());
        }

        const notification = notificationResult.getValue();
        const saveResult = await this.notificationRepository.save(notification);
        if (saveResult.isFailure) {
            return Result.fail(`Failed to save notification: ${saveResult.errorValue()}`);
        }

        // 2. Dispatch to external services based on channel
        if (input.channel === 'email' && input.to && input.subject) {
            return await this.notificationService.sendEmail(input.to, input.subject, input.content);
        }

        // Add push or other channel logic here if needed
        return Result.ok();
    }
}
