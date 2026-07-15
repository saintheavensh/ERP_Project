import { api } from "$lib/shared/lib/api-client";

export type ProfitAndLoss = {
    revenue: {
        total: number;
        sales: number;
        services: number;
    };
    cogs: {
        total: number;
        sales: number;
        services: number;
    };
    grossProfit: number;
    operatingExpenses: number;
    expenses: {
        total: number;
        details: Record<string, number>;
    };
    netProfit: number;
};

export type StockValueReport = {
    totalValue: number;
    totalValueHPP: number; // Added
    totalValueSell: number; // Added
    totalItems: number;
    totalStock: number; // Added
    categories: {
        id: string;
        name: string;
        value: number;
        items: number;
        stock: number; // Added
    }[];
};

export type DashboardStats = {
    revenue: number;
    revenueChange: number;
    orders: number;
    ordersChange: number;
    customers: number;
    customersChange: number;
    services: {
        active: number;
        pending: number;
        completed: number;
    };
};

export type SalesTrend = {
    date: string; // ISO date string
    value: number;
}[];

export type ServiceStatusStats = {
    status: string;
    count: number;
};

export type StockAdjustmentReport = {
    id: string;
    completedAt: string;
    productName: string;
    variantName: string | null;
    systemStock: number;
    physicalStock: number;
    difference: number;
    userName: string;
    reason: string | null;
};

// Added Missing Interfaces
export type TransactionReport = any;
export type SalesSummary = any;
export type PurchasesSummary = any;
export type PurchaseReport = any;
export type ServiceStats = any;
export type ServiceReport = any;
export type TechnicianReport = any;
export type PartsUsageReport = any;

export class ReportsService {
    static async getDashboardStats(): Promise<DashboardStats> {
        const response = await api.get<DashboardStats>("reports/dashboard");
        return response.data;
    }

    static async getSalesTrend(period: "week" | "month" | "year" = "week"): Promise<SalesTrend> {
        const response = await api.get<SalesTrend>(`reports/sales-trend?period=${period}`);
        return response.data;
    }

    static async getProfitLoss(params: { startDate: string, endDate: string }): Promise<ProfitAndLoss> {
        const response = await api.get<ProfitAndLoss>(`reports/profit-loss`, { params });
        return response.data;
    }

    // Alias for getProfitLoss as mistakenly called in some files
    static async getProfitAndLoss(params: { startDate: string, endDate: string }): Promise<ProfitAndLoss> {
        return this.getProfitLoss(params);
    }

    static async getStockValue(): Promise<StockValueReport> {
        const response = await api.get<StockValueReport>("reports/stock-value");
        return response.data;
    }

    static async getStockValueReport(): Promise<StockValueReport> {
        return this.getStockValue();
    }

    static async getServiceStatusStats(): Promise<ServiceStatusStats[]> {
        const response = await api.get<ServiceStatusStats[]>("reports/service-status");
        return response.data;
    }

    // Missing Methods Implementation
    static async getSummary(params: any): Promise<any> {
        const response = await api.get("reports/sales/summary", { params });
        return response.data.data;
    }

    static async getTransactions(params: any): Promise<any> {
        const response = await api.get("reports/sales/transactions", { params });
        return response.data.data;
    }

    static async getPurchasesSummary(params: any): Promise<any> {
        const response = await api.get("reports/purchases/summary", { params });
        return response.data.data;
    }

    static async getPurchaseTransactions(params: any): Promise<any> {
        const response = await api.get("reports/purchases/transactions", { params });
        return response.data.data;
    }

    static async getServiceStats(params: any): Promise<any> {
        const response = await api.get("reports/services/stats", { params });
        return response.data.data;
    }

    static async getServiceTransactions(params: any): Promise<any> {
        const response = await api.get("reports/services/transactions", { params });
        return response.data.data;
    }

    static async getTechnicianStats(params: any): Promise<any> {
        const response = await api.get("reports/services/technicians", { params });
        return response.data.data;
    }

    static async getPartsUsageReport(params: any): Promise<any> {
        const response = await api.get("reports/services/parts-usage", { params });
        return response.data.data;
    }

    static async getStockAdjustments(): Promise<StockAdjustmentReport[]> {
        const response = await api.get("reports/inventory/adjustments");
        return response.data.data;
    }
}
