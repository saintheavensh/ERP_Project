import { generateId, ID_PREFIX } from "../../../../../shared/utils/validation/IdGenerator";
import { TransactionContext } from "../../../../../shared/types/db-context";
import { ICustomerRepository, Customer, CreateCustomerData, UpdateCustomerData } from "../../domain";
import { HTTPException } from "hono/http-exception";

export class CreateCustomerUseCase {
    constructor(private readonly repository: ICustomerRepository) { }

    async execute(tenantId: string, data: CreateCustomerData, tx: TransactionContext): Promise<Customer> {
        const existing = await this.repository.findByPhone(tenantId, data.phone, tx);
        if (existing) {
            throw new HTTPException(400, { message: "Phone number already registered" });
        }

        const id = generateId(ID_PREFIX.CUSTOMER);
        return await this.repository.create(tenantId, {
            ...data,
            id,
            points: 0,
            debt: 0
        }, tx);
    }
}

export class UpdateCustomerUseCase {
    constructor(private readonly repository: ICustomerRepository) { }

    async execute(tenantId: string, id: string, data: UpdateCustomerData, tx: TransactionContext): Promise<Customer> {
        const existing = await this.repository.findById(tenantId, id, tx);
        if (!existing) {
            throw new HTTPException(404, { message: "Customer not found" });
        }

        if (data.phone && data.phone !== existing.phone) {
            const phoneCheck = await this.repository.findByPhone(tenantId, data.phone, tx);
            if (phoneCheck) {
                throw new HTTPException(400, { message: "Phone number already registered" });
            }
        }

        return await this.repository.update(tenantId, id, data, tx);
    }
}
