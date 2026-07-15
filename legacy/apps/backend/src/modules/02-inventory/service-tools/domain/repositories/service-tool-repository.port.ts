import { TransactionContext } from "../../../../../shared/types/db-context";
import { ServiceTool, ServiceToolRequest } from "../entities/service-tool.entity";

export interface CreateServiceToolInput {
    id?: string;
    name: string;
    brand?: string | null;
    qty: number;
    condition?: string;
    purchaseDate?: Date | string | null;
    price: number;
    notes?: string | null;
    userId?: string | null;
}

export interface UpdateServiceToolInput {
    name?: string;
    brand?: string | null;
    qty?: number;
    condition?: string;
    price?: number;
    notes?: string | null;
    userId?: string | null;
}

export interface CreateServiceToolRequestInput {
    id?: string;
    userId: string;
    toolName: string;
    justification?: string | null;
    status?: string;
}

export interface IServiceToolRepository {
    findAll(tx: TransactionContext): Promise<ServiceTool[]>;
    findById(id: string, tx: TransactionContext): Promise<ServiceTool | null>;
    findByUserId(userId: string, tx: TransactionContext): Promise<ServiceTool[]>;
    findLast(tx: TransactionContext): Promise<ServiceTool | null>;
    create(data: CreateServiceToolInput, tx: TransactionContext): Promise<ServiceTool>;
    update(id: string, data: UpdateServiceToolInput, tx: TransactionContext): Promise<void>;
    delete(id: string, tx: TransactionContext): Promise<void>;

    // Tool Requests
    findAllRequests(tx: TransactionContext): Promise<ServiceToolRequest[]>;
    findRequestsByUserId(userId: string, tx: TransactionContext): Promise<ServiceToolRequest[]>;
    createRequest(data: CreateServiceToolRequestInput, tx: TransactionContext): Promise<ServiceToolRequest>;
    updateRequestStatus(id: string, status: string, tx: TransactionContext): Promise<void>;
}
