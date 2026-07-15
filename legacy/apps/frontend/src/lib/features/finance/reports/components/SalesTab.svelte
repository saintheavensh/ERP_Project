<script lang="ts">
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
        CardDescription,
    } from "$lib/shared/components/ui/card";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/shared/components/ui/table";
    import { Badge } from "$lib/shared/components/ui/badge";
    import { BarChart3 } from "lucide-svelte";
    import SalesTrendChart from "./SalesTrendChart.svelte";
    import type {
        SalesSummary,
        TransactionReport,
    } from "$lib/features/finance/reports/reports.service";

    // Props
    interface Props {
        salesSummary: SalesSummary;
        salesTransactions: TransactionReport[];
        salesTrendData: { date: string; value: number }[];
    }

    let { salesSummary, salesTransactions, salesTrendData }: Props = $props();

    // Helpers (if not in utils, or we can import them)
    // Assuming formatCurrency and formatDate are simple enough to be here or imported.
    // Let's import them if they strictly exist in utils, otherwise local for now to be safe.
    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }

    function formatCurrency(amount: number) {
        return `Rp ${amount.toLocaleString("id-ID")}`;
    }
</script>

<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
    <!-- Trend Chart -->
    <Card class="lg:col-span-4 border-0 shadow-lg bg-white/50 backdrop-blur-xl">
        <CardHeader>
            <CardTitle class="flex items-center gap-2">
                <BarChart3 class="h-5 w-5 text-blue-600" />
                Tren Penjualan
            </CardTitle>
            <CardDescription
                >Grafik pendapatan harian dalam periode terpilih</CardDescription
            >
        </CardHeader>
        <CardContent class="pl-0">
            <SalesTrendChart data={salesTrendData} />
        </CardContent>
    </Card>

    <!-- Summary Cards -->
    <div class="lg:col-span-3 space-y-6">
        <Card class="border-l-4 border-l-blue-500 shadow-md">
            <CardHeader class="pb-2">
                <CardTitle
                    class="text-sm font-medium text-muted-foreground uppercase tracking-wider"
                    >Total Penjualan</CardTitle
                >
            </CardHeader>
            <CardContent>
                <div class="text-3xl font-bold">
                    {formatCurrency(salesSummary.totalRevenue)}
                </div>
                <p class="text-sm text-muted-foreground mt-1">
                    {salesSummary.totalTransactions} transaksi berhasil
                </p>
            </CardContent>
        </Card>
        <Card class="border-l-4 border-l-orange-500 shadow-md">
            <CardHeader class="pb-2">
                <CardTitle
                    class="text-sm font-medium text-muted-foreground uppercase tracking-wider"
                    >Total Modal (HPP)</CardTitle
                >
            </CardHeader>
            <CardContent>
                <div class="text-3xl font-bold">
                    {formatCurrency(salesSummary.totalHPP)}
                </div>
                <p class="text-sm text-muted-foreground mt-1">
                    Cost of Goods Sold
                </p>
            </CardContent>
        </Card>
        <Card
            class="border-l-4 border-l-green-500 shadow-md bg-green-50/30 dark:bg-green-900/10"
        >
            <CardHeader class="pb-2">
                <CardTitle
                    class="text-sm font-medium text-green-600 dark:text-green-400 uppercase tracking-wider"
                    >Keuntungan Bersih</CardTitle
                >
            </CardHeader>
            <CardContent>
                <div
                    class="text-3xl font-bold text-green-600 dark:text-green-400"
                >
                    {formatCurrency(salesSummary.totalProfit)}
                </div>
                <p
                    class="text-sm font-medium text-green-600/80 dark:text-green-400/80 mt-1"
                >
                    Margin: {salesSummary.profitMargin.toFixed(1)}%
                </p>
            </CardContent>
        </Card>
    </div>
</div>

<!-- Transactions Table -->
<Card class="border-0 shadow-lg overflow-hidden">
    <CardHeader class="bg-muted/30">
        <CardTitle>Rincian Transaksi</CardTitle>
        <CardDescription>Detail per nota penjualan</CardDescription>
    </CardHeader>
    <CardContent class="p-0">
        <Table>
            <TableHeader>
                <TableRow class="hover:bg-transparent">
                    <TableHead class="pl-6">Tanggal</TableHead>
                    <TableHead>No. Nota</TableHead>
                    <TableHead class="text-center">Items</TableHead>
                    <TableHead class="text-right">Total</TableHead>
                    <TableHead class="text-right">HPP</TableHead>
                    <TableHead class="text-right pr-6 font-bold text-green-600"
                        >Profit</TableHead
                    >
                </TableRow>
            </TableHeader>
            <TableBody>
                {#each salesTransactions as t}
                    <TableRow class="hover:bg-muted/50">
                        <TableCell
                            class="pl-6 font-medium text-muted-foreground"
                            >{formatDate(t.date)}</TableCell
                        >
                        <TableCell class="font-semibold text-primary"
                            >{t.nota}</TableCell
                        >
                        <TableCell class="text-center"
                            ><Badge variant="outline" class="font-normal"
                                >{t.items}</Badge
                            ></TableCell
                        >
                        <TableCell class="text-right font-medium"
                            >{formatCurrency(t.total)}</TableCell
                        >
                        <TableCell class="text-right text-muted-foreground"
                            >{formatCurrency(t.hpp)}</TableCell
                        >
                        <TableCell
                            class="text-right pr-6 font-bold text-green-600"
                            >+{formatCurrency(t.profit)}</TableCell
                        >
                    </TableRow>
                {/each}
                {#if salesTransactions.length === 0}
                    <TableRow>
                        <TableCell
                            colspan={6}
                            class="text-center py-12 text-muted-foreground"
                            >Tidak ada transaksi ditemukan</TableCell
                        >
                    </TableRow>
                {/if}
            </TableBody>
        </Table>
    </CardContent>
</Card>

