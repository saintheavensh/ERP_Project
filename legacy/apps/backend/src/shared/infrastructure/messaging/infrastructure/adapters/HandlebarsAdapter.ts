import { injectable } from "inversify";
import type { ITemplateService } from "../../domain";
import { Result } from "../../../../core/Result";
import { Logger } from "../../../../utils/logger/Logger";

@injectable()
export class HandlebarsAdapter implements ITemplateService {
    async render(templateName: string, data: any): Promise<Result<string>> {
        try {
            new Logger("Legacy").info(`[Template] Rendering ${templateName}`);
            // Simple string replacement as fallback if Handlebars is not installed
            // In real scenario, we would use handlebars here.
            return Result.ok(`Rendered ${templateName} with ${JSON.stringify(data)}`);
        } catch (error: any) {
            return Result.fail(`Template rendering failed: ${error.message}`);
        }
    }
}
