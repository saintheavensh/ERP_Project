import { inject, injectable } from "inversify";
import { Result } from "../../../../core/Result";
import { TYPES } from "../../../../../shared/core/types";
import type { ISettingRepository } from "../../domain/ports/ISettingRepository";

@injectable()
export class GetModuleSettingsUseCase {
    constructor(
        @inject(TYPES.ISettingRepository) private settingRepo: ISettingRepository
    ) { }

    async execute(moduleName: string): Promise<Result<Record<string, any>>> {
        const settingsResult = await this.settingRepo.findByScope('module', moduleName);

        if (settingsResult.isFailure) {
            return Result.ok({}); // Return empty object if no settings found
        }

        const settings = settingsResult.getValue();
        const result: Record<string, any> = {};

        for (const setting of settings) {
            result[setting.key] = setting.value;
        }

        return Result.ok(result);
    }
}
