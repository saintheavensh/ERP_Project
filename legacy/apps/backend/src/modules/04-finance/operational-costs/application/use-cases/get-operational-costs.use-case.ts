import { TransactionContext } from "../../../../../shared/types/db-context";
import { IOperationalCostRepository, OperationalCost } from "../../domain";

export class GetOperationalCostsUseCase {
    constructor(private readonly repository: IOperationalCostRepository) { }

    async execute(tenantId: string, limit: number = 100, tx: TransactionContext): Promise<OperationalCost[]> {
        return await this.repository.findAll(tenantId, tx, limit);
    }
}
