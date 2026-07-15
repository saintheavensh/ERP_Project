import { Result } from "../../../../core/Result";

export interface INotificationService {
    sendEmail(to: string, subject: string, body: string): Promise<Result<void>>;
    sendPush(userId: string, title: string, body: string): Promise<Result<void>>;
}
