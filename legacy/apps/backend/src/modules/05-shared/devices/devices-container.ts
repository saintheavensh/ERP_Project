import { DBContext } from "../../../shared/types/db-context";
import { db } from "../../../shared/infrastructure/database/client";
import { SharedTransactionAuthority } from "../application/services/shared-transaction-authority";
import { DeviceRepositoryAdapter, DeviceScraperAdapter } from "./infrastructure";
import {
    GetDevicesUseCase,
    CreateDeviceUseCase,
    UpdateDeviceUseCase,
    DeleteDeviceUseCase,
    BulkDeleteDevicesUseCase,
    SyncDeviceCompatibilityUseCase,
    GetUnlinkedProductsUseCase,
    ScrapeDeviceUseCase,
    GetDeviceLinksUseCase,
    ImportDeviceFromUrlUseCase
} from "./application";
import { IDeviceFilters, CreateDeviceData, UpdateDeviceData } from "./domain";

// Authority
const authority = new SharedTransactionAuthority(db as any);

// Adapters
const deviceRepository = new DeviceRepositoryAdapter();
const deviceScraper = new DeviceScraperAdapter();

// Use Cases
const getDevicesUC = new GetDevicesUseCase(deviceRepository);
const createDeviceUC = new CreateDeviceUseCase(deviceRepository);
const updateDeviceUC = new UpdateDeviceUseCase(deviceRepository);
const deleteDeviceUC = new DeleteDeviceUseCase(deviceRepository);
const bulkDeleteDevicesUC = new BulkDeleteDevicesUseCase(deviceRepository);
const syncDeviceCompatibilityUC = new SyncDeviceCompatibilityUseCase(deviceRepository);
const getUnlinkedProductsUC = new GetUnlinkedProductsUseCase(deviceRepository);
const scrapeDeviceUC = new ScrapeDeviceUseCase(deviceScraper);
const getDeviceLinksUC = new GetDeviceLinksUseCase(deviceScraper);
const importDeviceFromUrlUC = new ImportDeviceFromUrlUseCase(deviceScraper, createDeviceUC);

/**
 * DevicesFacade — Single entry point for the Devices module.
 * Provides a clean interface for presentation and external layers.
 */
export class DevicesFacade {
    constructor(private readonly authority: SharedTransactionAuthority) { }

    async getAll(tenantId: string, filters: IDeviceFilters) {
        return await this.authority.execute({ tenantId }, async (tx) => {
            return await getDevicesUC.execute(tenantId, filters, tx);
        });
    }

    async getById(tenantId: string, id: string) {
        return await this.authority.execute({ tenantId }, async (tx) => {
            return await deviceRepository.findById(tenantId, id, tx);
        });
    }

    async create(tenantId: string, data: Omit<CreateDeviceData, 'id' | 'brand'> & { brand: string; id?: string }) {
        return await this.authority.execute({ tenantId }, async (tx) => {
            return await createDeviceUC.execute(tenantId, data, tx);
        });
    }

    async update(tenantId: string, id: string, data: UpdateDeviceData) {
        return await this.authority.execute({ tenantId }, async (tx) => {
            return await updateDeviceUC.execute(tenantId, id, data, tx);
        });
    }

    async delete(tenantId: string, id: string) {
        return await this.authority.execute({ tenantId }, async (tx) => {
            return await deleteDeviceUC.execute(tenantId, id, tx);
        });
    }

    async bulkDelete(tenantId: string, ids: string[]) {
        return await this.authority.execute({ tenantId }, async (tx) => {
            return await bulkDeleteDevicesUC.execute(tenantId, ids, tx);
        });
    }

    async syncCompatibility(tenantId: string, deviceId: string) {
        return await this.authority.execute({ tenantId }, async (tx) => {
            return await syncDeviceCompatibilityUC.execute(tenantId, deviceId, tx);
        });
    }

    async getUnlinkedProducts(tenantId: string, limit: number = 50, offset: number = 0) {
        return await this.authority.execute({ tenantId }, async (tx) => {
            return await getUnlinkedProductsUC.execute(tenantId, limit, offset, tx);
        });
    }

    // Unsecured routes do not touch the DB normally
    async scrape(url: string) {
        return await scrapeDeviceUC.execute(url);
    }

    async getLinks(url: string) {
        return await getDeviceLinksUC.execute(url);
    }

    async importFromUrl(tenantId: string, url: string) {
        return await this.authority.execute({ tenantId }, async (tx) => {
            return await importDeviceFromUrlUC.execute(tenantId, url, tx);
        });
    }
}

/** Singleton instance */
export const devicesFacade = new DevicesFacade(authority);

export {
    getDevicesUC,
    createDeviceUC,
    updateDeviceUC,
    deleteDeviceUC,
    bulkDeleteDevicesUC,
    syncDeviceCompatibilityUC,
    getUnlinkedProductsUC,
    scrapeDeviceUC,
    getDeviceLinksUC,
    importDeviceFromUrlUC
};
