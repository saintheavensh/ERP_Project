import {
    PaymentMethodConfig, StoreInfo, ReceiptSettings, ServiceSettings,
    WhatsAppSettings, CommissionSettings, AccountMappingSettings,
    GeneralSettings, TaxSettings, SystemSettings
} from "../domain";
import type { RoleBehavior } from "../../../../../../../packages/shared/src/types/service";

export const DEFAULT_PAYMENT_METHODS: PaymentMethodConfig = {
    methods: [
        { id: "cash", name: "Tunai", type: "cash", icon: "💵", enabled: true },
        { id: "transfer", name: "Transfer Bank", type: "transfer", icon: "🏦", enabled: true, variants: [] },
        { id: "qris", name: "QRIS", type: "qris", icon: "📱", enabled: true, variants: [] },
    ]
};

export const DEFAULT_STORE_INFO: StoreInfo = {
    name: "Toko Service HP",
    address: "",
    phone: "",
    email: "",
    logo: "",
    socialMedia: "",
};

export const DEFAULT_RECEIPT_SETTINGS: ReceiptSettings = {
    showLogo: true,
    headerText: "",
    footerText: "Terima kasih atas kepercayaan Anda",
    termsConditions: "Barang yang sudah diambil tidak dapat diklaim kembali",
    showCustomerPhone: true,
    showCustomerAddress: false,
    showImei: false,
    showSparepartDetails: false,
    showTechnicianName: true,
    showWarrantyInfo: true,
    printerType: "thermal",
    paperSize: "58mm",
    printCopies: 1,
};

export const DEFAULT_SERVICE_SETTINGS: ServiceSettings = {
    numberFormat: "SRV-{YYYY}-{XXX}",
    resetCounterYearly: true,
    defaultStatus: "antrian",
    autoNotifyOnStatusChange: false,
    commissionModel: "completion",
    warrantyPresets: [
        { label: "Tanpa Garansi", days: 0 },
        { label: "1 Minggu", days: 7 },
        { label: "2 Minggu", days: 14 },
        { label: "1 Bulan", days: 30 },
        { label: "3 Bulan", days: 90 },
    ],
    defaultWarrantyDays: 7,
    gracePeriodDays: 3,
    autoCloseAfterDays: 30,
    enableVirtualArchive: true,
    archiveExclusions: ["dikerjakan"],
    enableLiquidation: false,
    reminderBeforePickup: true,
    reminderDays: 7,
};

export const DEFAULT_WHATSAPP_SETTINGS: WhatsAppSettings = {
    enabled: false,
    phoneNumber: "",
    newServiceTemplate: "Halo {customer}, terima kasih telah mempercayakan service HP Anda kepada kami. Nomor service: {serviceNo}. Kami akan menghubungi Anda setelah ada perkembangan.",
    statusUpdateTemplate: "Halo {customer}, status service {serviceNo} Anda telah diupdate menjadi: {status}.",
    readyForPickupTemplate: "Halo {customer}, HP Anda sudah selesai dan siap diambil. Nomor service: {serviceNo}. Total biaya: Rp {total}. Terima kasih!",
    warrantyReminderTemplate: "Halo {customer}, garansi service {serviceNo} Anda akan berakhir dalam {days} hari. Jika ada kendala, segera hubungi kami.",
    mode: "client",
    gatewayUrl: "",
    apiKey: "",
    autoSendOnNewService: false,
    autoSendOnStatusChange: false,
    autoSendOnComplete: false,
};

export const DEFAULT_COMMISSION_SETTINGS: CommissionSettings = {
    enabled: false,
    globalRate: 10,
    type: "percentage",
    target: "technician",
};

export const DEFAULT_ACCOUNT_MAPPINGS: AccountMappingSettings = {
    mappings: [
        { type: 'asset_tool', accountId: '1-4001', label: 'Peralatan Service', description: 'Alat service HP/elektronik' },
        { type: 'asset_equipment', accountId: '1-4002', label: 'Peralatan Umum', description: 'Peralatan kantor/toko' },
        { type: 'asset_furniture', accountId: '1-4002', label: 'Furniture & Perlengkapan', description: 'Meja, kursi, rak, display' },
        { type: 'asset_vehicle', accountId: '1-4003', label: 'Kendaraan', description: 'Motor/mobil operasional' },
        { type: 'asset_building', accountId: '1-4004', label: 'Bangunan', description: 'Ruko/gedung' },
        { type: 'asset_land', accountId: '1-4005', label: 'Tanah', description: 'Tanah (tidak disusutkan)' },
        { type: 'asset_other', accountId: '1-4090', label: 'Aset Lainnya', description: 'Aset tetap lainnya' },
        { type: 'depreciation_expense', accountId: '5-3000', label: 'Beban Penyusutan', description: 'Beban penyusutan bulanan' },
        { type: 'accumulated_depreciation', accountId: '1-4099', label: 'Akumulasi Penyusutan', description: 'Akun kontra aset' },
        { type: 'default_cash', accountId: '1-1001', label: 'Kas Toko', description: 'Sumber dana default untuk pembelian' },
        { type: 'owner_equity', accountId: '3-1000', label: 'Modal Pemilik', description: 'Modal awal pemilik' },
        { type: 'sales_revenue', accountId: '4-1000', label: 'Pendapatan Penjualan', description: 'Pendapatan dari penjualan barang' },
        { type: 'service_revenue', accountId: '4-2000', label: 'Pendapatan Service', description: 'Pendapatan dari jasa servis' },
        { type: 'cogs_sales', accountId: '5-1001', label: 'HPP Penjualan', description: 'Harga pokok barang terjual' },
        { type: 'cogs_service', accountId: '5-1002', label: 'HPP Service', description: 'Sparepart untuk service' },
        { type: 'accounts_payable', accountId: '2-1000', label: 'Hutang Usaha', description: 'Hutang ke supplier' },
        { type: 'accounts_receivable', accountId: '1-2000', label: 'Piutang Usaha', description: 'Piutang dari pelanggan' },
    ]
};

export const DEFAULT_TAX_SETTINGS: TaxSettings = {
    enabled: false,
    rate: 11,
    label: "PPN",
    inclusive: false,
};

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
    currencySymbol: "Rp",
    dateFormat: "dd/MM/yyyy",
    timezone: "Asia/Jakarta",
};

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
    accountingMode: 'simple',
    accountingSetupComplete: false,
};

export const DEFAULT_ROLE_BEHAVIOR: RoleBehavior = {
    mode: 'strict'
};
