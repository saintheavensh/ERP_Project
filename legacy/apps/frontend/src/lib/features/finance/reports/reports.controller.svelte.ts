import { createQuery } from "@tanstack/svelte-query";
import type { CreateQueryResult } from "@tanstack/svelte-query";
import {
    ReportsService,
    type TransactionReport,
    type SalesSummary,
    type PurchasesSummary,
    type PurchaseReport,
    type ServiceStats,
    type ServiceReport,
    type TechnicianReport,
    type PartsUsageReport,
    type ProfitAndLoss,
    type StockValueReport,
    type StockAdjustmentReport,
} from "./reports.service";
import { SettingsService, type GeneralSettings, type AccountingMode } from "$lib/features/settings/settings.service";
import { api } from "$lib/shared/lib/api-client";
import { authStore } from "$lib/shared/lib/auth-store.svelte";
import * as XLSX from "xlsx";

export class ReportsController {
    // State
    startDate = $state("2026-01-01"); // Default could be dynamic if needed
    endDate = $state("2026-01-31");
    activeTab = $state("digest");

    // Accounting Mode
    accountingMode = $state<AccountingMode>("simple");
    showProModeSetup = $state(false);
    loadingMode = $state(true);

    // Queries
    salesSummaryQuery: CreateQueryResult<SalesSummary, Error>;
    salesTransactionsQuery: CreateQueryResult<TransactionReport[], Error>;
    purchasesSummaryQuery: CreateQueryResult<PurchasesSummary, Error>;
    purchasesTransactionsQuery: CreateQueryResult<PurchaseReport[], Error>;
    servicesStatsQuery: CreateQueryResult<ServiceStats, Error>;
    servicesTransactionsQuery: CreateQueryResult<ServiceReport[], Error>;
    techniciansQuery: CreateQueryResult<TechnicianReport[], Error>;
    partsUsageQuery: CreateQueryResult<PartsUsageReport[], Error>;
    profitLossQuery: CreateQueryResult<ProfitAndLoss, Error>;
    stockValueQuery: CreateQueryResult<StockValueReport, Error>;
    stockAdjustmentsQuery: CreateQueryResult<StockAdjustmentReport[], Error>;
    accountTreeQuery: CreateQueryResult<any, Error>;
    mappingSettingsQuery: CreateQueryResult<any, Error>;

    constructor() {
        // Initialize Queries
        this.salesSummaryQuery = createQuery(() => ({
            queryKey: ["reports", "sales", "summary", this.startDate, this.endDate],
            queryFn: () => ReportsService.getSummary({ startDate: this.startDate, endDate: this.endDate }),
        }));

        this.salesTransactionsQuery = createQuery(() => ({
            queryKey: ["reports", "sales", "transactions", this.startDate, this.endDate],
            queryFn: () => ReportsService.getTransactions({ startDate: this.startDate, endDate: this.endDate }),
        }));

        this.purchasesSummaryQuery = createQuery(() => ({
            queryKey: ["reports", "purchases", "summary", this.startDate, this.endDate],
            queryFn: () => ReportsService.getPurchasesSummary({ startDate: this.startDate, endDate: this.endDate }),
        }));

        this.purchasesTransactionsQuery = createQuery(() => ({
            queryKey: ["reports", "purchases", "transactions", this.startDate, this.endDate],
            queryFn: () => ReportsService.getPurchaseTransactions({ startDate: this.startDate, endDate: this.endDate }),
        }));

        this.servicesStatsQuery = createQuery(() => ({
            queryKey: ["reports", "services", "stats", this.startDate, this.endDate],
            queryFn: () => ReportsService.getServiceStats({ startDate: this.startDate, endDate: this.endDate }),
        }));

        this.servicesTransactionsQuery = createQuery(() => ({
            queryKey: ["reports", "services", "transactions", this.startDate, this.endDate],
            queryFn: () => ReportsService.getServiceTransactions({ startDate: this.startDate, endDate: this.endDate }),
        }));

        this.techniciansQuery = createQuery(() => ({
            queryKey: ["reports", "technicians", this.startDate, this.endDate],
            queryFn: () => ReportsService.getTechnicianStats({ startDate: this.startDate, endDate: this.endDate }),
        }));

        this.partsUsageQuery = createQuery(() => ({
            queryKey: ["reports", "parts", this.startDate, this.endDate],
            queryFn: () => ReportsService.getPartsUsageReport({ startDate: this.startDate, endDate: this.endDate }),
        }));

        this.profitLossQuery = createQuery(() => ({
            queryKey: ["reports", "profit-loss", this.startDate, this.endDate],
            queryFn: () => ReportsService.getProfitAndLoss({ startDate: this.startDate, endDate: this.endDate }),
        }));

        this.stockValueQuery = createQuery(() => ({
            queryKey: ["reports", "stock-value"],
            queryFn: () => ReportsService.getStockValueReport(),
        }));

        this.stockAdjustmentsQuery = createQuery(() => ({
            queryKey: ["reports", "stock-adjustments"],
            queryFn: () => ReportsService.getStockAdjustments(),
        }));

        this.accountTreeQuery = createQuery(() => ({
            queryKey: ["accounting", "tree"],
            queryFn: async () => {
                const res = await api.get("/accounting/accounts/tree");
                return res.data.data;
            },
            enabled: !!(this.accountingMode === "professional"),
        }));

        this.mappingSettingsQuery = createQuery(() => ({
            queryKey: ["settings", "account-mappings"],
            queryFn: () => SettingsService.getAccountMappings(),
            enabled: !!(this.accountingMode === "professional"),
        }));
    }

