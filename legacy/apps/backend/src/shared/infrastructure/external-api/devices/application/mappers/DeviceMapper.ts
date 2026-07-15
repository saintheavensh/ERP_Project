import { Result } from "../../../../../core/Result";
import { StoreDevice } from "../../domain/entities/StoreDevice.entity";
import type { DeviceStatus as ApiDeviceStatus } from "../../domain/ports/IDeviceApiGateway";

export interface RegisterDeviceDTO {
    deviceId: string;
    name: string;
    type: 'POS' | 'SCANNER' | 'PRINTER' | 'KIOSK';
    storeId: string;
    firmwareVersion: string;
}

export interface DeviceDTO {
    id: string;
    deviceId: string;
    name: string;
    type: string;
    status: string;
    storeId: string;
    lastPingAt: string;
    firmwareVersion: string;
}

export interface DeviceStatusDTO {
    deviceId: string;
    status: string;
    lastPingAt: string;
    batteryLevel?: number;
    errors?: string[];
}

export class DeviceMapper {
    public static toDTO(device: StoreDevice): DeviceDTO {
        return {
            id: device.id,
            deviceId: device.deviceId,
            name: device.name,
            type: device.type,
            status: device.status,
            storeId: device.storeId,
            lastPingAt: device.lastPingAt.toISOString(),
            firmwareVersion: device.firmwareVersion
        };
    }

    public static toStatusDTO(status: ApiDeviceStatus): DeviceStatusDTO {
        return {
            deviceId: status.deviceId,
            status: status.status,
            lastPingAt: status.lastPingAt.toISOString(),
            batteryLevel: status.batteryLevel,
            errors: status.errors
        };
    }

    public static toPersistence(device: StoreDevice): any {
        return {
            id: device.id,
            deviceId: device.deviceId,
            name: device.name,
            type: device.type,
            status: device.status,
            storeId: device.storeId,
            lastPingAt: device.lastPingAt,
            firmwareVersion: device.firmwareVersion
        };
    }

    public static toDomain(raw: any): Result<StoreDevice> {
        return StoreDevice.create({
            deviceId: raw.deviceId,
            name: raw.name,
            type: raw.type,
            storeId: raw.storeId,
            firmwareVersion: raw.firmwareVersion
        }, raw.id);
    }
}
