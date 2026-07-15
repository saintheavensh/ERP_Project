export type PaymentMethodType = "cash" | "transfer" | "qris" | "mixed";
export type PaymentStatus = "paid" | "partial" | "unpaid";

export interface SaleItem {
    id: string;
    saleId: string;
    productId: string;
    batchId?: string | null;
    variant: string;
    qty: number;
    price: number;
    subtotal: number;
    product?: any;
}

export interface SalePayment {
    id: string;
    saleId: string;
    method: string;
    methodId?: string | null;
    variantName?: string | null;
    variantId?: string | null;
    amount: number;
    reference?: string | null;
    createdAt: Date;
}

export interface Sale {
    id: string;
    memberId?: string | null;
    customerName?: string | null;
    paymentMethod: PaymentMethodType;
    paymentStatus: PaymentStatus;
    userId: string;
    totalAmount: number;
    discountAmount: number;
    finalAmount: number;
    notes?: string | null;
    createdAt: Date;
    updatedAt?: Date | null;
    items?: SaleItem[];
    payments?: SalePayment[];
    user?: any;
    member?: any;
}

export interface CreateSaleInput {
    memberId?: string;
    customerName?: string;
    payments: {
        method: string;
        methodId?: string;
        variantId?: string;
        variantName?: string;
        amount: number;
        reference?: string;
    }[];
    userId: string;
    notes?: string;
    items: {
        productId: string;
        variant: string;
        qty: number;
        price: number;
    }[];
    discountAmount?: number;
}
