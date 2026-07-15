import { DBContext } from "../../../../../shared/types/db-context";
import { DEFAULT_SERVICE_SETTINGS } from "../../../settings/application";

interface ISettingsFacade {
    get<T>(tenantId: string, key: string, defaultValue: T): Promise<T>;
}

interface IReportsFacade {
    getProfitAndLoss(tenantId: string, filters: any, tx?: DBContext): Promise<any>;
}

export class GetProfitLossUseCase {
    constructor(
        private settingsFacade: ISettingsFacade,
        private reportsFacade: IReportsFacade
    ) { }

    async execute(tenantId: string, startDate: string | undefined, endDate: string | undefined, tx: DBContext) {
        const settings = await this.settingsFacade.get(tenantId, "service_settings", DEFAULT_SERVICE_SETTINGS) as any;
        const commissionModel = settings?.commissionModel || 'completion';
        return await this.reportsFacade.getProfitAndLoss(tenantId, { startDate, endDate, commissionModel }, tx);
    }
}
