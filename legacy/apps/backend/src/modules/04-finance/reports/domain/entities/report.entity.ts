export interface ReportFilters {
    startDate?: string;
    endDate?: string;
    commissionModel?: 'completion' | 'collection';
}

export interface SalesSummary {
    totalRevenue: number;
    totalHPP: number;
    totalProfit: number;
    totalTransactions: number;
    totalItems: number;
    profitMargin: number;
}

export interface ProfitAndLoss {
    revenue: {
        sales: number;
        services: number;
        servicesPending: number;
        total: number;
    };
    cogs: {
        sales: number;
        services: number;
        servicesPending: number;
        total: number;
    };
    grossProfit: number;
    expenses: {
        operational: number;
        commissions: number;
        commissionsPending: number;
        total: number;
    };
    netProfit: number;
    pendingProfit: number;
}

export interface TransactionReport {
    id: string;
    date: Date;
    nota: string;
    customerName: string | null;
    items: number;
    total: number;
    hpp: number;
    profit: number;
}

export interface StockValueReport {
    totalItems: number;
    totalStock: number;
    totalValueHPP: number;
    totalValueSell: number;
    potentialProfit: number;
    categories: {
        name: string;
        stock: number;
        value: number;
    }[];
}

export interface ServiceReport {
    id: number;
    no: string;
    date: Date;
    customerName: string;
    deviceInfo: string;
    status: string;
    estimatedCost: number;
    actualCost: number;
}

export interface PurchasesSummary {
    totalAmount: number;
    totalTransactions: number;
    totalItems: number;
}

export interface PurchaseReport {
    id: string;
    date: Date;
    supplierId: string;
    supplierName: string | null;
    items: number;
    totalAmount: number;
    notes: string | null;
}

export interface TechnicianReport {
    id: string;
    name: string;
    image: string | null;
    totalServices: number;
    completed: number;
    inProgress: number;
    cancelled: number;
    revenue: number;
    completionRate: number;
}

export interface PartsUsageReport {
    serviceId: number;
    serviceNo: string;
    date: Date;
    partName: string;
    source: string;
    qty: number;
    price: number;
    subtotal: number;
    variant?: string;
}

export interface ActivityLogReport {
    id: string;
    timestamp: Date;
    user: { id: string; name: string; role: string };
    action: string;
    entityType: string;
    entityId: string;
    description: string;
    details: {
        oldValue: any | null;
        newValue: any | null;
    };
}
