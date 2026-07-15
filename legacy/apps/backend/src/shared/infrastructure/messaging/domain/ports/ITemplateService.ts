import { Result } from "../../../../core/Result";

export interface ITemplateService {
    render(templateName: string, data: any): Promise<Result<string>>;
}
