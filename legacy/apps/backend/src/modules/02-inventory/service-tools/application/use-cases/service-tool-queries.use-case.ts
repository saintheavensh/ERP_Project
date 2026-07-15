import { TransactionContext } from "../../../../../shared/types/db-context";
import { IServiceToolRepository, ServiceTool, ServiceToolRequest } from "../../domain";

export class GetServiceToolsUseCase {
    constructor(private readonly repository: IServiceToolRepository) { }

    async execute(tx: TransactionContext, params: { userId?: string } = {}): Promise<ServiceTool[]> {
        if (params.userId) {
            return await this.repository.findByUserId(params.userId, tx);
        }
        return await this.repository.findAll(tx);
    }
}

export class GetServiceToolByIdUseCase {
    constructor(private readonly repository: IServiceToolRepository) { }

    async execute(id: string, tx: TransactionContext): Promise<ServiceTool | null> {
        return await this.repository.findById(id, tx);
    }
}

export class GetToolRequestsUseCase {
    constructor(private readonly repository: IServiceToolRepository) { }

    async execute(tx: TransactionContext, params: { userId?: string } = {}): Promise<ServiceToolRequest[]> {
        if (params.userId) {
            return await this.repository.findRequestsByUserId(params.userId, tx);
        }
        return await this.repository.findAllRequests(tx);
    }
}
