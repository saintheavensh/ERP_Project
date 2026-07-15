export interface PurchaseReturnItem {
    id?: string;
    returnId: string;
    productId: string;
    batchId: string;
    qty: number;
    reason?: string | null;
    createdAt?: Date;
}

export interface PurchaseReturn {
    id: string;
    supplierId: string;
    userId: string;
    date: Date;
    notes?: string | null;
    items?: PurchaseReturnItem[];
    createdAt?: Date;
}

export type CreatePurchaseReturnData = Omit<PurchaseReturn, 'id' | 'date' | 'createdAt' | 'items'> & {
    items: Omit<PurchaseReturnItem, 'id' | 'returnId' | 'createdAt'>[];
};
