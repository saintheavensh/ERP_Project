import { injectable, inject } from "inversify";
import { TYPES } from "../../../../../core/types";
import type { IDeviceApiGateway, IStoreDeviceRepository } from "../../domain";
import { Result } from "../../../../../core/Result";

@injectable()
export class PingStoreDeviceUseCase {
    constructor(
        @inject(TYPES.IDeviceApiGateway) private deviceApi: IDeviceApiGateway,
        @inject(TYPES.IStoreDeviceRepository) private deviceRepo: IStoreDeviceRepository
    ) { }

    async execute(deviceId: string): Promise<Result<boolean>> {
        const pingResult = await this.deviceApi.ping(deviceId);

        // Update local DB
        const deviceResult = await this.deviceRepo.findByDeviceId(deviceId);
        if (deviceResult.isSuccess) {
            const device = deviceResult.getValue();
            device.recordPing();
            await this.deviceRepo.save(device);
        }

        return pingResult;
    }
}
