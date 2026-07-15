export type DefectiveItemStatus = "pending" | "processed" | "cancelled";
export type DefectiveItemSource = "manual" | "sales_return" | "service_return";

export interface DefectiveItemProduct {
    id: string;
    name: string;
}

export interface DefectiveItemBatch {
    id: string;
    currentStock: number;
}

export interface DefectiveItemSupplier {
    id: string;
    name: string;
}

export interface DefectiveItem {
    id: string;
    productId: string;
    batchId: string;
    supplierId: string;
    qty: number;
    reason: string | null;
    status: DefectiveItemStatus;
    source: DefectiveItemSource;
    sourceRefId?: string | null;
    createdAt: Date | null;
    updatedAt?: Date | null;

    // Relations (populated by joins)
    product?: DefectiveItemProduct;
    batch?: DefectiveItemBatch;
    supplier?: DefectiveItemSupplier;
}
