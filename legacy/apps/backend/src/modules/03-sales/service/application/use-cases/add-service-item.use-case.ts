import { TransactionContext } from "../../../../../shared/types/db-context";
import { IServiceItemRepository } from "../../domain/repositories/service-item-repository.port";

export class AddServiceItemUseCase {
    constructor(private readonly itemRepository: IServiceItemRepository) { }

    async execute(tenantId: string, data: { serviceId: string; serviceTypeId: string; technicianId?: string; description?: string; estimatedCost?: number }, tx: TransactionContext) {
        const result = await this.itemRepository.create(tenantId, {
            ...data,
            status: "PENDING"
        }, tx);
        return { id: result.id, message: "Service item added" };
    }
}