    async init() {
        await this.fetchAccountingMode();
    }

    // Computed / Derived State
    get isLoading() {
        return this.salesSummaryQuery.isPending ||
            this.purchasesSummaryQuery.isPending ||
            this.servicesStatsQuery.isPending;
    }

    get salesSummary() {
        return this.salesSummaryQuery.data || {
            totalRevenue: 0,
            totalHPP: 0,
            totalProfit: 0,
            totalTransactions: 0,
            totalItems: 0,
            profitMargin: 0,
        };
    }

    get salesTransactions() {
        return this.salesTransactionsQuery.data || [];
    }

    get salesTrendData() {
        return this.salesTransactions
            .map((t) => ({
                date: t.date,
                value: t.total,
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    get purchasesSummary() {
        return this.purchasesSummaryQuery.data || {
            totalAmount: 0,
            totalTransactions: 0,
            totalItems: 0,
        };
    }

    get purchasesTransactions() {
        return this.purchasesTransactionsQuery.data || [];
    }

    get servicesStats() {
        return this.servicesStatsQuery.data || {
            total: 0,
            completed: 0,
            byStatus: {},
            revenue: 0,
        };
    }

    get servicesTransactions() {
        return this.servicesTransactionsQuery.data || [];
    }

    get serviceStatusData() {
        return Object.entries(this.servicesStats.byStatus).map(([status, count]) => ({
            status: this.getStatusLabel(status),
            count: count as number,
        }));
    }

    get technicians() {
        return this.techniciansQuery.data || [];
    }

    get partsUsage() {
        return this.partsUsageQuery.data || [];
    }

    get profitLoss() {
        return this.profitLossQuery.data || null;
    }

    get stockValue() {
        return this.stockValueQuery.data || null;
    }

    get stockAdjustments() {
        return this.stockAdjustmentsQuery.data || [];
    }

    // Methods
    async fetchAccountingMode() {
        try {
            this.loadingMode = true;
            const settings = await SettingsService.getGeneralSettings();
            this.accountingMode = settings.accountingMode;
        } catch (e) {
            console.error("Failed to fetch accounting mode", e);
            this.accountingMode = "simple";
        } finally {
            this.loadingMode = false;
        }
    }

    async disableProMode() {
        try {
            const settings: GeneralSettings = {
                accountingMode: "simple",
                accountingSetupComplete: false,
            };
            await SettingsService.setGeneralSettings(settings);
            this.accountingMode = "simple";
        } catch (e) {
            console.error("Failed to disable Pro Mode", e);
        }
    }

    handleProModeComplete() {
        this.accountingMode = "professional";
        this.showProModeSetup = false;
    }

    exportToExcel() {
        const wb = XLSX.utils.book_new();

        // Sales Sheet
        if (this.salesTransactions.length > 0) {
            const salesData = this.salesTransactions.map((t) => ({
                Tanggal: t.date,
                "No Nota": t.nota,
                Items: t.items,
                Total: t.total,
                HPP: t.hpp,
                Profit: t.profit,
            }));
            const wsSales = XLSX.utils.json_to_sheet(salesData);
            XLSX.utils.book_append_sheet(wb, wsSales, "Penjualan");
        }

        // Services Sheet
        if (this.servicesTransactions.length > 0) {
            const servicesData = this.servicesTransactions.map((s) => ({
                Tanggal: s.date,
                "No Service": s.no,
                Customer: s.customerName,
                Device: s.deviceInfo,
                Status: s.status,
                Biaya: s.actualCost,
            }));
            const wsServices = XLSX.utils.json_to_sheet(servicesData);
            XLSX.utils.book_append_sheet(wb, wsServices, "Service");
        }

        // ... (Other sheets logic remains same, just using this.getter) ...
        // Purchases Sheet
        if (this.purchasesTransactions.length > 0) {
            const purchasesData = this.purchasesTransactions.map((p) => ({
                Tanggal: p.date,
                "No Faktur": p.id,
                Supplier: p.supplierName,
                Total: p.totalAmount,
                Items: p.items,
            }));
            const wsPurchases = XLSX.utils.json_to_sheet(purchasesData);
            XLSX.utils.book_append_sheet(wb, wsPurchases, "Pembelian");
        }

        // Technicians Sheet
        if (this.technicians.length > 0) {
            const techData = this.technicians.map((t) => ({
                Nama: t.name,
                "Total Service": t.totalServices,
                Pendapatan: t.revenue,
            }));
            const wsTech = XLSX.utils.json_to_sheet(techData);
            XLSX.utils.book_append_sheet(wb, wsTech, "Teknisi");
        }

        // Parts Sheet
        if (this.partsUsage.length > 0) {
            const partsData = this.partsUsage.map((p) => ({
                "Nama Part": p.partName,
                Source: p.source,
                "Jumlah Terpakai": p.qty,
                Subtotal: p.subtotal,
            }));
            const wsParts = XLSX.utils.json_to_sheet(partsData);
            XLSX.utils.book_append_sheet(wb, wsParts, "Sparepart");
        }

        // Stock Sheet
        if (this.stockValue?.categories) {
            const stockData = this.stockValue.categories.map((c) => ({
                Kategori: c.name,
                Stock: c.stock,
                "Nilai HPP": c.value,
            }));
            const wsStock = XLSX.utils.json_to_sheet(stockData);
            XLSX.utils.book_append_sheet(wb, wsStock, "Stok");
        }

        // Adjustments Sheet
        const adjustments = this.stockAdjustments;
        if (adjustments.length > 0) {
            const adjData = adjustments.map((adj) => ({
                Tanggal: adj.completedAt,
                Produk: adj.productName,
                Varian: adj.variantName || "-",
                Sistem: adj.systemStock,
                Fisik: adj.physicalStock,
                Selisih: adj.difference,
                Petugas: adj.userName,
                Alasan: adj.reason || "-",
            }));
            const wsAdj = XLSX.utils.json_to_sheet(adjData);
            XLSX.utils.book_append_sheet(wb, wsAdj, "Penyesuaian Stok");
        }

        const filename = `Laporan_Lengkap_${this.startDate}_sd_${this.endDate}.xlsx`;
        XLSX.writeFile(wb, filename);
    }

    // Helpers
    formatCurrency(amount: number) {
        return `Rp ${amount.toLocaleString("id-ID")}`;
    }

    getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            antrian: "Antrian",
            dicek: "Dicek",
            konfirmasi: "Konfirmasi",
            dikerjakan: "Dikerjakan",
            selesai: "Selesai",
            diambil: "Diambil",
            batal: "Batal",
        };
        return labels[status] || status;
    }
}

