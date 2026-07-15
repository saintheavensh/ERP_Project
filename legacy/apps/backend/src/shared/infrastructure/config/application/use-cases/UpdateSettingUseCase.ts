import { inject, injectable } from "inversify";
import { Result } from "../../../../core/Result";
import { TYPES } from "../../../../../shared/core/types";
import type { ISettingRepository } from "../../domain/ports/ISettingRepository";
import { Setting, SettingScope, SettingType } from "../../domain/entities/Setting.entity";

export interface UpdateSettingDTO {
    key: string;
    value: any;
    type?: SettingType;
    scope?: SettingScope;
    module?: string;
    userId?: string;
    storeId?: string;
    description?: string;
}

@injectable()
export class UpdateSettingUseCase {
    constructor(
        @inject(TYPES.ISettingRepository) private settingRepo: ISettingRepository
    ) { }

    async execute(dto: UpdateSettingDTO): Promise<Result<void>> {
        const settingResult = await this.settingRepo.findByKey(
            dto.key,
            dto.scope,
            dto.module
        );

        if (settingResult.isFailure) {
            const newSettingResult = Setting.create({
                key: dto.key,
                value: dto.value,
                type: dto.type || this.inferType(dto.value),
                scope: dto.scope || 'system',
                module: dto.module,
                userId: dto.userId,
                storeId: dto.storeId,
                description: dto.description,
                isEditable: true
            });

            if (newSettingResult.isFailure) {
                return Result.fail(newSettingResult.errorValue());
            }

            return this.settingRepo.save(newSettingResult.getValue());
        }

        const setting = settingResult.getValue();
        const updateResult = setting.updateValue(dto.value);

        if (updateResult.isFailure) {
            return Result.fail(updateResult.errorValue());
        }

        return this.settingRepo.save(setting);
    }

    private inferType(value: any): SettingType {
        if (typeof value === 'string') return 'string';
        if (typeof value === 'number') return 'number';
        if (typeof value === 'boolean') return 'boolean';
        return 'json';
    }
}
