import { TransactionContext } from "../../../../../shared/types/db-context";
import { IServiceCategoryRepository } from "../../domain/repositories/service-category-repository.port";

export class CategoryManagementUseCase {
    constructor(private readonly repository: IServiceCategoryRepository) { }

    async getAll(tenantId: string, tx: TransactionContext) {
        return await this.repository.findAll(tenantId, tx);
    }

    async getById(tenantId: string, id: string, tx: TransactionContext) {
        return await this.repository.findById(tenantId, id, tx);
    }

    async create(tenantId: string, data: { name: string; description?: string; minWeight?: number; maxWeight?: number }, tx: TransactionContext) {
        return await this.repository.create(tenantId, data, tx);
    }

    async update(tenantId: string, id: string, data: Partial<{ name: string; description: string; minWeight: number; maxWeight: number }>, tx: TransactionContext) {
        await this.repository.update(tenantId, id, data, tx);
        return await this.repository.findById(tenantId, id, tx);
    }

    async delete(tenantId: string, id: string, tx: TransactionContext) {
        await this.repository.delete(tenantId, id, tx);
    }
}
