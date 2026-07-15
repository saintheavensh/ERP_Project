import { TransactionContext } from "../../../../../shared/types/db-context";
import { ICustomerRepository, Customer } from "../../domain";
import { HTTPException } from "hono/http-exception";

export class GetCustomersUseCase {
    constructor(private readonly repository: ICustomerRepository) { }

    async execute(tenantId: string, tx: TransactionContext, query?: string): Promise<Customer[]> {
        return await this.repository.findAll(tenantId, tx, query);
    }
}

export class GetCustomerByIdUseCase {
    constructor(private readonly repository: ICustomerRepository) { }

    async execute(tenantId: string, id: string, tx: TransactionContext): Promise<Customer> {
        const customer = await this.repository.findById(tenantId, id, tx);
        if (!customer) {
            throw new HTTPException(404, { message: "Customer not found" });
        }
        return customer;
    }
}
