import { TransactionContext } from "../../../../../shared/types/db-context";
import { IOperationalCostRepository } from "../../domain";

export class DeleteOperationalCostUseCase {
    constructor(private readonly repository: IOperationalCostRepository) { }

    async execute(tenantId: string, id: string, tx: TransactionContext): Promise<void> {
        await this.repository.delete(tenantId, id, tx);
    }
}
