import type { INotificationService } from "../../domain";
import { Result } from "../../../../core/Result";
import { injectable, inject } from "inversify";
import { TYPES } from "../../../../core/types";
import { appConfig } from "../../../../infrastructure/config/AppConfig";
import { Logger } from "../../../../utils/logger/Logger";

@injectable()
export class NodemailerAdapter implements INotificationService {
    async sendEmail(to: string, subject: string, body: string): Promise<Result<void>> {
        try {
            new Logger("Legacy").info(`[Email] Sending to ${to}: ${subject}`);
            // Implementation would go here using nodemailer
            // For now, logging success to simulate implementation
            return Result.ok();
        } catch (error: any) {
            return Result.fail(`Email send failed: ${error.message}`);
        }
    }

    async sendPush(userId: string, title: string, body: string): Promise<Result<void>> {
        try {
            new Logger("Legacy").info(`[Push] Sending to ${userId}: ${title}`);
            // Implementation would go here using OneSignal/Firebase
            return Result.ok();
        } catch (error: any) {
            return Result.fail(`Push send failed: ${error.message}`);
        }
    }
}
