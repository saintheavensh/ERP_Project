import { SettingsRepositoryAdapter } from "./infrastructure";
import { db } from "../../../shared/infrastructure/database/client";
import { SharedTransactionAuthority } from "../application/services/shared-transaction-authority";
import {
    GetSettingUseCase,
    UpdateSettingUseCase,
    GetAllSettingsUseCase,
    FactoryResetUseCase
} from "./application";

// Authority
const authority = new SharedTransactionAuthority(db as any);

// Adapters
const settingsRepository = new SettingsRepositoryAdapter();

// Use Cases
const getSettingUC = new GetSettingUseCase(settingsRepository);
const updateSettingUC = new UpdateSettingUseCase(settingsRepository);
const getAllSettingsUC = new GetAllSettingsUseCase(getSettingUC);
const factoryResetUC = new FactoryResetUseCase(settingsRepository);

/**
 * SettingsService — Facade for external and presentation layers.
 * Provides a clean interface for managing application-wide configurations.
 */
export class SettingsService {
    constructor(private readonly authority: SharedTransactionAuthority) { }

    async get<T>(tenantId: string, key: string, defaultValue: T) {
        return await this.authority.execute({ tenantId }, async (tx) => {
            return await getSettingUC.execute(tenantId, key, defaultValue, tx);
        });
    }

    async set<T>(tenantId: string, key: string, value: T) {
        return await this.authority.execute({ tenantId }, async (tx) => {
            await updateSettingUC.execute(tenantId, key, value, tx);
        });
    }

    async getAll(tenantId: string) {
        return await this.authority.execute({ tenantId }, async (tx) => {
            return await getAllSettingsUC.execute(tenantId, tx);
        });
    }

    async factoryReset(tenantId: string, mode: "data" | "full") {
        return await this.authority.execute({ tenantId }, async (tx) => {
            await factoryResetUC.execute(tenantId, mode, tx);
        });
    }

    // --- Legacy Helper Methods for Adapters ---

    async getWhatsAppSettings(tenantId: string) {
        return await this.get(tenantId, "whatsapp", {
            enabled: false,
            autoSendOnNewService: false,
            newServiceTemplate: "",
            autoSendOnStatusChange: false,
            statusUpdateTemplate: "",
            autoSendOnComplete: false,
            readyForPickupTemplate: ""
        });
    }

    async getServiceSettings(tenantId: string) {
        return await this.get<{ warrantyPresets: { label: string, days: number }[] }>(tenantId, "service", {
            warrantyPresets: []
        });
    }

    async getPaymentMethods(tenantId: string) {
        return await this.get(tenantId, "payment_methods", []);
    }
}

/** Singleton instance */
export const settingsService = new SettingsService(authority);

export {
    getSettingUC,
    updateSettingUC,
    getAllSettingsUC,
    factoryResetUC
};
