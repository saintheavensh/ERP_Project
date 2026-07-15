import { Result } from "../../../../../core/Result";
import { StoreDevice } from "../entities/StoreDevice.entity";

export interface IStoreDeviceRepository {
    findById(id: string): Promise<Result<StoreDevice>>;
    findByDeviceId(deviceId: string): Promise<Result<StoreDevice>>;
    findByStore(storeId: string): Promise<Result<StoreDevice[]>>;
    findByStatus(status: string): Promise<Result<StoreDevice[]>>;
    save(device: StoreDevice): Promise<Result<void>>;
    delete(id: string): Promise<Result<boolean>>;
}
