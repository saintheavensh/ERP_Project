<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import RevenueChart from "$lib/shared/components/dashboard/RevenueChart.svelte";
    import TopProductsChart from "$lib/shared/components/dashboard/TopProductsChart.svelte";
    import ActivityLog from "$lib/shared/components/dashboard/ActivityLog.svelte";
    import ProfitLossSummary from "$lib/shared/components/dashboard/ProfitLossSummary.svelte";
    import ReportWidget from "$lib/shared/components/dashboard/ReportWidget.svelte";
    import ApprovalList from "$lib/shared/components/dashboard/ApprovalList.svelte";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
        CardDescription,
    } from "$lib/shared/components/ui/card";
    import { Button } from "$lib/shared/components/ui/button";
    import {
        BarChart3,
        Wallet,
        TrendingUp,
        Users,
        Settings,
        AlertCircle,
        Loader2,
        DollarSign,
        ArrowUpRight,
    } from "lucide-svelte";
    import { api } from "$lib/shared/lib/api-client";
    import { authStore } from "$lib/shared/lib/auth-store.svelte";
    import { AccountingReportService } from "$lib/features/finance/accounting/services/accounting-reports.service";

    const user = $derived(authStore.user);

    // State Variables
    let loading = $state(true);
    let dashboardData = $state<any>(null);
    let activities = $state<any[]>([]);
    let profitLossData = $state<any>(null);
    let error = $state<string | null>(null);
    let currentTime = $state(new Date());

    // Formatting currency
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(val);

    async function fetchData() {
        try {
            loading = true;
            error = null;
            const startDate = new Date();
            startDate.setDate(1); // 1st of month
            const endDate = new Date();

            const [dashRes, actRes, plRes] = await Promise.all([
                api.get("/dashboard"),
                api.get("/dashboard/activities", { params: { limit: 10 } }),
                AccountingReportService.getIncomeStatement({
                    startDate,
                    endDate,
                }),
            ]);

            dashboardData = dashRes.data.data;
            activities = actRes.data.data;
            profitLossData = plRes;
        } catch (e: any) {
            console.error("Failed to fetch dashboard data", e);
            error =
                e.response?.data?.message ||
                e.message ||
                "Failed to load dashboard data";
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        const timer = setInterval(() => {
            currentTime = new Date();
        }, 1000);

        fetchData();
        const interval = setInterval(fetchData, 300000); // 5 mins

        return () => {
            clearInterval(interval);
            clearInterval(timer);
        };
    });
</script>

