export interface DashboardStatsDTO {
    // Sales metrics
    todaySales: {
        count: number;
        revenue: number; // in cents
        target: number;
        percentage: number;
    };
    weeklySales: {
        days: string[];
        values: number[];
    };

    // Inventory metrics
    lowStockItems: Array<{
        id: string;
        name: string;
        sku: string;
        currentStock: number;
        threshold: number;
    }>;
    outOfStockItems: number;
    totalProducts: number;

    // Financial metrics
    todayRevenue: number;
    weeklyRevenue: number;
    monthlyRevenue: number;

    // Customer metrics
    newCustomersToday: number;
    activeCustomers: number;

    // System metrics
    pendingOrders: number;
    openTickets: number;
    deviceStatus: {
        online: number;
        offline: number;
        total: number;
    };
}

export interface TimeRangeDTO {
    startDate: Date;
    endDate: Date;
    period: 'day' | 'week' | 'month' | 'year';
}
