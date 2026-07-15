import { DBContext } from "../../../../../shared/types/db-context";
import { ISettingsRepository } from "../../domain";

export class GetSettingUseCase {
    constructor(private readonly repository: ISettingsRepository) { }

    async execute<T>(tenantId: string, key: string, defaultValue: T, tx: DBContext): Promise<T> {
        const result = await this.repository.findByKey(tenantId, key, tx);
        if (!result) return defaultValue;
        return result.value as T;
    }
}