<div class="space-y-8 animate-in fade-in-50 duration-500 pb-10">
    <div class="flex flex-col gap-2">
        <h1 class="text-3xl font-bold tracking-tight">Owner Dashboard</h1>
        <p class="text-muted-foreground flex items-center gap-2">
            Laporan eksekutif per {currentTime.toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
            })}
            {#if loading}
                <Loader2 class="h-3 w-3 animate-spin ml-2" />
            {/if}
        </p>
    </div>

    {#if error}
        <div
            class="p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center gap-3"
        >
            <AlertCircle class="h-5 w-5" />
            <span class="font-medium">Error loading data: {error}</span>
        </div>
    {/if}

    <!-- Executive Summary -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <!-- Profit -->
        <Card class="bg-slate-900 text-white border-none">
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium text-slate-200"
                    >Total Profit (Bulan Ini)</CardTitle
                >
                <Wallet class="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">
                    {#if profitLossData}
                        {formatCurrency(profitLossData.netIncome || 0)}
                    {:else}
                        ...
                    {/if}
                </div>
                <p
                    class="text-xs text-emerald-400 font-bold flex items-center mt-1"
                >
                    <TrendingUp class="h-3 w-3 mr-1" /> +12% growth
                </p>
            </CardContent>
        </Card>

        <!-- Revenue/Omzet -->
        <Card>
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium"
                    >Total Omzet (Hari Ini)</CardTitle
                >
                <DollarSign class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">
                    {#if dashboardData}
                        {formatCurrency(dashboardData.cards.revenueToday || 0)}
                    {:else}
                        ...
                    {/if}
                </div>
                <p class="text-xs text-green-600">
                    Calculated from today's sales
                </p>
            </CardContent>
        </Card>

        <!-- Customer Base -->
        <Card>
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium"
                    >Active Services</CardTitle
                >
                <Users class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">
                    {#if dashboardData}
                        {dashboardData.cards.activeServices || 0}
                    {:else}
                        ...
                    {/if}
                </div>
                <p class="text-xs text-muted-foreground">
                    Jobs currently in progress
                </p>
            </CardContent>
        </Card>

        <!-- Operational Cost -->
        <Card>
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium"
                    >Total Expenses (Bulan Ini)</CardTitle
                >
                <Wallet class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold text-red-600">
                    {#if profitLossData}
                        {formatCurrency(profitLossData.expenses?.total || 0)}
                    {:else}
                        ...
                    {/if}
                </div>
                <p class="text-xs text-muted-foreground">Recorded expenses</p>
            </CardContent>
        </Card>
    </div>

    <!-- Analytics & Actions -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <!-- Main Content Column -->
        <div class="xl:col-span-2 space-y-8">
            <!-- Revenue Chart -->
            <ReportWidget
                title="Revenue Analytics"
                description="Income trends (Last 7 Days)"
            >
                {#if dashboardData && dashboardData.charts.revenueTrend}
                    <div class="h-[350px] w-full">
                        <RevenueChart
                            data={dashboardData.charts.revenueTrend}
                        />
                    </div>
                {:else if loading}
                    <div
                        class="h-[350px] w-full bg-slate-100 animate-pulse rounded-2xl"
                    ></div>
                {/if}
            </ReportWidget>

            <div class="grid gap-8 grid-cols-1 md:grid-cols-2">
                <ReportWidget
                    title="Manager Approvals"
                    description="Pending requests requiring your action"
                >
                    <ApprovalList />
                </ReportWidget>

                <div class="space-y-4 flex flex-col gap-4">
                    <Button
                        variant="outline"
                        class="w-full h-32 flex flex-col items-start p-6 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-3xl"
                        href="/reports"
                    >
                        <div
                            class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mb-3"
                        >
                            <BarChart3
                                class="h-6 w-6 text-blue-600 dark:text-blue-400"
                            />
                        </div>
                        <div class="text-lg font-bold">Laporan Lengkap</div>
                        <div
                            class="text-sm text-muted-foreground text-left font-normal mt-1"
                        >
                            Analisis penjualan, stok, dan performa teknisi
                            secara detail.
                        </div>
                    </Button>

                    <Button
                        variant="outline"
                        class="w-full h-32 flex flex-col items-start p-6 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 rounded-3xl"
                        href="/accounting"
                    >
                        <div
                            class="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg mb-3"
                        >
                            <Wallet
                                class="h-6 w-6 text-purple-600 dark:text-purple-400"
                            />
                        </div>
                        <div class="text-lg font-bold">Akuntansi</div>
                        <div
                            class="text-sm text-muted-foreground text-left font-normal mt-1"
                        >
                            Jurnal, Buku Besar, Neraca, dan Laporan Laba Rugi.
                        </div>
                    </Button>
                </div>
            </div>
        </div>

        <!-- Sidebar Column -->
        <div class="space-y-8">
            <!-- Performance Widget (Top Products) -->
            <Card
                class="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-3xl"
            >
                <CardHeader class="border-b border-slate-100/50 pb-4">
                    <CardTitle class="text-lg font-bold">Top Products</CardTitle
                    >
                    <CardDescription>Most sold items</CardDescription>
                </CardHeader>
                <CardContent class="p-6">
                    {#if dashboardData && dashboardData.charts.topProducts}
                        <div class="h-[300px]">
                            <TopProductsChart
                                data={dashboardData.charts.topProducts}
                            />
                        </div>
                    {:else if loading}
                        <div
                            class="h-[300px] w-full bg-slate-100 animate-pulse rounded-2xl"
                        ></div>
                    {/if}
                </CardContent>
            </Card>

            <!-- Activity Log -->
            <Card
                class="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-3xl"
            >
                <CardHeader class="border-b border-slate-100/50 pb-4">
                    <CardTitle class="text-lg font-bold"
                        >Recent System Activity</CardTitle
                    >
                </CardHeader>
                <CardContent
                    class="p-0 max-h-[400px] overflow-auto custom-scrollbar"
                >
                    <ActivityLog {activities} />
                </CardContent>
            </Card>

            <!-- Quick Settings -->
            <Card>
                <CardHeader>
                    <CardTitle class="text-md">Quick Settings</CardTitle>
                </CardHeader>
                <CardContent class="grid gap-2">
                    <Button
                        variant="ghost"
                        class="justify-start"
                        href="/settings"
                    >
                        <Settings class="mr-2 h-4 w-4" />
                        Pengaturan Toko
                    </Button>
                    <Button
                        variant="ghost"
                        class="justify-start"
                        href="/settings/employees"
                    >
                        <Users class="mr-2 h-4 w-4" />
                        Manajemen User
                    </Button>
                </CardContent>
            </Card>
        </div>
    </div>
</div>

<style>
    /* Custom Scrollbar for activity log */
    :global(.custom-scrollbar::-webkit-scrollbar) {
        width: 6px;
    }
    :global(.custom-scrollbar::-webkit-scrollbar-track) {
        background: transparent;
    }
    :global(.custom-scrollbar::-webkit-scrollbar-thumb) {
        background-color: rgba(0, 0, 0, 0.1);
        border-radius: 20px;
    }
</style>
