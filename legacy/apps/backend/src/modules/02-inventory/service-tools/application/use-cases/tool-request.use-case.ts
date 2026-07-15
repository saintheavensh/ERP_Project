import { TransactionContext } from "../../../../../shared/types/db-context";
import {
    IServiceToolRepository,
    INotificationGateway,
    ServiceToolRequest
} from "../../domain";

export class CreateToolRequestUseCase {
    constructor(
        private readonly repository: IServiceToolRepository,
        private readonly notificationGateway: INotificationGateway
    ) { }

    async execute(userId: string, userName: string, data: any, tx: TransactionContext): Promise<ServiceToolRequest> {
        const requestData = {
            userId,
            toolName: data.toolName,
            justification: data.justification || null,
            status: "pending"
        };

        const request = await this.repository.createRequest(requestData, tx);

        // Notify owners
        await this.notificationGateway.notifyOwnersNewToolRequest(userName, data.toolName);

        return request;
    }
}

export class UpdateToolRequestStatusUseCase {
    constructor(private readonly repository: IServiceToolRepository) { }

    async execute(id: string, status: "approved" | "rejected", tx: TransactionContext): Promise<void> {
        await this.repository.updateRequestStatus(id, status, tx);
    }
}
