import { Result } from "../../../../../core/Result";

export interface DeviceRegistration {
    deviceId: string;
    name: string;
    type: string;
    storeId: string;
    firmwareVersion: string;
}

export interface DeviceStatus {
    deviceId: string;
    status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
    lastPingAt: Date;
    batteryLevel?: number;
    errors?: string[];
}

export interface IDeviceApiGateway {
    registerDevice(device: DeviceRegistration): Promise<Result<{ id: string }>>;
    getDeviceStatus(deviceId: string): Promise<Result<DeviceStatus>>;
    sendCommand(deviceId: string, command: string, payload?: any): Promise<Result<any>>;
    ping(deviceId: string): Promise<Result<boolean>>;
}
