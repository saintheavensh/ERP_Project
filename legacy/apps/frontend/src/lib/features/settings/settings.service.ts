import { api } from "$lib/shared/lib/api-client";
import type { ApiResponse } from "@repo/shared";

// ============================================
// PAYMENT METHODS
// ============================================

export interface PaymentVariant {
    id: string;
    methodId: string;
    name: string;
    accountNumber?: string | null;
    accountHolder?: string | null;
    accountId?: string | null; // Linked GL Account
    enabled: boolean;
    createdAt?: Date;
}

export interface PaymentMethod {
    id: string;
    name: string;
    type: "cash" | "transfer" | "qris" | "ewallet" | "custom";
    icon: string;
    enabled: boolean;
    variants?: PaymentVariant[];
    accountId?: string | null; // Linked GL Account
    feeConfig?: {
        enabled: boolean;
        type: "percent" | "fixed";
        value: number;
    };
    createdAt?: Date;
}

export const PAYMENT_ICONS = [
    { id: "cash", label: "Tunai", icon: "💵" },
    { id: "bank", label: "Bank", icon: "🏦" },
    { id: "card", label: "Kartu", icon: "💳" },
    { id: "qr", label: "QR Code", icon: "📱" },
    { id: "wallet", label: "Dompet", icon: "👛" },
    { id: "coins", label: "Koin", icon: "🪙" },
    { id: "money", label: "Uang", icon: "💰" },
    { id: "credit", label: "Kredit", icon: "🔖" },
];

export const PAYMENT_TYPES = [
    { id: "cash", label: "Tunai" },
    { id: "transfer", label: "Transfer Bank" },
    { id: "qris", label: "QRIS" },
    { id: "ewallet", label: "E-Wallet" },
    { id: "custom", label: "Lainnya" },
];

// ============================================
// STORE INFO
// ============================================

export interface StoreInfo {
    name: string;
    address: string;
    phone: string;
    email?: string;
    logo?: string;
    socialMedia?: string;
}

// ============================================
// RECEIPT SETTINGS
// ============================================

export interface ReceiptSettings {
    showLogo: boolean;
    headerText: string;
    footerText: string;
    termsConditions: string;
    showCustomerPhone: boolean;
    showCustomerAddress: boolean;
    showImei: boolean;
    showSparepartDetails: boolean;
    showTechnicianName: boolean;
    showWarrantyInfo: boolean;
    showBarcode: boolean;
    printerType: "thermal" | "inkjet" | "dotmatrix";
    paperSize: string;
    printCopies: number;
}

// ============================================
// SERVICE SETTINGS
// ============================================

export interface WarrantyPreset {
    label: string;
    days: number;
}

export interface ServiceSettings {
    numberFormat: string;
    resetCounterYearly: boolean;
    // Workflow
    defaultStatus: "antrian" | "dicek" | "menunggu_sparepart" | "proses" | "selesai" | "diambil" | "batal";
    autoNotifyOnStatusChange: boolean;
    commissionModel: "completion" | "collection";
    // Warranty
    warrantyPresets: WarrantyPreset[];
    defaultWarrantyDays: number;
    gracePeriodDays: number;
    // Automation & Archiving
    autoCloseAfterDays: number;
    enableVirtualArchive: boolean;
    archiveExclusions: string[];
    enableLiquidation: boolean;
    reminderBeforePickup: boolean;
    reminderDays: number;
}

// ============================================
// WHATSAPP SETTINGS
// ============================================

export interface WhatsAppSettings {
    enabled: boolean;
    phoneNumber: string;
    newServiceTemplate: string;
    statusUpdateTemplate: string;
    readyForPickupTemplate: string;
    warrantyReminderTemplate: string;
    // Mode
    mode: "client" | "server";
    // Gateway (Server Mode)
    gatewayUrl: string;
    apiKey: string;
    // Auto-send toggles
    autoSendOnNewService: boolean;
    autoSendOnStatusChange: boolean;
    autoSendOnComplete: boolean;
}

// ============================================
// COMMISSION SETTINGS
// ============================================

export interface CommissionSettings {
    enabled: boolean;
    globalRate: number; // Percentage 0-100
    type: "flat" | "percentage";
    target: "technician" | "all";
}

