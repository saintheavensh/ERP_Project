import { injectable, inject } from "inversify";
import { TYPES } from "../../../../core/types";
import type { INotificationRepository } from "../../domain";
import { Result } from "../../../../core/Result";

export interface MarkNotificationAsReadInput {
    notificationId: string;
}

@injectable()
export class MarkNotificationAsReadUseCase {
    constructor(
        @inject(TYPES.INotificationRepository) private notificationRepository: INotificationRepository
    ) { }

    async execute(input: MarkNotificationAsReadInput): Promise<Result<void>> {
        const notificationResult = await this.notificationRepository.findById(input.notificationId);

        if (notificationResult.isFailure) {
            return Result.fail(notificationResult.errorValue());
        }

        const notification = notificationResult.getValue();
        if (!notification) {
            return Result.fail("Notification not found");
        }

        notification.markAsRead();
        return await this.notificationRepository.save(notification);
    }
}
