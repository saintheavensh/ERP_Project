import { TransactionContext } from "../../../../../shared/types/db-context";
import { IServicePartRepository } from "../../domain/repositories/service-part-repository.port";

export class AddServicePartUseCase {
    constructor(private readonly partRepository: IServicePartRepository) { }

    async execute(tenantId: string, data: { serviceItemId: string; variantBatchId: string; quantity: number; sellingPrice: number; purchasePrice?: number; notes?: string }, tx: TransactionContext) {
        const result = await this.partRepository.create(tenantId, {
            ...data
        }, tx);
        return { id: result.id, message: "Service part added" };
    }
}
