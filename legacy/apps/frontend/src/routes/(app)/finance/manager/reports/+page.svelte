<script lang="ts">
    import { onMount } from "svelte";
    import { Card, CardContent } from "$lib/shared/components/ui/card";
    import { Button } from "$lib/shared/components/ui/button";
    import { Label } from "$lib/shared/components/ui/label";
    import { Switch } from "$lib/shared/components/ui/switch";
    import {
        Tabs,
        TabsContent,
        TabsList,
        TabsTrigger,
    } from "$lib/shared/components/ui/tabs";
    import {
        Download,
        Filter,
        TrendingUp,
        Package,
        Wrench,
        ShoppingCart,
        ClipboardList,
        Users,
        BarChart3,
        ArrowUpRight,
        Calculator,
        Wallet,
    } from "lucide-svelte";
    import { ReportsController } from "$lib/features/finance/reports/reports.controller.svelte"; // Relative path adjusted
    import { authStore } from "$lib/shared/lib/auth-store.svelte";

    // Components
    import ManagerDigest from "$lib/features/finance/reports/components/ManagerDigest.svelte";
    import SalesTab from "$lib/features/finance/reports/components/SalesTab.svelte";
    import ServicesTab from "$lib/features/finance/reports/components/ServicesTab.svelte";
    import TechniciansTab from "$lib/features/finance/reports/components/TechniciansTab.svelte";
    import PurchasesTab from "$lib/features/finance/reports/components/PurchasesTab.svelte";
    import PartsTab from "$lib/features/finance/reports/components/PartsTab.svelte";
    import StockTab from "$lib/features/finance/reports/components/StockTab.svelte";
    import AccountingTab from "$lib/features/finance/reports/components/AccountingTab.svelte";
    import ProfitLossTab from "$lib/features/finance/reports/components/ProfitLossTab.svelte";
    import ProModeSetupDialog from "$lib/features/finance/reports/components/ProModeSetupDialog.svelte";
    import DateTimePicker from "$lib/shared/components/custom/date-time-picker.svelte";

    // Initialize Controller
    const controller = new ReportsController();

    onMount(() => {
        controller.init();
    });
</script>

<ProModeSetupDialog
    bind:open={controller.showProModeSetup}
    onClose={() => (controller.showProModeSetup = false)}
    onComplete={() => controller.handleProModeComplete()}
/>

