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
    userId?: string | null; // Technician assigned
    createdAt: Date;
    updatedAt: Date;
}

export interface ServiceToolRequest {
    id: string;
    userId: string;
    toolName: string;
    justification?: string | null;
    status: RequestStatus;
    createdAt: Date;
}

export interface CreateServiceToolDTO {
    name: string;
    brand?: string;
    qty: number;
    condition: ToolCondition;
    purchaseDate?: Date | string;
    price: number;
    notes?: string;
    userId?: string;
}

export interface UpdateServiceToolDTO extends Partial<CreateServiceToolDTO> { }

export interface CreateToolRequestDTO {
    toolName: string;
    justification?: string;
}
