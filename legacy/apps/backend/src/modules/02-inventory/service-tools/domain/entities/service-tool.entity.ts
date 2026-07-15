export type ToolCondition = "good" | "damaged" | "lost";
export type RequestStatus = "pending" | "approved" | "rejected";

export interface ServiceTool {
    id: string;
    name: string;
    brand?: string | null;
    qty: number;
    condition: ToolCondition;
    purchaseDate?: Date | null;
    price: number;
    notes?: string | null;
    userId?: string | null;
    tenantId: string;
    createdAt: Date;
}

export interface ServiceToolRequest {
    id: string;
    userId: string;
    toolName: string;
    justification?: string | null;
    status: RequestStatus;
    tenantId: string;
    createdAt: Date;
}
