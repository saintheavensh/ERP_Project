import { injectable, inject } from "inversify";
import { TYPES } from "../../../../../core/types";
import type { IDeviceApiGateway, DeviceRegistration, ApiDeviceStatus } from "../../domain";
import { Result } from "../../../../../core/Result";
import { HttpClient } from "../../../client/HttpClient";
import { AppConfigService } from "../../../../config/AppConfig";
import { Logger } from "../../../../../../shared/utils/logger/Logger";

@injectable()
export class DeviceApiAdapter implements IDeviceApiGateway {
    constructor(
        @inject(TYPES.HttpClient) private httpClient: HttpClient,
        @inject(TYPES.AppConfig) private config: AppConfigService
    ) { }

    async registerDevice(device: DeviceRegistration): Promise<Result<{ id: string }>> {
        new Logger("Legacy").info(`[DeviceAPI] Registering device ${device.deviceId}`);
        return this.httpClient.post('/devices/register', device, {
            'X-API-Key': this.config.deviceApiKey
        });
    }

    async getDeviceStatus(deviceId: string): Promise<Result<ApiDeviceStatus>> {
        new Logger("Legacy").info(`[DeviceAPI] Getting status for ${deviceId}`);
        return this.httpClient.get(`/devices/${deviceId}/status`, {
            'X-API-Key': this.config.deviceApiKey
        });
    }

    async sendCommand(deviceId: string, command: string, payload?: any): Promise<Result<any>> {
        new Logger("Legacy").info(`[DeviceAPI] Sending command ${command} to ${deviceId}`);
        return this.httpClient.post(`/devices/${deviceId}/command`, { command, payload }, {
            'X-API-Key': this.config.deviceApiKey
        });
    }

    async ping(deviceId: string): Promise<Result<boolean>> {
        new Logger("Legacy").info(`[DeviceAPI] Pinging ${deviceId}`);
        const result = await this.httpClient.get<any>(`/devices/${deviceId}/ping`, {
            'X-API-Key': this.config.deviceApiKey
        });
        return result.isSuccess ? Result.ok(true) : Result.fail("Ping failed");
    }
}
