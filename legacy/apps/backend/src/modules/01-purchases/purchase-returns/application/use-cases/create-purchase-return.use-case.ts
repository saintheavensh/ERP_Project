import { IPurchaseReturnRepository } from "../../domain";
import { TransactionContext } from "../../../../../shared/types/db-context";
import { generateId, ID_PREFIX } from "../../../../../shared/utils/validation/IdGenerator";

export interface CreatePurchaseReturnDto {
    supplierId: string;
    userId: string;
    notes?: string | null;
    items: {
        productId: string;
        batchId: string;
        qty: number;
        reason?: string | null;
    }[];
}

export class CreatePurchaseReturnUseCase {
    constructor(private returnRepo: IPurchaseReturnRepository) { }

    async execute(tenantId: string, dto: CreatePurchaseReturnDto, tx: TransactionContext): Promise<void> {
        const returnId = generateId(ID_PREFIX.PURCHASE);

        const returnOrder = await this.returnRepo.create(tenantId, {
            id: returnId,
            supplierId: dto.supplierId,
            userId: dto.userId,
            date: new Date(),
            notes: dto.notes ?? null
        }, tx);

        await this.returnRepo.createItems(tenantId, dto.items.map(i => ({
            returnId: returnOrder.id,
            productId: i.productId,
            batchId: i.batchId,
            qty: i.qty,
            reason: i.reason ?? null
        })), tx);
    }
}
