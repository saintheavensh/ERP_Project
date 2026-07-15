import { inject, injectable } from "inversify";
import { Result } from "../../../../core/Result";
import { TYPES } from "../../../../../shared/core/types";
import type { ISettingRepository } from "../../domain/ports/ISettingRepository";
import { Setting, SettingScope, SettingType } from "../../domain/entities/Setting.entity";
import { DrizzleClient } from "../../../database/DrizzleClient";
import { settings } from "../../../../../shared/infrastructure/database/schema";
import { eq, and } from "drizzle-orm";

@injectable()
export class DrizzleSettingRepository implements ISettingRepository {
    constructor(@inject(TYPES.DrizzleClient) private db: DrizzleClient) { }

    async findByKey(key: string, scope?: SettingScope, module?: string): Promise<Result<Setting>> {
        try {
            const conditions = [eq(settings.key, key)];
            if (scope) conditions.push(eq(settings.scope, scope));
            if (module) conditions.push(eq(settings.module, module));

            const result = await this.db.getClient().query.settings.findFirst({
                where: and(...conditions)
            });

            if (!result) {
                return Result.fail(`Setting ${key} not found`);
            }

            return this.toDomain(result);
        } catch (error: any) {
            return Result.fail(`Database error: ${error.message}`);
        }
    }

    async findByScope(scope: SettingScope, module?: string, userId?: string, storeId?: string): Promise<Result<Setting[]>> {
        try {
            const conditions = [eq(settings.scope, scope)];
            if (module) conditions.push(eq(settings.module, module));
            if (userId) conditions.push(eq(settings.userId, userId));
            if (storeId) conditions.push(eq(settings.storeId, storeId));

            const results = await this.db.getClient().query.settings.findMany({
                where: and(...conditions)
            });

            const entities: Setting[] = [];
            for (const row of results) {
                const settingResult = this.toDomain(row);
                if (settingResult.isSuccess) {
                    entities.push(settingResult.getValue());
                }
            }

            return Result.ok(entities);
        } catch (error: any) {
            return Result.fail(`Database error: ${error.message}`);
        }
    }

    async save(setting: Setting): Promise<Result<void>> {
        try {
            await this.db.getClient().insert(settings).values({
                key: setting.key,
                value: setting.value,
                type: setting.type,
                scope: setting.scope,
                module: setting.props.module,
                userId: setting.props.userId,
                storeId: setting.props.storeId,
                description: setting.props.description,
                isEditable: setting.isEditable,
                createdAt: setting.props.createdAt,
                updatedAt: setting.props.updatedAt
            }).onConflictDoUpdate({
                target: settings.key,
                set: {
                    value: setting.value,
                    type: setting.type,
                    scope: setting.scope,
                    module: setting.props.module,
                    userId: setting.props.userId,
                    storeId: setting.props.storeId,
                    description: setting.props.description,
                    isEditable: setting.isEditable,
                    updatedAt: setting.props.updatedAt
                }
            });

            return Result.ok();
        } catch (error: any) {
            return Result.fail(`Database error: ${error.message}`);
        }
    }

    async delete(key: string, scope?: SettingScope): Promise<Result<boolean>> {
        try {
            const conditions = [eq(settings.key, key)];
            if (scope) conditions.push(eq(settings.scope, scope));

            const result = await this.db.getClient().delete(settings).where(and(...conditions)).returning();

            return Result.ok(result.length > 0);
        } catch (error: any) {
            return Result.fail(`Database error: ${error.message}`);
        }
    }

    private toDomain(raw: any): Result<Setting> {
        return Setting.create({
            key: raw.key,
            value: raw.value,
            type: raw.type as SettingType,
            scope: raw.scope as SettingScope,
            module: raw.module,
            userId: raw.userId,
            storeId: raw.storeId,
            description: raw.description,
            isEditable: raw.isEditable
        });
    }
}
