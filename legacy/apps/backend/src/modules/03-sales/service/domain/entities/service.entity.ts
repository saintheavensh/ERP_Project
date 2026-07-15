export type ServiceStatus =
    | "antrian"
    | "dicek"
    | "menunggu_sparepart"
    | "konfirmasi"
    | "dikerjakan"
    | "re-konfirmasi"
    | "selesai"
    | "diambil"
    | "batal";

export type ServicePriority = "standard" | "high" | "urgent";

export interface DeviceUnit {
    brand: string;
    model: string;
    serialNumber?: string | null;
    photos?: string[];
    initialQC?: any;
}

export interface Customer {
    name: string;
    phone: string;
    address?: string | null;
}

export interface ServiceItem {
    name: string;
    qty: number;
    price: number;
    source: "inventory" | "manual";
    batchId?: string | null;
    buyPrice?: number | null;
}

export interface ServiceTicket {
    id: string;
    no: string;
    customer: Customer;
    device: DeviceUnit;
    complaint: string;
    diagnosis?: any;
    technicianId?: string | null;
    status: ServiceStatus;
    priority: ServicePriority;
    dateIn: Date;
    dateOut?: Date | null;
    estimatedCompletionDate?: Date | null;
    costEstimate?: number | null;
    actualCost?: number | null;
    qc?: any;
    warranty?: string | null;
    warrantyExpiryDate?: Date | null;
    parts?: ServiceItem[];
    notes?: string | null;
    reconfirmationCount?: number;
    isDirectComplete: boolean;
    createdBy?: string | null;
    createdAt: Date;
    updatedAt: Date;

    // Derived properties for UI
    photos?: string[];
    serviceFee?: number;

    // Relations (optional/populated)
    technician?: any;
    creator?: any;
    timeline?: ServiceLogEntry[];
}

export interface ServiceLogEntry {
    event: string;
    by: string;
    time: string;
    action: string;
    details?: any;
}