// ============================================
// ACCOUNT MAPPING SETTINGS
// ============================================

export interface TaxSettings {
    enabled: boolean;
    rate: number; // Percentage (e.g. 11 for 11%)
    label: string; // e.g. "PPN", "VAT"
    inclusive: boolean; // Price includes tax?
}

export interface SystemSettings {
    currencySymbol: string;
    dateFormat: string; // e.g. "dd/MM/yyyy"
    timezone: string;
}

export type AccountMappingType =
    | 'asset_tool'
    | 'asset_equipment'
    | 'asset_furniture'
    | 'asset_vehicle'
    | 'asset_building'
    | 'asset_land'
    | 'asset_other'
    | 'depreciation_expense'
    | 'accumulated_depreciation'
    | 'default_cash'
    | 'owner_equity'
    | 'sales_revenue'
    | 'service_revenue'
    | 'cogs_sales'
    | 'cogs_service'
    | 'accounts_payable'
    | 'accounts_receivable';

export interface AccountMapping {
    type: AccountMappingType;
    accountId: string;
    label: string;
    description?: string;
}

export interface AccountMappingSettings {
    mappings: AccountMapping[];
}

// ============================================
// GENERAL SETTINGS (Accounting Mode)
// ============================================

export type AccountingMode = 'simple' | 'professional';

export interface GeneralSettings {
    accountingMode: AccountingMode;
    accountingSetupComplete: boolean;
}

// ============================================
// ALL SETTINGS COMBINED
// ============================================

export interface AllSettings {
    storeInfo: StoreInfo;
    receiptSettings: ReceiptSettings;
    serviceSettings: ServiceSettings;
    whatsappSettings: WhatsAppSettings;
    commissionSettings: CommissionSettings;
    accountMappings: AccountMappingSettings;
    generalSettings: GeneralSettings;
}

// ============================================
// PRINTER OPTIONS
// ============================================

export const PRINTER_TYPES = [
    { id: "thermal", label: "Thermal (58mm/80mm)" },
    { id: "inkjet", label: "Inkjet / Laser" },
    { id: "dotmatrix", label: "Dot Matrix" },
];

export const PAPER_SIZES = {
    thermal: [
        { id: "58mm", label: "58mm" },
        { id: "80mm", label: "80mm" },
    ],
    inkjet: [
        { id: "A4", label: "A4" },
        { id: "A5", label: "A5" },
        { id: "Letter", label: "Letter" },
    ],
    dotmatrix: [
        { id: "continuous", label: "Continuous Form" },
        { id: "A4", label: "A4" },
    ],
};

// ============================================
// PAYMENT METHODS SERVICE
// ============================================

export const PaymentMethodsService = {
    async getAll(): Promise<PaymentMethod[]> {
        const response = await api.get<ApiResponse<PaymentMethod[]>>("/payment-methods");
        return response.data.data || [];
    },

    async getEnabled(): Promise<PaymentMethod[]> {
        const response = await api.get<ApiResponse<PaymentMethod[]>>("/payment-methods/enabled");
        return response.data.data || [];
    },

    async create(data: { name: string; type: string; icon: string }): Promise<PaymentMethod> {
        const response = await api.post<ApiResponse<PaymentMethod>>("/payment-methods", data);
        return response.data.data!;
    },

    async update(id: string, data: Partial<PaymentMethod>): Promise<PaymentMethod> {
        const response = await api.put<ApiResponse<PaymentMethod>>(`/payment-methods/${id}`, data);
        return response.data.data!;
    },

    async disable(id: string): Promise<void> {
        await api.delete(`/payment-methods/${id}`);
    },

    async addVariant(methodId: string, data: { name: string; accountNumber?: string; accountHolder?: string; accountId?: string }): Promise<PaymentMethod> {
        const response = await api.post<ApiResponse<PaymentMethod>>(`/payment-methods/${methodId}/variants`, data);
        return response.data.data!;
    },

    async updateVariant(methodId: string, variantId: string, data: Partial<PaymentVariant>): Promise<void> {
        await api.put(`/payment-methods/${methodId}/variants/${variantId}`, data);
    },

    async disableVariant(methodId: string, variantId: string): Promise<void> {
        await api.delete(`/payment-methods/${methodId}/variants/${variantId}`);
    },
};

