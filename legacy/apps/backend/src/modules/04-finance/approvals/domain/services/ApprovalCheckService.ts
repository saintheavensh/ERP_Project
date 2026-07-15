import { TransactionContext } from "../../../../../shared/types/db-context";
import { ISettingsRepository } from "../../../../05-shared/settings/domain";

export class ApprovalCheckService {
    constructor(private readonly settingsRepo: ISettingsRepository) { }

    async needsApproval(tenantId: string, type: 'DISCOUNT' | 'REFUND' | 'PURCHASE' | 'VOID' | 'SERVICE_DISCOUNT', amount: number, tx: TransactionContext, data?: any): Promise<boolean> {
        const settings = await this.settingsRepo.findByKey(tenantId, 'approval_thresholds', tx);
        const thresholds = settings?.value || {
            DISCOUNT_PERCENT: 10,
            REFUND_ALWAYS: true,
            PURCHASE_TOTAL: 5000000, // 5 Million
            VOID_ALWAYS: true,
            SERVICE_DISCOUNT_PERCENT: 15
        };

        switch (type) {
            case 'DISCOUNT':
                // amount here is percent or flat? let's assume percent if data.isPercent
                if (data?.isPercent) {
                    return amount > thresholds.DISCOUNT_PERCENT;
                }
                // if flat, we might need to check against total
                return false;

            case 'REFUND':
                return thresholds.REFUND_ALWAYS;

            case 'PURCHASE':
                return amount > thresholds.PURCHASE_TOTAL;

            case 'VOID':
                return thresholds.VOID_ALWAYS;

            case 'SERVICE_DISCOUNT':
                if (data?.isPercent) {
                    return amount > thresholds.SERVICE_DISCOUNT_PERCENT;
                }
                return false;

            default:
                return false;
        }
    }
}
