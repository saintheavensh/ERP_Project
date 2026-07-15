import { DBContext } from "../../../../../shared/types/db-context";
import { Setting } from "../entities/settings.entity";

export interface ISettingsRepository {
    findByKey(tenantId: string, key: string, tx: DBContext): Promise<Setting | null>;
    upsert(tenantId: string, key: string, value: any, tx: DBContext): Promise<void>;
    factoryReset(tenantId: string, mode: "data" | "full", tx: DBContext): Promise<void>;
}
