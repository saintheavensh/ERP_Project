import { Entity } from "../../../../../core/Entity";
import { Result } from "../../../../../core/Result";

export type DeviceType = 'POS' | 'SCANNER' | 'PRINTER' | 'KIOSK';
export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';

export interface StoreDeviceProps {
    deviceId: string;
    name: string;
    type: DeviceType;
    storeId: string;
    status: DeviceStatus;
    lastPingAt: Date;
    firmwareVersion: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

export class StoreDevice extends Entity<StoreDeviceProps> {
    private constructor(props: StoreDeviceProps, id?: string) {
        super(props, id);
    }

    get deviceId(): string { return this.props.deviceId; }
    get name(): string { return this.props.name; }
    get type(): DeviceType { return this.props.type; }
    get storeId(): string { return this.props.storeId; }
    get status(): DeviceStatus { return this.props.status; }
    get lastPingAt(): Date { return this.props.lastPingAt; }
    get firmwareVersion(): string { return this.props.firmwareVersion; }
    get metadata(): Record<string, any> | undefined { return this.props.metadata; }
    get createdAt(): Date { return this.props.createdAt; }
    get updatedAt(): Date { return this.props.updatedAt; }
    get isOnline(): boolean { return this.props.status === 'ONLINE'; }

    public static create(
        props: Omit<StoreDeviceProps, 'status' | 'lastPingAt' | 'createdAt' | 'updatedAt'>,
        id?: string
    ): Result<StoreDevice> {
        if (!props.deviceId || !props.name || !props.storeId) {
            return Result.fail("Device ID, name, and store ID are required");
        }

        return Result.ok(new StoreDevice({
            ...props,
            status: 'OFFLINE',
            lastPingAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        }, id));
    }

    public markOnline(): void {
        this.props.status = 'ONLINE';
        this.props.lastPingAt = new Date();
        this.props.updatedAt = new Date();
    }

    public markOffline(): void {
        this.props.status = 'OFFLINE';
        this.props.updatedAt = new Date();
    }

    public markMaintenance(): void {
        this.props.status = 'MAINTENANCE';
        this.props.updatedAt = new Date();
    }

    public updateFirmware(version: string): void {
        this.props.firmwareVersion = version;
        this.props.updatedAt = new Date();
    }

    public recordPing(): void {
        this.props.lastPingAt = new Date();
        if (this.props.status === 'OFFLINE') {
            this.props.status = 'ONLINE';
        }
        this.props.updatedAt = new Date();
    }

    public updateMetadata(metadata: Record<string, any>): void {
        this.props.metadata = { ...this.props.metadata, ...metadata };
        this.props.updatedAt = new Date();
    }
}
