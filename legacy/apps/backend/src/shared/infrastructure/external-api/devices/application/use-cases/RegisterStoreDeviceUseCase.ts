import { injectable, inject } from "inversify";
import { TYPES } from "../../../../../core/types";
import type { IDeviceApiGateway, IStoreDeviceRepository } from "../../domain";
import { StoreDevice } from "../../domain";
import { Result } from "../../../../../core/Result";
import { RegisterDeviceDTO, DeviceDTO, DeviceMapper } from "../mappers/DeviceMapper";

@injectable()
export class RegisterStoreDeviceUseCase {
    constructor(
        @inject(TYPES.IDeviceApiGateway) private deviceApi: IDeviceApiGateway,
        @inject(TYPES.IStoreDeviceRepository) private deviceRepo: IStoreDeviceRepository
    ) { }

    async execute(dto: RegisterDeviceDTO): Promise<Result<DeviceDTO>> {
        // Register with external API first
        const registration = await this.deviceApi.registerDevice({
            deviceId: dto.deviceId,
            name: dto.name,
            type: dto.type,
            storeId: dto.storeId,
            firmwareVersion: dto.firmwareVersion
        });

        if (registration.isFailure) {
            return Result.fail(`Device registration failed: ${registration.errorValue()}`);
        }

        // Create domain entity
        const deviceResult = StoreDevice.create({
            deviceId: dto.deviceId,
            name: dto.name,
            type: dto.type as any,
            storeId: dto.storeId,
            firmwareVersion: dto.firmwareVersion
        }, registration.getValue().id);

        if (deviceResult.isFailure) {
            return Result.fail(deviceResult.errorValue());
        }

        // Save to local DB
        const saveResult = await this.deviceRepo.save(deviceResult.getValue());
        if (saveResult.isFailure) {
            return Result.fail(saveResult.errorValue());
        }

        return Result.ok(DeviceMapper.toDTO(deviceResult.getValue()));
    }
}
