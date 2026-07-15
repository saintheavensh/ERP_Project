import { IGamblingRepository, DeadPhonePurchase } from "@domain/repositories/gambling-repository.port";
import { TransactionContext } from "@shared/types/db-context";

export interface RecordDeadPhonePurchaseInput {
    deviceName: string;
    imei?: string;
    purchasePrice: number;
    purchaseDate: string;
    supplierId?: string;
    suspectedIssue?: string;
    visualCondition?: string;
    storageLocation?: string;
}

export class RecordDeadPhonePurchaseUseCase {
    constructor(private readonly repository: IGamblingRepository) { }

    async execute(input: RecordDeadPhonePurchaseInput, tx: TransactionContext, tenantId?: string): Promise<DeadPhonePurchase> {
        return await this.repository.savePurchase({
            ...input,
            purchaseDate: new Date(input.purchaseDate),
            status: 'STORED'
        }, tx);
    }
}
