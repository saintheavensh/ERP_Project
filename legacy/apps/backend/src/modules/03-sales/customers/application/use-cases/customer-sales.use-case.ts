import { TransactionContext } from "../../../../../shared/types/db-context";
import { ICustomerRepository, CustomerSale } from "../../domain";
import { HTTPException } from "hono/http-exception";

export class DeleteCustomerUseCase {
    constructor(private readonly repository: ICustomerRepository) { }

    async execute(tenantId: string, id: string, tx: TransactionContext): Promise<void> {
        const existing = await this.repository.findById(tenantId, id, tx);
        if (!existing) {
            throw new HTTPException(404, { message: "Customer not found" });
        }
        await this.repository.delete(tenantId, id, tx);
    }
}

export class GetCustomerSalesUseCase {
    constructor(private readonly repository: ICustomerRepository) { }

    async execute(tenantId: string, id: string, tx: TransactionContext): Promise<CustomerSale[]> {
        return await this.repository.findSales(tenantId, id, tx);
    }
}

export class GetCustomerUnpaidSalesUseCase {
    constructor(private readonly repository: ICustomerRepository) { }

    async execute(tenantId: string, id: string, tx: TransactionContext): Promise<CustomerSale[]> {
        return await this.repository.findUnpaidSales(tenantId, id, tx);
    }
}
