import { TransactionContext } from "../../../../../shared/types/db-context";
import { ActivityLogService } from "../../../../../shared/utils/logging";
import { IActivityLogger } from "../../domain/purchase-repository.port";

export class PurchaseActivityLoggerAdapter implements IActivityLogger {
    async log(tenantId: string, entry: {
        userId: string;
        action: string;
        entityType: string;
        entityId: string;
        description: string;
    }, tx: TransactionContext): Promise<void> {
        await ActivityLogService.log({ ...entry, tenantId } as any, tx);
    }
}

