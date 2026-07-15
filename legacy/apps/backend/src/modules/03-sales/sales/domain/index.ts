export * from "./entities/sale.entity";
export * from "./repositories/sale-repository.port";
export * from "./gateways";

export interface CreateSaleInput {
    memberId?: string;
    customerName?: string;
    items: {
        productId: string;
        variant?: string;
        qty: number;
        price: number;
    }[];
    payments: {
        method: string;
        methodId: string;
        variantName?: string;
        variantId?: string;
        amount: number;
        reference?: string;
    }[];
    discountAmount?: number;
    notes?: string;
    userId: string;
    approvalId?: string;
}
