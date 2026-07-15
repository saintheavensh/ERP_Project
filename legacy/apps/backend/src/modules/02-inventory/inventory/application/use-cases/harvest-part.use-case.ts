import { IGamblingRepository } from "@domain/repositories/gambling-repository.port";
import { IKanibalRepository } from "@domain/repositories/kanibal-repository.port";
import { IStockMutationGateway } from "@domain/stock-mutation-gateway.port";
import { TransactionContext } from "@shared/types/db-context";

export interface HarvestPartInput {
    sourceType: 'DEAD_PHONE' | 'FORFEITED_DEVICE';
    sourceId: string;
    partType: string;
    productId: string;
    variantId?: string;
    technicianId: string;
    costPerUnit: number;
    sellPrice: number;
    quantity: number;
    notes?: string;
}

export class HarvestPartUseCase {
    constructor(
        private readonly gamblingRepo: IGamblingRepository,
        private readonly kanibalRepo: IKanibalRepository,
        private readonly stockGateway: IStockMutationGateway
    ) { }

    async execute(input: HarvestPartInput, tx: TransactionContext, tenantId?: string) {
        // 1. Validate Source
        if (input.sourceType === 'DEAD_PHONE') {
            const dp = await this.gamblingRepo.findById(input.sourceId, tx);
            if (!dp) throw new Error("Dead phone not found");
        } else {
            const fd = await this.kanibalRepo.findForfeitedDeviceById(input.sourceId, tx);
            if (!fd) throw new Error("Forfeited device not found");
        }

        // 2. Create Stock Batch
        const batchId = `B-HRV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
        await this.stockGateway.insertBatch({
            id: batchId,
            productId: input.productId,
            supplierId: null,
            variantId: input.variantId || "",
            buyPrice: input.costPerUnit,
            sellPrice: input.sellPrice,
            initialStock: input.quantity,
            currentStock: input.quantity,
            supplierName: `Harvest from ${input.sourceType}`
        }, tx);

        await this.stockGateway.updateProductStockDelta(input.productId, input.quantity, tx);

        // 3. Save Harvest Log
        await this.kanibalRepo.saveHarvestLog({
            deadPhoneId: input.sourceType === 'DEAD_PHONE' ? input.sourceId : undefined,
            forfeitedDeviceId: input.sourceType === 'FORFEITED_DEVICE' ? input.sourceId : undefined,
            partType: input.partType,
            technicianId: input.technicianId,
            harvestDate: new Date(),
            newBatchId: batchId,
            notes: input.notes
        }, tx);

        // 4. Update Source Status (Optional logic: if dead phone is fully consumed)
        if (input.sourceType === 'DEAD_PHONE') {
            await this.gamblingRepo.updateStatus(input.sourceId, 'HARVESTED', tx);
        } else {
            await this.kanibalRepo.updateForfeitedStatus(input.sourceId, 'HARVESTED', tx);
        }

        return { batchId, success: true };
    }
}
