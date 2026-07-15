import { Context } from "hono";
import { settingsService, SettingsService } from "../settings-container";
import {
    PaymentMethodConfig, StoreInfo, ReceiptSettings,
    ServiceSettings, WhatsAppSettings, CommissionSettings,
    AccountMappingSettings, GeneralSettings, TaxSettings,
    SystemSettings
} from "../domain";
import {
    DEFAULT_PAYMENT_METHODS, DEFAULT_STORE_INFO, DEFAULT_RECEIPT_SETTINGS,
    DEFAULT_SERVICE_SETTINGS, DEFAULT_WHATSAPP_SETTINGS, DEFAULT_COMMISSION_SETTINGS,
    DEFAULT_ACCOUNT_MAPPINGS, DEFAULT_GENERAL_SETTINGS, DEFAULT_TAX_SETTINGS,
    DEFAULT_SYSTEM_SETTINGS, DEFAULT_ROLE_BEHAVIOR
} from "../application";
import { apiSuccess, apiError } from "../../../../shared/application/middlewares/ResponseHelpers";
import type { RoleBehavior } from "../../../../../../../packages/shared/src/types/service";

export class SettingsController {
    constructor(
        private readonly service: SettingsService = settingsService
    ) { }

    async getAll(c: Context) {
        try {
            const user = c.get("user");
            const all = await this.service.getAll(user.tenantId);
            return apiSuccess(c, all);
        } catch (e: any) {
            return apiError(c, e, "Failed to fetch settings");
        }
    }

    async getPaymentMethods(c: Context) {
        try {
            const user = c.get("user");
            const config = await this.service.get(user.tenantId, "payment_methods", DEFAULT_PAYMENT_METHODS);
            return apiSuccess(c, config);
        } catch (e: any) {
            return apiError(c, e, "Failed to fetch payment methods");
        }
    }

    async setPaymentMethods(c: Context) {
        try {
            const user = c.get("user");
            const body = await c.req.json<PaymentMethodConfig>();
            await this.service.set(user.tenantId, "payment_methods", body);
            return apiSuccess(c, null, "Payment methods updated");
        } catch (e: any) {
            return apiError(c, e, "Failed to update payment methods");
        }
    }

    async getStoreInfo(c: Context) {
        try {
            const user = c.get("user");
            const info = await this.service.get(user.tenantId, "store_info", DEFAULT_STORE_INFO);
            return apiSuccess(c, info);
        } catch (e: any) {
            return apiError(c, e, "Failed to fetch store info");
        }
    }

    async setStoreInfo(c: Context) {
        try {
            const user = c.get("user");
            const body = await c.req.json<StoreInfo>();
            await this.service.set(user.tenantId, "store_info", body);
            return apiSuccess(c, null, "Store info updated");
        } catch (e: any) {
            return apiError(c, e, "Failed to update store info");
        }
    }

    async getReceiptSettings(c: Context) {
        try {
            const user = c.get("user");
            const settings = await this.service.get(user.tenantId, "receipt_settings", DEFAULT_RECEIPT_SETTINGS);
            return apiSuccess(c, settings);
        } catch (e: any) {
            return apiError(c, e, "Failed to fetch receipt settings");
        }
    }

    async setReceiptSettings(c: Context) {
        try {
            const user = c.get("user");
            const body = await c.req.json<ReceiptSettings>();
            await this.service.set(user.tenantId, "receipt_settings", body);
            return apiSuccess(c, null, "Receipt settings updated");
        } catch (e: any) {
            return apiError(c, e, "Failed to update receipt settings");
        }
    }

    async getServiceSettings(c: Context) {
        try {
            const user = c.get("user");
            const settings = await this.service.get(user.tenantId, "service_settings", DEFAULT_SERVICE_SETTINGS);
            return apiSuccess(c, settings);
        } catch (e: any) {
            return apiError(c, e, "Failed to fetch service settings");
        }
    }

    async setServiceSettings(c: Context) {
        try {
            const user = c.get("user");
            const body = await c.req.json<ServiceSettings>();
            await this.service.set(user.tenantId, "service_settings", body);
            return apiSuccess(c, null, "Service settings updated");
        } catch (e: any) {
            return apiError(c, e, "Failed to update service settings");
        }
    }

    async getWhatsAppSettings(c: Context) {
        try {
            const user = c.get("user");
            const settings = await this.service.get(user.tenantId, "whatsapp_settings", DEFAULT_WHATSAPP_SETTINGS);
            return apiSuccess(c, settings);
        } catch (e: any) {
            return apiError(c, e, "Failed to fetch WhatsApp settings");
        }
    }

    async setWhatsAppSettings(c: Context) {
        try {
            const user = c.get("user");
            const body = await c.req.json<WhatsAppSettings>();
            await this.service.set(user.tenantId, "whatsapp_settings", body);
            return apiSuccess(c, null, "WhatsApp settings updated");
        } catch (e: any) {
            return apiError(c, e, "Failed to update WhatsApp settings");
        }
    }

