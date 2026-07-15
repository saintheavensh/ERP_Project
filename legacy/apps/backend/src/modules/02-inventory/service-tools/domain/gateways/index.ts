import type { TransactionContext } from "../../../../../shared/types/db-context";

export interface INotificationGateway {
    notifyOwnersNewToolRequest(technicianName: string, toolName: string): Promise<void>;
}

export interface IUserGateway {
    getOwners(tx: TransactionContext): Promise<Array<{ id: string; name: string }>>;
}
