import { Entity } from "../../../../core/Entity";
import { Result } from "../../../../core/Result";

export type SettingType = 'string' | 'number' | 'boolean' | 'json';
export type SettingScope = 'system' | 'module' | 'user' | 'store';

export interface SettingProps {
    key: string;
    value: any;
    type: SettingType;
    scope: SettingScope;
    module?: string | null;
    userId?: string | null;
    storeId?: string | null;
    description?: string | null;
    isEditable: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export class Setting extends Entity<SettingProps> {
    private constructor(props: SettingProps, id?: string) {
        super(props, id);
    }

    get key(): string { return this.props.key; }
    get value(): any { return this.props.value; }
    get type(): SettingType { return this.props.type; }
    get scope(): SettingScope { return this.props.scope; }
    get isEditable(): boolean { return this.props.isEditable; }

    public static create(
        props: Omit<SettingProps, 'createdAt' | 'updatedAt'>,
        id?: string
    ): Result<Setting> {
        if (!props.key || props.value === undefined) {
            return Result.fail("Setting key and value are required");
        }

        if (!this.validateType(props.value, props.type)) {
            return Result.fail(`Value does not match type ${props.type}`);
        }

        return Result.ok(new Setting({
            ...props,
            createdAt: new Date(),
            updatedAt: new Date()
        }, id));
    }

    public updateValue(newValue: any): Result<void> {
        if (!this.props.isEditable) {
            return Result.fail(`Setting ${this.props.key} is not editable`);
        }

        if (!Setting.validateType(newValue, this.props.type)) {
            return Result.fail(`New value does not match type ${this.props.type}`);
        }

        this.props.value = newValue;
        this.props.updatedAt = new Date();
        return Result.ok();
    }

    private static validateType(value: any, type: SettingType): boolean {
        switch (type) {
            case 'string':
                return typeof value === 'string';
            case 'number':
                return typeof value === 'number' && !isNaN(value);
            case 'boolean':
                return typeof value === 'boolean';
            case 'json':
                try {
                    if (typeof value === 'object') return true;
                    JSON.stringify(value);
                    return true;
                } catch {
                    return false;
                }
            default:
                return false;
        }
    }
}
