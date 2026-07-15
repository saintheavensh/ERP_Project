<script lang="ts">
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { Separator } from "$lib/shared/components/ui/separator";
    import ProfitCostChart from "./ProfitCostChart.svelte";
    import type { ProfitAndLoss } from "$lib/features/finance/reports/reports.service";
    import {
        TrendingUp,
        TrendingDown,
        DollarSign,
        ShoppingBag,
        Wrench,
        Minus,
    } from "lucide-svelte";

    let {
        profitLoss,
        salesSummary,
    }: {
        profitLoss: ProfitAndLoss | null;
        salesSummary: {
            totalRevenue: number;
            totalHPP: number;
            totalProfit: number;
            profitMargin: number;
        };
    } = $props();

    function fmt(val: number): string {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(val);
    }
</script>

{#if profitLoss}
    <div class="space-y-6">
        <!-- Revenue Breakdown -->
        <div class="grid gap-4 md:grid-cols-3">
            <Card
                class="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30"
            >
                <CardContent class="p-5">
                    <div class="flex items-center gap-3 mb-2">
                        <div
                            class="rounded-lg bg-green-100 p-2 dark:bg-green-900/50"
                        >
                            <ShoppingBag
                                class="h-4 w-4 text-green-600 dark:text-green-400"
                            />
                        </div>
                        <span
                            class="text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-400"
                            >Penjualan Produk</span
                        >
                    </div>
                    <p class="text-2xl font-bold text-green-700 dark:text-green-300">
                        {fmt(profitLoss.revenue.sales)}
                    </p>
                </CardContent>
            </Card>

            <Card
                class="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30"
            >
                <CardContent class="p-5">
                    <div class="flex items-center gap-3 mb-2">
                        <div
                            class="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/50"
                        >
                            <Wrench
                                class="h-4 w-4 text-blue-600 dark:text-blue-400"
                            />
                        </div>
                        <span
                            class="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400"
                            >Pendapatan Service</span
                        >
                    </div>
                    <p class="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        {fmt(profitLoss.revenue.services)}
                    </p>
                </CardContent>
            </Card>

            <Card
                class="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30"
            >
                <CardContent class="p-5">
                    <div class="flex items-center gap-3 mb-2">
                        <div
                            class="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/50"
                        >
                            <DollarSign
                                class="h-4 w-4 text-purple-600 dark:text-purple-400"
                            />
                        </div>
                        <span
                            class="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400"
                            >Total Pendapatan</span
                        >
                    </div>
                    <p
                        class="text-2xl font-bold text-purple-700 dark:text-purple-300"
                    >
                        {fmt(profitLoss.revenue.total)}
                    </p>
                </CardContent>
            </Card>
        </div>

        <!-- Chart -->
        <Card class="border-0 shadow-lg">
            <CardHeader>
                <CardTitle class="text-base">Komposisi Pendapatan vs Biaya</CardTitle>
            </CardHeader>
            <CardContent>
                <ProfitCostChart
                    data={{
                        revenue: profitLoss.revenue.total,
                        cogs: profitLoss.cogs.total,
                        expenses: profitLoss.expenses.total,
                    }}
                />
            </CardContent>
        </Card>

        <!-- P&L Summary Table -->
        <Card class="border-0 shadow-lg">
            <CardHeader>
                <CardTitle class="text-base">Ringkasan Laba Rugi</CardTitle>
            </CardHeader>
            <CardContent class="space-y-1">
                <!-- Revenue -->
                <div
                    class="flex items-center justify-between rounded-lg p-3 bg-green-50 dark:bg-green-950/20"
                >
                    <div class="flex items-center gap-2">
                        <TrendingUp class="h-4 w-4 text-green-600" />
                        <span class="font-medium">Total Pendapatan</span>
                    </div>
                    <span class="font-bold text-green-600">
                        {fmt(profitLoss.revenue.total)}
                    </span>
                </div>

                <!-- COGS -->
                <div
                    class="flex items-center justify-between rounded-lg p-3 bg-orange-50 dark:bg-orange-950/20"
                >
                    <div class="flex items-center gap-2">
                        <Minus class="h-4 w-4 text-orange-600" />
                        <span class="font-medium">HPP (Harga Pokok)</span>
                    </div>
                    <span class="font-bold text-orange-600">
                        {fmt(profitLoss.cogs.total)}
                    </span>
                </div>

                <Separator class="my-2" />

                <!-- Gross Profit -->
                <div
                    class="flex items-center justify-between rounded-lg p-3 bg-blue-50 dark:bg-blue-950/20"
                >
                    <span class="font-semibold">Laba Kotor</span>
                    <span class="font-bold text-blue-600">
                        {fmt(profitLoss.grossProfit)}
                    </span>
                </div>

                <!-- Operating Expenses -->
                <div
                    class="flex items-center justify-between rounded-lg p-3 bg-red-50 dark:bg-red-950/20"
                >
                    <div class="flex items-center gap-2">
                        <TrendingDown class="h-4 w-4 text-red-600" />
                        <span class="font-medium">Biaya Operasional</span>
                    </div>
                    <span class="font-bold text-red-600">
                        {fmt(profitLoss.expenses.total)}
                    </span>
                </div>

                <!-- Expense breakdown details -->
                {#if profitLoss.expenses.details && Object.keys(profitLoss.expenses.details).length > 0}
                    {#each Object.entries(profitLoss.expenses.details) as [label, amount]}
                        <div
                            class="flex items-center justify-between rounded-lg p-2 pl-10 text-sm"
                        >
                            <span class="text-muted-foreground capitalize"
                                >{label.replace(/_/g, " ")}</span
                            >
                            <span class="text-red-500">{fmt(amount)}</span>
                        </div>
                    {/each}
                {/if}

                <Separator class="my-2" />

                <!-- Net Profit -->
                <div
                    class="flex items-center justify-between rounded-xl p-4 {profitLoss.netProfit >= 0
                        ? 'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30'
                        : 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30'}"
                >
                    <span class="text-lg font-bold">Laba Bersih</span>
                    <span
                        class="text-xl font-bold {profitLoss.netProfit >= 0
                            ? 'text-emerald-600'
                            : 'text-red-600'}"
                    >
                        {fmt(profitLoss.netProfit)}
                    </span>
                </div>

                <!-- Margin -->
                <div class="flex items-center justify-between px-4 py-2">
                    <span class="text-sm text-muted-foreground">Margin Keuntungan</span>
                    <span class="font-semibold">
                        {salesSummary.profitMargin.toFixed(1)}%
                    </span>
                </div>
            </CardContent>
        </Card>
    </div>
{:else}
    <Card class="border-0 shadow-lg">
        <CardContent class="flex flex-col items-center justify-center py-16 text-center">
            <div class="text-5xl mb-4">📊</div>
            <h4 class="text-lg font-semibold mb-2 text-muted-foreground">
                Data Belum Tersedia
            </h4>
            <p class="text-sm text-muted-foreground">
                Pilih rentang tanggal dan klik "Terapkan Filter" untuk melihat laporan
                laba rugi.
            </p>
        </CardContent>
    </Card>
{/if}
