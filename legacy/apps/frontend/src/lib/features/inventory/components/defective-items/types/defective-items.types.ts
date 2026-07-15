export type DefectiveItemStatus = "pending" | "processed" | "cancelled";
export type DefectiveItemSource = "manual" | "sales_return" | "service_return";

export interface DefectiveItem {
    id: string;
    productId: string;
    batchId: string;
    supplierId: string;
    qty: number; // Note: Backend uses qty, frontend uses quantity often. Let's stick to backend's qty
    reason: string;
    status: DefectiveItemStatus;
    source: DefectiveItemSource;
    sourceRefId?: string | null;
    createdAt: Date;
    updatedAt: Date;

    // Relations
    product?: any;
    batch?: any;
    supplier?: any;
}

export interface CreateDefectiveItemDTO {
    productId: string;
    batchId: string;
    qty: number;
    reason: string;
    source: DefectiveItemSource;
    sourceRefId?: string;
}

export interface DefectiveItemPaginationParams {
    page?: number;
    limit?: number;
    status?: DefectiveItemStatus;
}
