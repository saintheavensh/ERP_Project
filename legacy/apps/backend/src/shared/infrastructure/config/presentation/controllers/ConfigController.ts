import { inject, injectable } from "inversify";
import { Context } from "hono";
import { ConfigFacade } from "../../application/facades/ConfigFacade";
import { TYPES } from "../../../../../shared/core/types";

@injectable()
export class ConfigController {
    constructor(@inject(TYPES.ConfigFacade) private configFacade: ConfigFacade) { }

    async getSystemConfig(c: Context) {
        const key = c.req.param('key');
        const defaultValue = c.req.query('default');

        const result = await this.configFacade.getSystemConfig(key, defaultValue);

        let value;
        if (result.isFailure) {
            // Provide intelligent defaults for new frontend requested settings that don't exist yet
            const defaultSettings: Record<string, any> = {
                'service': {
                    numberFormat: "SRV-{YY}{MM}-{0000}",
                    resetCounterYearly: true,
                    defaultStatus: "antrian",
                    autoNotifyOnStatusChange: false,
                    commissionModel: "completion",
                    warrantyPresets: [],
                    defaultWarrantyDays: 30,
                    gracePeriodDays: 7,
                    autoCloseAfterDays: 30,
                    enableVirtualArchive: false,
                    archiveExclusions: [],
                    enableLiquidation: false,
                    reminderBeforePickup: false,
                    reminderDays: 1
                },
                'tax': { enabled: false, rate: 11, label: "PPN", inclusive: false },
                'store-info': { name: "Saint Heavens", address: "", phone: "" },
                'whatsapp': { enabled: false, mode: 'client', phoneNumber: "" },
                'receipt': { showLogo: false, printerType: "thermal" },
                'system': { currencySymbol: "Rp", dateFormat: "dd/MM/yyyy", timezone: "Asia/Jakarta" },
                'general': { accountingMode: 'simple', accountingSetupComplete: false }
            };

            if (defaultSettings[key]) {
                value = defaultSettings[key];
            } else if (defaultValue !== undefined) {
                value = defaultValue;
            } else {
                return c.json({ error: `Setting ${key} not found` }, 404);
            }
        } else {
            value = result.getValue();
            // Try parse if string JSON
            if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
                try { value = JSON.parse(value); } catch { }
            }
        }

        return c.json({ data: value, message: "Success" });
    }

    async updateConfig(c: Context) {
        const key = c.req.param('key');
        const body = await c.req.json();

        // Support both { value: ... } format and direct object payload
        let valueToSave = body;
        let type = 'json';
        if (body && typeof body === 'object' && body.value !== undefined && Object.keys(body).length <= 4) {
            valueToSave = body.value;
            type = body.type || (typeof body.value === 'object' ? 'json' : typeof body.value);
        }

        // Must be string for the DB storage
        const strValue = typeof valueToSave === 'object' ? JSON.stringify(valueToSave) : String(valueToSave);

        const result = await this.configFacade.updateSetting({
            key,
            value: strValue,
            type: body.type || 'json',
            scope: body.scope || 'system',
            description: body.description
        });

        if (result.isFailure) {
            return c.json({ error: result.errorValue() }, 400);
        }

        return c.json({ message: "Setting updated successfully", data: valueToSave });
    }

    async getAllSettings(c: Context) {
        return c.json({ data: {} });
    }
}
