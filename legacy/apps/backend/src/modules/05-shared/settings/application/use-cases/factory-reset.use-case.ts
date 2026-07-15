import { DBContext } from "../../../../../shared/types/db-context";
import { ISettingsRepository } from "../../domain";

export class FactoryResetUseCase {
    constructor(private readonly repository: ISettingsRepository) { }

    async execute(tenantId: string, mode: "data" | "full", tx: DBContext): Promise<void> {
        await this.repository.factoryReset(tenantId, mode, tx);
    }
}
