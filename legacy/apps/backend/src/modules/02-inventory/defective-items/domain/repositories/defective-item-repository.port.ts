import { TransactionContext } from "../../../../../shared/types/db-context";
import { DefectiveItem, DefectiveItemStatus } from "../entities/defective-item.entity";

export interface CreateDefectiveItemInput {
    id?: string;
    productId: string;
    batchId: string;
    supplierId: string;
    qty: number;
    reason: string;
    status?: string;
    source?: string;
    sourceRefId?: string;
}

export interface IDefectiveItemRepository {
    findAll(status: DefectiveItemStatus | undefined, tx: TransactionContext): Promise<DefectiveItem[]>;
    findByIds(ids: string[], tx: TransactionContext): Promise<DefectiveItem[]>;
    create(data: CreateDefectiveItemInput, tx: TransactionContext): Promise<DefectiveItem>;
    updateStatus(ids: string[], status: DefectiveItemStatus, tx: TransactionContext): Promise<void>;
}