<div class="space-y-8 pb-10">
    <!-- Header with Glassmorphism -->
    <div
        class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-2xl"
    >
        <div class="absolute inset-0 bg-white/10 backdrop-blur-3xl"></div>
        <div
            class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
            <div>
                <h1 class="text-3xl font-bold tracking-tight">
                    Laporan Keuangan
                </h1>
                <p class="mt-2 text-blue-100 opacity-90 max-w-xl">
                    Analisis komprehensif performa bisnis Anda. Pantau
                    penjualan, pembelian, dan layanan service secara real-time.
                </p>
            </div>
            <div class="flex items-center gap-3">
                <!-- Mode Toggle -->
                <div
                    class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md"
                >
                    <span
                        class="text-xs font-medium text-blue-100 {controller.accountingMode ===
                        'simple'
                            ? 'opacity-100'
                            : 'opacity-50'}">Simple</span
                    >
                    <Switch
                        checked={controller.accountingMode === "professional"}
                        onCheckedChange={(checked) => {
                            if (checked) {
                                controller.showProModeSetup = true;
                            } else {
                                controller.disableProMode();
                            }
                        }}
                        class="data-[state=checked]:bg-green-500"
                    />
                    <span
                        class="text-xs font-medium text-blue-100 {controller.accountingMode ===
                        'professional'
                            ? 'opacity-100'
                            : 'opacity-50'}">Pro</span
                    >
                </div>
                <Button
                    variant="outline"
                    size="lg"
                    onclick={() => controller.exportToExcel()}
                    class="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-md transition-all"
                >
                    <Download class="mr-2 h-4 w-4" />
                    Export Excel
                </Button>
            </div>
        </div>

        <!-- Quick Stats Overlay -->
        <div class="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div
                class="rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/10"
            >
                <p
                    class="text-xs font-medium text-blue-200 uppercase tracking-wider"
                >
                    Total Omzet
                </p>
                <p class="text-2xl font-bold mt-1 text-white">
                    {controller.formatCurrency(
                        controller.salesSummary.totalRevenue,
                    )}
                </p>
            </div>
            <div
                class="rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/10"
            >
                <p
                    class="text-xs font-medium text-blue-200 uppercase tracking-wider"
                >
                    Profit Bersih
                </p>
                <div class="flex items-center gap-2 mt-1">
                    <p class="text-2xl font-bold text-white">
                        {controller.formatCurrency(
                            controller.salesSummary.totalProfit,
                        )}
                    </p>
                    {#if controller.salesSummary.totalProfit > 0}
                        <ArrowUpRight class="h-4 w-4 text-green-300" />
                    {/if}
                </div>
            </div>
            <div
                class="rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/10"
            >
                <p
                    class="text-xs font-medium text-blue-200 uppercase tracking-wider"
                >
                    Total Service
                </p>
                <p class="text-2xl font-bold mt-1 text-white">
                    {controller.servicesStats.total}
                </p>
            </div>
            <div
                class="rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/10"
            >
                <p
                    class="text-xs font-medium text-blue-200 uppercase tracking-wider"
                >
                    Margin
                </p>
                <p class="text-2xl font-bold mt-1 text-white">
                    {controller.salesSummary.profitMargin.toFixed(1)}%
                </p>
            </div>
        </div>
    </div>

    <!-- Filter Section -->
    <div class="flex flex-col md:flex-row gap-6 mt-6">
        <Card
            class="flex-1 border-0 shadow-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl overflow-visible relative z-50"
        >
            <CardContent class="p-6">
                <div class="flex flex-col sm:flex-row gap-4 items-end">
                    <div class="grid gap-2 flex-1 w-full">
                        <Label
                            class="text-xs font-bold uppercase text-muted-foreground tracking-wider"
                            >Mulai Tanggal</Label
                        >
                        <DateTimePicker
                            showTime={false}
                            bind:value={controller.startDate}
                        />
                    </div>
                    <div class="grid gap-2 flex-1 w-full">
                        <Label
                            class="text-xs font-bold uppercase text-muted-foreground tracking-wider"
                            >Sampai Tanggal</Label
                        >
                        <DateTimePicker
                            showTime={false}
                            bind:value={controller.endDate}
                        />
                    </div>
                    <Button
                        disabled={controller.isLoading}
                        size="lg"
                        class="w-full sm:w-auto h-11 shadow-md hover:shadow-lg transition-all"
                    >
                        <Filter class="mr-2 h-4 w-4" />
                        {controller.isLoading
                            ? "Mengambil Data..."
                            : "Terapkan Filter"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>

    <!-- Main Content Tabs -->
    <Tabs bind:value={controller.activeTab} class="space-y-8">
        <div class="overflow-x-auto pb-2 scrollbar-hide">
            <TabsList
                class="inline-flex h-12 items-center justify-start rounded-xl bg-muted/50 p-1 w-full md:w-auto"
            >
                <TabsTrigger
                    value="digest"
                    class="rounded-lg px-4 h-10 transition-all hover:text-blue-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                    <BarChart3 class="h-4 w-4 mr-2" /> Digest
                </TabsTrigger>
                <TabsTrigger
                    value="sales"
                    class="rounded-lg px-4 h-10 transition-all hover:text-blue-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                    <TrendingUp class="h-4 w-4 mr-2" /> Penjualan
                </TabsTrigger>
                {#if authStore.hasRole(["super_admin", "owner"])}
                    <TabsTrigger
                        value="profit-loss"
                        class="rounded-lg px-4 h-10 transition-all hover:text-blue-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                    >
                        <Wallet class="h-4 w-4 mr-2" /> Laba Rugi
                    </TabsTrigger>
                {/if}
                <TabsTrigger
                    value="services"
                    class="rounded-lg px-4 h-10 transition-all hover:text-blue-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                    <Wrench class="h-4 w-4 mr-2" /> Service
                </TabsTrigger>
                <TabsTrigger
                    value="purchases"
                    class="rounded-lg px-4 h-10 transition-all hover:text-blue-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                    <ShoppingCart class="h-4 w-4 mr-2" /> Pembelian
                </TabsTrigger>
                <TabsTrigger
                    value="technicians"
                    class="rounded-lg px-4 h-10 transition-all hover:text-blue-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                    <Users class="h-4 w-4 mr-2" /> Teknisi
                </TabsTrigger>
                <TabsTrigger
                    value="parts"
                    class="rounded-lg px-4 h-10 transition-all hover:text-blue-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                    <ClipboardList class="h-4 w-4 mr-2" /> Sparepart
                </TabsTrigger>
                <TabsTrigger
                    value="stock"
                    class="rounded-lg px-4 h-10 transition-all hover:text-blue-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                    <Package class="h-4 w-4 mr-2" /> Stok
                </TabsTrigger>
                {#if controller.accountingMode === "professional" && authStore.hasRole( ["super_admin", "owner"], )}
                    <TabsTrigger
                        value="accounting"
                        class="rounded-lg px-4 h-10 transition-all hover:text-purple-600 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm border border-purple-200 bg-purple-50/50"
                    >
                        <Calculator class="h-4 w-4 mr-2" /> Akuntansi
                    </TabsTrigger>
                {/if}
            </TabsList>
        </div>

        <TabsContent value="digest">
            <ManagerDigest
                salesSummary={controller.salesSummary}
                servicesStats={controller.servicesStats}
                technicians={controller.technicians}
            />
        </TabsContent>

        <TabsContent
            value="sales"
            class="space-y-6 animate-in fade-in-50 slide-in-from-bottom-5 duration-500"
        >
            <SalesTab
                salesSummary={controller.salesSummary}
                salesTransactions={controller.salesTransactions}
                salesTrendData={controller.salesTrendData}
            />
        </TabsContent>

        <TabsContent
            value="profit-loss"
            class="space-y-6 animate-in fade-in-50 slide-in-from-bottom-5 duration-500"
        >
            <ProfitLossTab
                profitLoss={controller.profitLoss}
                salesSummary={controller.salesSummary}
            />
        </TabsContent>

        <TabsContent
            value="services"
            class="space-y-6 animate-in fade-in-50 slide-in-from-bottom-5 duration-500"
        >
            <ServicesTab
                servicesStats={controller.servicesStats}
                servicesTransactions={controller.servicesTransactions}
                serviceStatusData={controller.serviceStatusData}
            />
        </TabsContent>

        <TabsContent
            value="technicians"
            class="space-y-6 animate-in fade-in-50 slide-in-from-bottom-5 duration-500"
        >
            <TechniciansTab technicians={controller.technicians} />
        </TabsContent>

        <TabsContent
            value="purchases"
            class="space-y-6 animate-in fade-in-50 slide-in-from-bottom-5 duration-500"
        >
            <PurchasesTab
                purchasesSummary={controller.purchasesSummary}
                purchasesTransactions={controller.purchasesTransactions}
            />
        </TabsContent>

        <TabsContent
            value="parts"
            class="space-y-6 animate-in fade-in-50 slide-in-from-bottom-5 duration-500"
        >
            <PartsTab partsUsage={controller.partsUsage} />
        </TabsContent>

        <TabsContent
            value="stock"
            class="space-y-6 animate-in fade-in-50 slide-in-from-bottom-5 duration-500"
        >
            <StockTab stockValue={controller.stockValue} />
        </TabsContent>

        {#if controller.accountingMode === "professional"}
            <TabsContent
                value="accounting"
                class="space-y-6 animate-in fade-in-50 slide-in-from-bottom-5 duration-500"
            >
                <AccountingTab
                    profitLoss={controller.profitLoss}
                    accountTree={controller.accountTreeQuery.data || []}
                    mappingSettings={controller.mappingSettingsQuery.data}
                />
            </TabsContent>
        {/if}
    </Tabs>
</div>
