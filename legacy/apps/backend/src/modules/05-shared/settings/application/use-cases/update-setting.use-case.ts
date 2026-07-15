import { DBContext } from "../../../../../shared/types/db-context";
import { ISettingsRepository } from "../../domain";

export class UpdateSettingUseCase {
    constructor(private readonly repository: ISettingsRepository) { }

    async execute<T>(tenantId: string, key: string, value: T, tx: DBContext): Promise<void> {
        await this.repository.upsert(tenantId, key, value, tx);
    }
}
