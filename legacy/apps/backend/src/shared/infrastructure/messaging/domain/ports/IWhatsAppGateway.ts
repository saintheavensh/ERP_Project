import { Result } from "../../../../core/Result";

export interface IWhatsAppGateway {
    sendMessage(to: string, message: string): Promise<Result<void>>;
    sendTemplate(to: string, template: string, data: any): Promise<Result<void>>;
}
