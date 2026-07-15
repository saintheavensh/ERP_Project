import { injectable, inject } from "inversify";
import { TYPES } from "../../../../../core/types";
import type { IDeviceApiGateway, IStoreDeviceRepository } from "../../domain";
import { Result } from "../../../../../core/Result";
import { DeviceStatusDTO, DeviceMapper } from "../mappers/DeviceMapper";

@injectable()
export class GetStoreDeviceStatusUseCase {
    constructor(
        @inject(TYPES.IDeviceApiGateway) private deviceApi: IDeviceApiGateway,
        @inject(TYPES.IStoreDeviceRepository) private deviceRepo: IStoreDeviceRepository
    ) { }

    async execute(deviceId: string): Promise<Result<DeviceStatusDTO>> {
        // Get from local DB first
        const deviceResult = await this.deviceRepo.findByDeviceId(deviceId);

        // Then get real-time status from API
        const statusResult = await this.deviceApi.getDeviceStatus(deviceId);

        if (statusResult.isSuccess) {
            // Update local status if API says different
            if (deviceResult.isSuccess) {
                const device = deviceResult.getValue();
                // Map API status to domain status
                const apiStatus = statusResult.getValue().status;
                if (apiStatus === 'ONLINE') device.markOnline();
                else if (apiStatus === 'OFFLINE') device.markOffline();
                else if (apiStatus === 'MAINTENANCE') device.markMaintenance();

                await this.deviceRepo.save(device);
            }
            return Result.ok(DeviceMapper.toStatusDTO(statusResult.getValue()));
        }

        // Fallback to local data if API fails
        if (deviceResult.isSuccess) {
            return Result.ok(DeviceMapper.toStatusDTO({
                deviceId,
                status: deviceResult.getValue().status as any,
                lastPingAt: deviceResult.getValue().lastPingAt
            }));
        }

        return Result.fail(`Device ${deviceId} not found`);
    }
}
