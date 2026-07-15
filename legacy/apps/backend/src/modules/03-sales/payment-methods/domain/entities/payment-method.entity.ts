export type PaymentMethodType = "cash" | "transfer" | "qris" | "ewallet" | "custom";
export type FeeType = "percent" | "fixed";

export interface FeeConfig {
    enabled: boolean;
    type: FeeType;
    value: number;
}

export interface PaymentVariant {
    id: string;
    methodId: string;
    name: string;
    accountNumber?: string | null;
    accountHolder?: string | null;
    accountId?: string | null;
    enabled: boolean;
    createdAt: Date;
    updatedAt?: Date | null;
}

export interface PaymentMethod {
    id: string;
    name: string;
    type: PaymentMethodType;
    icon: string;
    accountId?: string | null;
    feeConfig?: FeeConfig | null;
    enabled: boolean;
    createdAt: Date;
    updatedAt?: Date | null;
    variants?: PaymentVariant[];
}

export interface PaymentMethodInput {
    name: string;
    type: PaymentMethodType;
    icon: string;
    accountId?: string;
    feeConfig?: FeeConfig;
}

export interface PaymentVariantInput {
    name: string;
    accountNumber?: string;
    accountHolder?: string;
    accountId?: string;
}