// ============================================
// SETTINGS SERVICE
// ============================================

export const SettingsService = {
    // Get all settings at once
    async getAll(): Promise<AllSettings> {
        const response = await api.get<ApiResponse<AllSettings>>("/settings");
        return response.data.data!;
    },

    // Store Info
    async getStoreInfo(): Promise<StoreInfo> {
        const response = await api.get<ApiResponse<StoreInfo>>("/settings/store-info");
        return response.data.data!;
    },

    async setStoreInfo(info: StoreInfo): Promise<void> {
        await api.put("/settings/store-info", info);
    },

    // Receipt Settings
    async getReceiptSettings(): Promise<ReceiptSettings> {
        const response = await api.get<ApiResponse<ReceiptSettings>>("/settings/receipt");
        return response.data.data!;
    },

    async setReceiptSettings(settings: ReceiptSettings): Promise<void> {
        await api.put("/settings/receipt", settings);
    },

    // Service Settings
    async getServiceSettings(): Promise<ServiceSettings> {
        const response = await api.get<ApiResponse<ServiceSettings>>("/settings/service");
        return response.data.data!;
    },

    async setServiceSettings(settings: ServiceSettings): Promise<void> {
        await api.put("/settings/service", settings);
    },

    // WhatsApp Settings
    async getWhatsAppSettings(): Promise<WhatsAppSettings> {
        const response = await api.get<ApiResponse<WhatsAppSettings>>("/settings/whatsapp");
        return response.data.data!;
    },

    async setWhatsAppSettings(settings: WhatsAppSettings): Promise<void> {
        await api.put("/settings/whatsapp", settings);
    },

    // Commission Settings
    async getCommissionSettings(): Promise<CommissionSettings> {
        const response = await api.get<ApiResponse<CommissionSettings>>("/settings/commission");
        return response.data.data!;
    },

    async setCommissionSettings(settings: CommissionSettings): Promise<void> {
        await api.put("/settings/commission", settings);
    },

    // Account Mapping Settings
    async getAccountMappings(): Promise<AccountMappingSettings> {
        const response = await api.get<ApiResponse<AccountMappingSettings>>("/settings/account-mappings");
        return response.data.data!;
    },

    async setAccountMappings(settings: AccountMappingSettings): Promise<void> {
        await api.put("/settings/account-mappings", settings);
    },

    // General Settings (Accounting Mode)
    async getGeneralSettings(): Promise<GeneralSettings> {
        const response = await api.get<ApiResponse<GeneralSettings>>("/settings/general");
        return response.data.data!;
    },

    async setGeneralSettings(settings: GeneralSettings): Promise<void> {
        await api.put("/settings/general", settings);
    },

    // Tax Settings
    async getTaxSettings(): Promise<TaxSettings> {
        const response = await api.get<ApiResponse<TaxSettings>>("/settings/tax");
        return response.data.data || { enabled: false, rate: 11, label: "PPN", inclusive: false };
    },

    async setTaxSettings(settings: TaxSettings): Promise<void> {
        await api.put("/settings/tax", settings);
    },

    // System Settings
    async getSystemSettings(): Promise<SystemSettings> {
        const response = await api.get<ApiResponse<SystemSettings>>("/settings/system");
        return response.data.data || { currencySymbol: "Rp", dateFormat: "dd/MM/yyyy", timezone: "Asia/Jakarta" };
    },

    async setSystemSettings(settings: SystemSettings): Promise<void> {
        await api.put("/settings/system", settings);
    },

    // Factory Reset
    async factoryReset(mode: "data" | "full"): Promise<void> {
        await api.post("/settings/reset", { mode });
    },

    // Generic methods (legacy/fallback)
    async get<T>(key: string): Promise<T | null> {
        try {
            const response = await api.get<ApiResponse<T>>(`/settings/${key}`);
            return response.data.data ?? null;
        } catch {
            return null;
        }
    },

    async set<T>(key: string, value: T): Promise<void> {
        await api.put(`/settings/${key}`, { value });
    },

    // Legacy compatibility
    async getPaymentMethods(): Promise<{ methods: PaymentMethod[] }> {
        const methods = await PaymentMethodsService.getAll();
        return { methods };
    },
};
