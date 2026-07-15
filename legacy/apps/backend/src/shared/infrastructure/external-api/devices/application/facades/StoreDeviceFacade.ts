import { injectable, inject } from "inversify";
import { RegisterStoreDeviceUseCase } from "../use-cases/RegisterStoreDeviceUseCase";
import { GetStoreDeviceStatusUseCase } from "../use-cases/GetStoreDeviceStatusUseCase";
import { PingStoreDeviceUseCase } from "../use-cases/PingStoreDeviceUseCase";
import { Result } from "../../../../../core/Result";
import { RegisterDeviceDTO, DeviceDTO, DeviceStatusDTO } from "../mappers/DeviceMapper";

@injectable()
export class StoreDeviceFacade {
    constructor(
        @inject(RegisterStoreDeviceUseCase) private registerDevice: RegisterStoreDeviceUseCase,
        @inject(GetStoreDeviceStatusUseCase) private getDeviceStatus: GetStoreDeviceStatusUseCase,
        @inject(PingStoreDeviceUseCase) private pingDevice: PingStoreDeviceUseCase
    ) { }

    async register(dto: RegisterDeviceDTO): Promise<Result<DeviceDTO>> {
        return this.registerDevice.execute(dto);
    }

    async getStatus(deviceId: string): Promise<Result<DeviceStatusDTO>> {
        return this.getDeviceStatus.execute(deviceId);
    }

    async ping(deviceId: string): Promise<Result<boolean>> {
        return this.pingDevice.execute(deviceId);
    }
}
