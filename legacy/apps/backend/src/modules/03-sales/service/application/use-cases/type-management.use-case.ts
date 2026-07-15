import { TransactionContext } from "../../../../../shared/types/db-context";
import { IServiceTypeRepository } from "../../domain/repositories/service-type-repository.port";

export class TypeManagementUseCase {
    constructor(private readonly repository: IServiceTypeRepository) { }

    async getAll(tenantId: string, tx: TransactionContext, categoryId?: string) {
        return await this.repository.findAll(tenantId, tx, categoryId);
    }

    async getById(tenantId: string, id: string, tx: TransactionContext) {
        return await this.repository.findById(tenantId, id, tx);
    }

    async create(tenantId: string, data: { categoryId: string; name: string; weight: number; defaultPrice?: number; commissionPercent?: number; warrantyDays?: number; isActive?: boolean }, tx: TransactionContext) {
        return await this.repository.create(tenantId, data, tx);
    }

    async update(tenantId: string, id: string, data: Partial<{ name: string; weight: number; defaultPrice: number; commissionPercent: number; warrantyDays: number; isActive: boolean }>, tx: TransactionContext) {
        await this.repository.update(tenantId, id, data, tx);
        return await this.repository.findById(tenantId, id, tx);
    }

    async delete(tenantId: string, id: string, tx: TransactionContext) {
        await this.repository.delete(tenantId, id, tx);
    }
}
