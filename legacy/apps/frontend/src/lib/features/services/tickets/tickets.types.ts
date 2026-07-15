/**
 * Service order status types
 */
export type ServiceStatus =
    | "antrian"
    | "dicek"
    | "konfirmasi"
    | "dikerjakan"
    | "re-konfirmasi"
    | "selesai"
    | "diambil"
    | "batal";

/**
 * Service priority types
 */
export type ServicePriority = "standard" | "wait";

/**
 * Phone status types
 */
export type PhoneStatus = "nyala" | "mati_total" | "hidup_mati" | "restart";

/**
 * Sparepart source types
 */
export type SparepartSource = "none" | "inventory" | "external" | "customer";

/**
 * Payment method types
 */
export type PaymentMethodType = "cash" | "transfer" | "qris" | "mixed";

/**
 * Customer data in a service ticket
 */
export interface ServiceCustomer {
    name: string;
    phone?: string;
    address?: string;
}

/**
 * Device/unit data in a service ticket
 */
export interface ServiceDevice {
    brand: string;
    model: string;
    status: PhoneStatus;
    imei?: string;
    color?: string;
    pin?: string;
    condition?: string[];
    completeness?: string[];
    physicalNotes?: string;
}

/**
 * Diagnosis data
 */
export interface ServiceDiagnosis {
    initial?: string;
    possibleCauses?: string;
    estimatedCost?: string;
    downPayment?: string;
}

/**
 * QC checklist result
 */
export interface QCResult {
    passed?: boolean;
    before?: Record<string, boolean>;
    after?: Record<string, boolean>;
    notes?: string;
}

/**
 * Payment entry in service
 */
export interface ServicePayment {
    method: string;
    amount: number;
}

/**
 * Sparepart used in service
 */
export interface ServiceSparepart {
    productId: string;
    name?: string;
    qty: number;
    price: number;
    buyPrice?: number;
    type?: "inventory" | "external";
}

/**
 * Technician reference
 */
export interface Technician {
    id: string;
    name: string;
}

/**
 * Status tile for UI display
 */
export interface StatusTile {
    id: ServiceStatus;
    label: string;
    count: number;
    icon: string;
    color: string;
    bg: string;
}

/**
 * Status badge for UI display
 */
export interface StatusBadge {
    label: string;
    variant: string;
    className: string;
    icon: string;
}