    async getCommissionSettings(c: Context) {
        try {
            const user = c.get("user");
            const settings = await this.service.get(user.tenantId, "commission_settings", DEFAULT_COMMISSION_SETTINGS);
            return apiSuccess(c, settings);
        } catch (e: any) {
            return apiError(c, e, "Failed to fetch commission settings");
        }
    }

    async setCommissionSettings(c: Context) {
        try {
            const user = c.get("user");
            const body = await c.req.json<CommissionSettings>();
            await this.service.set(user.tenantId, "commission_settings", body);
            return apiSuccess(c, null, "Commission settings updated");
        } catch (e: any) {
            return apiError(c, e, "Failed to update commission settings");
        }
    }

    async getAccountMappings(c: Context) {
        try {
            const user = c.get("user");
            const mappings = await this.service.get(user.tenantId, "account_mappings", DEFAULT_ACCOUNT_MAPPINGS);
            return apiSuccess(c, mappings);
        } catch (e: any) {
            return apiError(c, e, "Failed to fetch account mappings");
        }
    }

    async setAccountMappings(c: Context) {
        try {
            const user = c.get("user");
            const body = await c.req.json<AccountMappingSettings>();
            await this.service.set(user.tenantId, "account_mappings", body);
            return apiSuccess(c, null, "Account mappings updated");
        } catch (e: any) {
            return apiError(c, e, "Failed to update account mappings");
        }
    }

    async getGeneralSettings(c: Context) {
        try {
            const user = c.get("user");
            const settings = await this.service.get(user.tenantId, "general_settings", DEFAULT_GENERAL_SETTINGS);
            return apiSuccess(c, settings);
        } catch (e: any) {
            return apiError(c, e, "Failed to fetch general settings");
        }
    }

    async setGeneralSettings(c: Context) {
        try {
            const user = c.get("user");
            const body = await c.req.json<GeneralSettings>();
            await this.service.set(user.tenantId, "general_settings", body);
            return apiSuccess(c, null, "General settings updated");
        } catch (e: any) {
            return apiError(c, e, "Failed to update general settings");
        }
    }

    async getTaxSettings(c: Context) {
        try {
            const user = c.get("user");
            const settings = await this.service.get(user.tenantId, "tax_settings", DEFAULT_TAX_SETTINGS);
            return apiSuccess(c, settings);
        } catch (e: any) {
            return apiError(c, e, "Failed to fetch tax settings");
        }
    }

    async setTaxSettings(c: Context) {
        try {
            const user = c.get("user");
            const body = await c.req.json<TaxSettings>();
            await this.service.set(user.tenantId, "tax_settings", body);
            return apiSuccess(c, null, "Tax settings updated");
        } catch (e: any) {
            return apiError(c, e, "Failed to update tax settings");
        }
    }

    async getSystemSettings(c: Context) {
        try {
            const user = c.get("user");
            const settings = await this.service.get(user.tenantId, "system_settings", DEFAULT_SYSTEM_SETTINGS);
            return apiSuccess(c, settings);
        } catch (e: any) {
            return apiError(c, e, "Failed to fetch system settings");
        }
    }

    async setSystemSettings(c: Context) {
        try {
            const user = c.get("user");
            const body = await c.req.json<SystemSettings>();
            await this.service.set(user.tenantId, "system_settings", body);
            return apiSuccess(c, null, "System settings updated");
        } catch (e: any) {
            return apiError(c, e, "Failed to update system settings");
        }
    }

    async factoryReset(c: Context) {
        try {
            const user = c.get("user");
            const body = await c.req.json<{ mode: "data" | "full" }>();
            if (!body.mode) return c.json({ success: false, message: "Mode is required ('data' | 'full')" }, 400);

            await this.service.factoryReset(user.tenantId, body.mode);
            return apiSuccess(c, null, "Factory reset completed successfully");
        } catch (e: any) {
            return apiError(c, e, "Factory reset failed");
        }
    }

    async getRoleBehavior(c: Context) {
        try {
            const user = c.get("user");
            const settings = await this.service.get(user.tenantId, "role_behavior", DEFAULT_ROLE_BEHAVIOR);
            return apiSuccess(c, settings);
        } catch (e: any) {
            return apiError(c, e, "Failed to fetch role behavior settings");
        }
    }

    async setRoleBehavior(c: Context) {
        try {
            const user = c.get("user");
            const body = await c.req.json<RoleBehavior>();
            await this.service.set(user.tenantId, "role_behavior", body);
            return apiSuccess(c, null, "Role behavior settings updated");
        } catch (e: any) {
            return apiError(c, e, "Failed to update role behavior settings");
        }
    }

    async getByKey(c: Context) {
        try {
            const user = c.get("user");
            const key = c.req.param("key");
            const value = await this.service.get(user.tenantId, key, null);
            return apiSuccess(c, value);
        } catch (e: any) {
            return apiError(c, e, "Failed to fetch setting");
        }
    }

    async setByKey(c: Context) {
        try {
            const user = c.get("user");
            const key = c.req.param("key");
            const body = await c.req.json();
            await this.service.set(user.tenantId, key, body.value);
            return apiSuccess(c, null, "Setting updated");
        } catch (e: any) {
            return apiError(c, e, "Failed to update setting");
        }
    }
}
