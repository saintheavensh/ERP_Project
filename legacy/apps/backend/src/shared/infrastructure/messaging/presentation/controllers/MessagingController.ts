import { Context } from "hono";
import { injectable, inject } from "inversify";
import { TYPES } from "../../../../core/types";
import { MessagingFacade } from "../../application/facades/MessagingFacade";
import { apiSuccess, apiError } from "../../../../application/middlewares/ResponseHelpers";
import { Logger } from "../../../../utils/logger/Logger";

@injectable()
export class MessagingController {
    constructor(
        @inject(TYPES.MessagingFacade) private readonly messagingFacade: MessagingFacade
    ) { }

    async getUserNotifications(c: Context) {
        try {
            const userId = c.req.query("userId");
            if (!userId) return apiError(c, "userId required", "Validation Error", 400);

            const result = await this.messagingFacade.getUserNotifications(userId);
            if (result.isFailure) return apiError(c, result.errorValue());

            return apiSuccess(c, result.getValue());
        } catch (e: any) {
            new Logger("Legacy").error("MessagingController.getUserNotifications error", e);
            return apiError(c, e.message || String(e));
        }
    }

    async markAsRead(c: Context) {
        try {
            const id = c.req.param("id");
            if (!id) return apiError(c, "id required", "Validation Error", 400);

            const result = await this.messagingFacade.markAsRead(id);
            if (result.isFailure) return apiError(c, result.errorValue());

            return apiSuccess(c, null, "Notification marked as read");
        } catch (e: any) {
            new Logger("Legacy").error("MessagingController.markAsRead error", e);
            return apiError(c, e.message || String(e));
        }
    }

    async sendWhatsApp(c: Context) {
        try {
            const { to, message } = await c.req.json();
            if (!to || !message) return apiError(c, "to and message required", "Validation Error", 400);

            const result = await this.messagingFacade.sendWhatsApp(to, message);
            if (result.isFailure) return apiError(c, result.errorValue());

            return apiSuccess(c, null, "WhatsApp message sent");
        } catch (e: any) {
            new Logger("Legacy").error("MessagingController.sendWhatsApp error", e);
            return apiError(c, e.message || String(e));
        }
    }

    async sendNotification(c: Context) {
        try {
            const data = await c.req.json();
            // Basic validation
            if (!data.userId || !data.channel || !data.title || !data.content) {
                return apiError(c, "Missing required fields (userId, channel, title, content)", "Validation Error", 400);
            }

            // Using the general sendNotificationUseCase logic via facade if available or direct if needed
            // For now, let's expose a generic send via facade or similar
            // Facade currently has specific methods. Let's add a generic one if needed.
            // Using email as an example of specific facade method usage:
            if (data.channel === 'email') {
                const result = await this.messagingFacade.sendEmail(data.to, data.title, data.content, data.userId);
                if (result.isFailure) return apiError(c, result.errorValue());
            } else {
                // Handle other channels...
                return apiError(c, "Channel not supported via this endpoint yet", "Feature Error", 501);
            }

            return apiSuccess(c, null, "Notification dispatched");
        } catch (e: any) {
            new Logger("Legacy").error("MessagingController.sendNotification error", e);
            return apiError(c, e.message || String(e));
        }
    }
}
