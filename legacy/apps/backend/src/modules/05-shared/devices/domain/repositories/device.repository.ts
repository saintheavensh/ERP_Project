import { DBContext } from "../../../../../shared/types/db-context";
import { Device, CreateDeviceData, UpdateDeviceData } from "../entities/device.entity";

export interface IDeviceFilters {
    search?: string;
    limit?: number;
    offset?: number;
    brand?: string;
}

export interface IDeviceRepository {
    findAll(tenantId: string, filters: IDeviceFilters, tx: DBContext): Promise<Device[]>;
    findById(tenantId: string, id: string, tx: DBContext): Promise<Device | null>;
    create(tenantId: string, data: CreateDeviceData, tx: DBContext): Promise<Device>;
    update(tenantId: string, id: string, data: UpdateDeviceData, tx: DBContext): Promise<Device>;
    delete(tenantId: string, id: string, tx: DBContext): Promise<Device>;
    bulkDelete(tenantId: string, ids: string[], tx: DBContext): Promise<Device[]>;

    // Compatibility / Unlinked
    getUnlinkedProducts(tenantId: string, limit: number, offset: number, tx: DBContext): Promise<any[]>;
    findProductsByName(tenantId: string, name: string, tx: DBContext): Promise<any[]>;
    addCompatibilityLinks(tenantId: string, links: { productId: string; deviceId: string }[], tx: DBContext): Promise<void>;
}
