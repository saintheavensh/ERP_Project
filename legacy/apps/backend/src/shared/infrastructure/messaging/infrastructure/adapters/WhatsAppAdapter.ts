import { injectable, inject } from "inversify";
import { TYPES } from "../../../../core/types";
import type { IWhatsAppGateway } from "../../domain";
import { Result } from "../../../../core/Result";
import { HttpClient } from "../../../external-api/client/HttpClient";
import { appConfig } from "../../../../infrastructure/config/AppConfig";
import { Logger } from "../../../../utils/logger/Logger";

@injectable()
export class WhatsAppAdapter implements IWhatsAppGateway {
    constructor(
        @inject(TYPES.HttpClient) private httpClient: HttpClient
    ) { }

    async sendMessage(to: string, message: string): Promise<Result<void>> {
        const maxRetries = 3;
        const gatewayUrl = appConfig.whatsappApiUrl;
        const apiKey = appConfig.whatsappApiKey;

        if (!gatewayUrl || !apiKey) {
            return Result.fail("WhatsApp API URL or API Key not configured");
        }

        for (let i = 0; i < maxRetries; i++) {
            try {
                new Logger("Legacy").info(`[WhatsApp] Sending to ${to} (Attempt ${i + 1}/${maxRetries})`);

                const result = await this.httpClient.post<any>(
                    gatewayUrl,
                    {
                        target: to,
                        to: to,
                        number: to,
                        message: message
                    },
                    { 'Authorization': apiKey }
                );

                if (result.isSuccess) {
                    return Result.ok();
                }

                new Logger("Legacy").warn(`[WhatsApp] Attempt ${i + 1} failed: ${result.errorValue()}`);

                if (i < maxRetries - 1) {
                    const delay = 1000 * Math.pow(2, i);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            } catch (error: any) {
                new Logger("Legacy").error(`[WhatsApp] Exception in attempt ${i + 1}: ${error.message}`);
                if (i === maxRetries - 1) {
                    return Result.fail(`WhatsApp send failed after ${maxRetries} retries: ${error.message}`);
                }
            }
        }
        return Result.fail("WhatsApp send failed after multiple retries");
    }

    async sendTemplate(to: string, template: string, data: any): Promise<Result<void>> {
        // Implementation for template sending
        new Logger("Legacy").info(`[WhatsApp] Sending template ${template} to ${to}`);
        return await this.sendMessage(to, `[Template: ${template}] ${JSON.stringify(data)}`);
    }
}
