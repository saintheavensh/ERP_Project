import { TransactionContext } from "../../../../../shared/types/db-context";
import { settingsService } from "../../../../05-shared/settings/settings-container";
import { ISettingsGateway } from "../../domain";

export class SettingsGatewayAdapter implements ISettingsGateway {
    async getPaymentMethods(tenantId: string, tx: TransactionContext): Promise<any> {
        // TODO: propagate tenantId when settingsService is tenant-hardened
        return await settingsService.getPaymentMethods(tx as any);
    }
}
