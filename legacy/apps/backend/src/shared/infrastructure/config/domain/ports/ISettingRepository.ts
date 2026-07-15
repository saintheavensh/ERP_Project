import { Result } from "../../../../core/Result";
import { Setting, SettingScope } from "../entities/Setting.entity";

export interface ISettingRepository {
    findByKey(key: string, scope?: SettingScope, module?: string): Promise<Result<Setting>>;
    findByScope(scope: SettingScope, module?: string, userId?: string, storeId?: string): Promise<Result<Setting[]>>;
    save(setting: Setting): Promise<Result<void>>;
    delete(key: string, scope?: SettingScope): Promise<Result<boolean>>;
}
