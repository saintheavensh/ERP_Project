import type { CreateOpnameSessionUseCase } from "@application/use-cases/create-opname-session.use-case";
import type { GetOpnameSessionsUseCase } from "@application/use-cases/get-opname-sessions.use-case";
import type { GetOpnameSessionDetailsUseCase } from "@application/use-cases/get-opname-session-details.use-case";
import type { UpdateOpnameItemUseCase } from "@application/use-cases/update-opname-item.use-case";
import type { FinalizeOpnameSessionUseCase } from "@application/use-cases/finalize-opname-session.use-case";
import type { CancelOpnameSessionUseCase } from "@application/use-cases/cancel-opname-session.use-case";
import type { GetAdjustmentHistoryUseCase } from "@application/use-cases/get-adjustment-history.use-case";
import { InventoryTransactionAuthority } from "./inventory-transaction-authority";
import { TransactionContext } from "@shared/types/db-context";

export class StockOpnameService {
    constructor(
        private readonly inventoryAuthority: InventoryTransactionAuthority,
        private readonly createSessionUC: CreateOpnameSessionUseCase,
        private readonly getSessionsUC: GetOpnameSessionsUseCase,
        private readonly getSessionDetailsUC: GetOpnameSessionDetailsUseCase,
        private readonly updateItemUC: UpdateOpnameItemUseCase,
        private readonly finalizeSessionUC: FinalizeOpnameSessionUseCase,
        private readonly cancelSessionUC: CancelOpnameSessionUseCase,
        private readonly getAdjustmentHistoryUC: GetAdjustmentHistoryUseCase
    ) { }

    async createSession(tenantId: string, userId: string, notes?: string, categoryId?: string): Promise<string> {
        return this.inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => this.createSessionUC.execute(userId, tx, notes, categoryId)
        );
    }

    async getSessions(tenantId: string) {
        return this.inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => this.getSessionsUC.execute(tx)
        );
    }

    async getSessionDetails(tenantId: string, id: string) {
        return this.inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => this.getSessionDetailsUC.execute(id, tx)
        );
    }

    async updateItem(tenantId: string, itemId: number, physicalStock: number, reason?: string) {
        return this.inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => this.updateItemUC.execute(itemId, physicalStock, reason, tx)
        );
    }

    async finalizeSession(tenantId: string, id: string, userId: string) {
        return this.inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => this.finalizeSessionUC.execute(id, userId, tx)
        );
    }

    async cancelSession(tenantId: string, id: string, userId: string) {
        return this.inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => this.cancelSessionUC.execute(id, userId, tx)
        );
    }

    async getAdjustmentHistory(tenantId: string) {
        return this.inventoryAuthority.execute(
            { tenantId },
            async (tx: TransactionContext) => this.getAdjustmentHistoryUC.execute(tx)
        );
    }
}
