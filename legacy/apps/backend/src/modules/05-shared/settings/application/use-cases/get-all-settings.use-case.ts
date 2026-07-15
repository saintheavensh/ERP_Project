import { DBContext } from "../../../../../shared/types/db-context";
import { AllSettings } from "../../domain";
import { GetSettingUseCase } from "./get-setting.use-case";
import {
    DEFAULT_STORE_INFO,
    DEFAULT_RECEIPT_SETTINGS,
    DEFAULT_SERVICE_SETTINGS,
    DEFAULT_WHATSAPP_SETTINGS,
    DEFAULT_COMMISSION_SETTINGS,
    DEFAULT_ACCOUNT_MAPPINGS,
    DEFAULT_GENERAL_SETTINGS
} from "../constants";

export class GetAllSettingsUseCase {
    constructor(private readonly getSettingUC: GetSettingUseCase) { }

    async execute(tenantId: string, tx: DBContext): Promise<AllSettings> {
        const [
            storeInfo,
            receiptSettings,
            serviceSettings,
            whatsappSettings,
            commissionSettings,
            accountMappings,
            generalSettings
        ] = await Promise.all([
            this.getSettingUC.execute(tenantId, "store_info", DEFAULT_STORE_INFO, tx),
            this.getSettingUC.execute(tenantId, "receipt_settings", DEFAULT_RECEIPT_SETTINGS, tx),
            this.getSettingUC.execute(tenantId, "service_settings", DEFAULT_SERVICE_SETTINGS, tx),
            this.getSettingUC.execute(tenantId, "whatsapp_settings", DEFAULT_WHATSAPP_SETTINGS, tx),
            this.getSettingUC.execute(tenantId, "commission_settings", DEFAULT_COMMISSION_SETTINGS, tx),
            this.getSettingUC.execute(tenantId, "account_mappings", DEFAULT_ACCOUNT_MAPPINGS, tx),
            this.getSettingUC.execute(tenantId, "general_settings", DEFAULT_GENERAL_SETTINGS, tx),
        ]);

        return {
            storeInfo,
            receiptSettings,
            serviceSettings,
            whatsappSettings,
            commissionSettings,
            accountMappings,
            generalSettings
        };
    }
}
