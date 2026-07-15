import { inject, injectable } from "inversify";
import { Result } from "../../../../core/Result";
import { TYPES } from "../../../../../shared/core/types";
import type { ISettingRepository } from "../../domain/ports/ISettingRepository";
import type { SettingScope } from "../../domain/entities/Setting.entity";

export interface GetSettingDTO {
    key: string;
    scope?: SettingScope;
    module?: string;
    userId?: string;
    storeId?: string;
    defaultValue?: any;
}

@injectable()
export class GetSettingUseCase {
    constructor(
        @inject(TYPES.ISettingRepository) private settingRepo: ISettingRepository
    ) { }

    async execute(dto: GetSettingDTO): Promise<Result<any>> {
        const settingResult = await this.settingRepo.findByKey(
            dto.key,
            dto.scope,
            dto.module
        );

        if (settingResult.isFailure) {
            if (dto.defaultValue !== undefined) {
                return Result.ok(dto.defaultValue);
            }
            return Result.fail(settingResult.errorValue());
        }

        return Result.ok(settingResult.getValue().value);
    }
}
