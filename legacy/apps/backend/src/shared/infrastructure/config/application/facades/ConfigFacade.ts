import { inject, injectable } from "inversify";
import { Result } from "../../../../core/Result";
import { TYPES } from "../../../../../shared/core/types";
import { GetSettingUseCase } from "../use-cases/GetSettingUseCase";
import { UpdateSettingUseCase, UpdateSettingDTO } from "../use-cases/UpdateSettingUseCase";
import { GetModuleSettingsUseCase } from "../use-cases/GetModuleSettingsUseCase";
import { AppConfigService } from "../../AppConfig";

@injectable()
export class ConfigFacade {
    constructor(
        @inject(TYPES.GetSettingUseCase) private getSettingUseCase: GetSettingUseCase,
        @inject(TYPES.UpdateSettingUseCase) private updateSettingUseCase: UpdateSettingUseCase,
        @inject(TYPES.GetModuleSettingsUseCase) private getModuleSettingsUseCase: GetModuleSettingsUseCase,
        @inject(TYPES.AppConfig) private appConfig: AppConfigService
    ) { }

    // For system settings
    async getSystemConfig(key: string, defaultValue?: any): Promise<Result<any>> {
        return this.getSettingUseCase.execute({
            key,
            scope: 'system',
            defaultValue
        });
    }

    // For module-specific settings
    async getModuleConfig(moduleName: string): Promise<Result<Record<string, any>>> {
        return this.getModuleSettingsUseCase.execute(moduleName);
    }

    // For user preferences
    async getUserPreference(userId: string, key: string, defaultValue?: any): Promise<Result<any>> {
        return this.getSettingUseCase.execute({
            key,
            scope: 'user',
            userId,
            defaultValue
        });
    }

    // For store settings
    async getStoreConfig(storeId: string, key: string, defaultValue?: any): Promise<Result<any>> {
        return this.getSettingUseCase.execute({
            key,
            scope: 'store',
            storeId,
            defaultValue
        });
    }

    // Update any setting
    async updateSetting(dto: UpdateSettingDTO): Promise<Result<void>> {
        return this.updateSettingUseCase.execute(dto);
    }

    // Get typed environment variables (from AppConfig)
    get env() {
        return {
            isDevelopment: this.appConfig.isDevelopment,
            databaseUrl: this.appConfig.databaseUrl,
            port: this.appConfig.port,
            // Expose specific vars cleanly as needed
        };
    }
}
