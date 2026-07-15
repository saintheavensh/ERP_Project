export interface Setting {
    key: string;
    value: any;
    updatedAt?: Date;
}

// ============================================
// CONFIGURATION INTERFACES
// ============================================

export interface PaymentVariant {
    id: string;
    name: string;
    accountNumber?: string;
    accountHolder?: string;
    accountId?: string;
}

export interface PaymentMethod {
    id: string;
    name: string;
    type: "cash" | "transfer" | "qris" | "ewallet" | "custom";
    icon: string;
    enabled: boolean;
    variants?: PaymentVariant[];
    accountId?: string;
}

export interface PaymentMethodConfig {
    methods: PaymentMethod[];
}

export interface StoreInfo {
    name: string;
    address: string;
    phone: string;
    email?: string;
    logo?: string;
    socialMedia?: string;
}

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
    printerType: "thermal" | "inkjet" | "dotmatrix";
    paperSize: string;
    printCopies: number;
}

export interface WarrantyPreset {
    label: string;
    days: number;
}

export interface ServiceSettings {
    numberFormat: string;
    resetCounterYearly: boolean;
    defaultStatus: "antrian" | "proses";
    autoNotifyOnStatusChange: boolean;
    commissionModel: "completion" | "collection";
    warrantyPresets: WarrantyPreset[];
    defaultWarrantyDays: number;
    gracePeriodDays: number;
    autoCloseAfterDays: number;
    enableVirtualArchive: boolean;
    archiveExclusions: string[];
    enableLiquidation: boolean;
    reminderBeforePickup: boolean;
    reminderDays: number;
}

export interface WhatsAppSettings {
    enabled: boolean;
    phoneNumber: string;
    newServiceTemplate: string;
    statusUpdateTemplate: string;
    readyForPickupTemplate: string;
    warrantyReminderTemplate: string;
    mode: "client" | "server";
    gatewayUrl: string;
    apiKey: string;
    autoSendOnNewService: boolean;
    autoSendOnStatusChange: boolean;
    autoSendOnComplete: boolean;
}

export interface CommissionSettings {
    enabled: boolean;
    globalRate: number;
    type: "flat" | "percentage";
    target: "technician" | "all";
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

export interface TaxSettings {
    enabled: boolean;
    rate: number;
    label: string;
    inclusive: boolean;
}

export interface SystemSettings {
    currencySymbol: string;
    dateFormat: string;
    timezone: string;
}

export type AccountingMode = 'simple' | 'professional';

export interface GeneralSettings {
    accountingMode: AccountingMode;
    accountingSetupComplete: boolean;
}

export interface AllSettings {
    storeInfo: StoreInfo;
    receiptSettings: ReceiptSettings;
    serviceSettings: ServiceSettings;
    whatsappSettings: WhatsAppSettings;
    commissionSettings: CommissionSettings;
    accountMappings: AccountMappingSettings;
    generalSettings: GeneralSettings;
}
