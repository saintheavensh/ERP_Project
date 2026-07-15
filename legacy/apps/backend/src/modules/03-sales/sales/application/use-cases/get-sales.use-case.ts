import { TransactionContext } from "../../../../../shared/types/db-context";
import { ISaleRepository, Sale } from "../../domain";
import { HTTPException } from "hono/http-exception";

export class GetSalesUseCase {
    constructor(private readonly repository: ISaleRepository) { }

    async execute(tenantId: string, params: { startDate?: string; endDate?: string; search?: string; limit?: string }, tx: TransactionContext): Promise<Sale[]> {
        const startDate = params.startDate ? new Date(params.startDate) : undefined;
        const endDate = params.endDate ? new Date(params.endDate + "T23:59:59") : undefined;
        const limit = params.limit ? parseInt(params.limit) : 50;

        return await this.repository.findAll(tenantId, {
            startDate,
            endDate,
            search: params.search,
            limit
        }, tx);
    }
}

export class GetSaleByIdUseCase {
    constructor(private readonly repository: ISaleRepository) { }

    async execute(tenantId: string, id: string, tx: TransactionContext): Promise<Sale> {
        const sale = await this.repository.findById(tenantId, id, tx);
        if (!sale) {
            throw new HTTPException(404, { message: "Sale not found" });
        }
        return sale;
    }
}
