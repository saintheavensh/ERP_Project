import { AccountingService } from "./accounting.service";

/**
 * Controller for the Accounting Dashboard
 * Manages state and business logic for the accounting overview page
 */
export class AccountingController {
    // State
    loading = $state(true);
    dashboard = $state<any>(null);
    error = $state<string | null>(null);

    private refreshInterval: ReturnType<typeof setInterval> | null = null;

    /**
     * Initialize the controller and start auto-refresh
     */
    init() {
        this.fetchDashboard();
        this.refreshInterval = setInterval(() => this.fetchDashboard(), 60000);
    }

    /**
     * Cleanup interval on destroy
     */
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    /**
     * Fetch dashboard data from API
     */
    async fetchDashboard() {
        try {
            this.loading = true;
            this.error = null;
            this.dashboard = await AccountingService.getDashboard();
        } catch (e: any) {
            console.error("Failed to fetch accounting dashboard", e);
            this.error =
                e.response?.data?.error || e.message || "Failed to load data";
        } finally {
            this.loading = false;
        }
    }

    // Derived values
    get progressColor(): string {
        if (!this.dashboard?.todayProgress) return "bg-slate-400";
        const pct = this.dashboard.todayProgress.progressPercent || 0;
        if (pct >= 100) return "bg-green-500";
        if (pct >= 70) return "bg-blue-500";
        if (pct >= 40) return "bg-yellow-500";
        return "bg-red-500";
    }

    get netIncome(): number {
        return (
            (this.dashboard?.balanceSummary?.REVENUE?.total || 0) -
            (this.dashboard?.balanceSummary?.EXPENSE?.total || 0)
        );
    }

    get expenseRatio(): number {
        return this.dashboard?.balanceSummary?.REVENUE?.total > 0
            ? (this.dashboard?.balanceSummary?.EXPENSE?.total /
                this.dashboard?.balanceSummary?.REVENUE?.total) *
            100
            : 0;
    }

    get deprExpense(): any {
        return this.dashboard?.balanceSummary?.EXPENSE?.accounts?.find((a: any) =>
            a.name.toLowerCase().includes("penyusutan")
        );
    }

    // Helpers
    formatCurrency(val: number): string {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(val);
    }
}
