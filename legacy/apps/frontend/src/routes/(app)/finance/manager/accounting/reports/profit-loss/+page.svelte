<script lang="ts">
    import { onMount } from "svelte";
    import { AccountingReportService } from "$lib/features/finance/accounting/services/accounting-reports.service";
    import { Button } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { Loader2, ArrowLeft, Printer } from "lucide-svelte";

    let loading = $state(false);
    let reportData = $state<any>(null);

    let startDate = $state(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            .toISOString()
            .split("T")[0],
    );
    let endDate = $state(new Date().toISOString().split("T")[0]);

    async function loadReport() {
        try {
            loading = true;
            reportData = await AccountingReportService.getIncomeStatement({
                startDate: new Date(startDate),
                endDate: new Date(endDate),
            });
        } catch (e) {
            console.error(e);
            alert("Gagal memuat laporan");
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        loadReport();
    });

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(val);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };
</script>

<div class="space-y-6 animate-in fade-in duration-500 pb-10">
    <div class="flex items-center gap-4 no-print">
        <Button variant="ghost" size="icon" href="/accounting/reports">
            <ArrowLeft class="h-4 w-4" />
        </Button>
        <div>
            <h1 class="text-2xl font-bold text-slate-900">Laporan Laba Rugi</h1>
            <p class="text-slate-500">Pendapatan vs Beban.</p>
        </div>
        <div class="ml-auto">
            <Button
                variant="outline"
                size="icon"
                onclick={() => window.print()}
            >
                <Printer class="h-4 w-4" />
            </Button>
        </div>
    </div>

    <!-- Filters -->
    <Card class="no-print">
        <CardContent class="p-4 flex flex-wrap gap-4 items-end">
            <div class="space-y-2">
                <label for="start-date" class="text-sm font-medium"
                    >Dari Tanggal</label
                >
                <Input id="start-date" type="date" bind:value={startDate} />
            </div>

            <div class="space-y-2">
                <label for="end-date" class="text-sm font-medium"
                    >Sampai Tanggal</label
                >
                <Input id="end-date" type="date" bind:value={endDate} />
            </div>

            <Button onclick={loadReport} disabled={loading}>
                {#if loading}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                {/if}
                Tampilkan
            </Button>
        </CardContent>
    </Card>

    {#if reportData}
        <Card class="print-border-none print-shadow-none max-w-4xl mx-auto">
            <CardHeader class="text-center border-b pb-6">
                <h2 class="text-xl font-bold uppercase tracking-wide">
                    Laporan Laba Rugi
                </h2>
                <p class="text-slate-500">
                    Periode: {formatDate(startDate)} s/d {formatDate(endDate)}
                </p>
            </CardHeader>
            <CardContent class="p-8 space-y-8 font-mono text-sm">
                <!-- REVENUE -->
                <div>
                    <h3
                        class="font-bold text-lg mb-4 text-slate-800 border-b pb-2"
                    >
                        PENDAPATAN
                    </h3>
                    <div class="space-y-2">
                        {#each reportData.revenue.accounts as acc}
                            <div
                                class="flex justify-between hover:bg-slate-50 p-1 rounded"
                            >
                                <span>{acc.accountName}</span>
                                <span>{formatCurrency(acc.amount)}</span>
                            </div>
                        {/each}
                        <div
                            class="flex justify-between font-bold pt-2 border-t mt-2"
                        >
                            <span>Total Pendapatan</span>
                            <span class="text-green-700"
                                >{formatCurrency(
                                    reportData.revenue.total,
                                )}</span
                            >
                        </div>
                    </div>
                </div>

                <!-- COGS -->
                <div>
                    <h3
                        class="font-bold text-lg mb-4 text-slate-800 border-b pb-2"
                    >
                        HARGA POKOK PENJUALAN
                    </h3>
                    <div class="space-y-2">
                        {#each reportData.cogs.accounts as acc}
                            <div
                                class="flex justify-between hover:bg-slate-50 p-1 rounded"
                            >
                                <span>{acc.accountName}</span>
                                <span>{formatCurrency(acc.amount)}</span>
                            </div>
                        {/each}
                        <div
                            class="flex justify-between font-bold pt-2 border-t mt-2"
                        >
                            <span>Total HPP</span>
                            <span class="text-red-700"
                                >({formatCurrency(reportData.cogs.total)})</span
                            >
                        </div>
                    </div>
                </div>

                <!-- GROSS PROFIT -->
                <div
                    class="bg-slate-100 p-4 rounded flex justify-between items-center font-bold text-lg border border-slate-200"
                >
                    <span>LABA KOTOR</span>
                    <span>{formatCurrency(reportData.grossProfit)}</span>
                </div>

                <!-- EXPENSES -->
                <div>
                    <h3
                        class="font-bold text-lg mb-4 text-slate-800 border-b pb-2"
                    >
                        BEBAN OPERASIONAL
                    </h3>
                    <div class="space-y-2">
                        {#each reportData.expenses.accounts as acc}
                            <div
                                class="flex justify-between hover:bg-slate-50 p-1 rounded"
                            >
                                <span>{acc.accountName}</span>
                                <span>{formatCurrency(acc.amount)}</span>
                            </div>
                        {/each}
                        {#if reportData.expenses.accounts.length === 0}
                            <div class="text-slate-400 italic">
                                Tidak ada beban tercatat.
                            </div>
                        {/if}
                        <div
                            class="flex justify-between font-bold pt-2 border-t mt-2"
                        >
                            <span>Total Beban Operasional</span>
                            <span class="text-red-700"
                                >({formatCurrency(
                                    reportData.expenses.total,
                                )})</span
                            >
                        </div>
                    </div>
                </div>

                <!-- NET INCOME -->
                <div
                    class="bg-slate-900 text-white p-6 rounded-lg flex justify-between items-center font-bold text-xl shadow-lg print:bg-white print:text-black print:border-2 print:border-black"
                >
                    <span>LABA BERSIH</span>
                    <span>{formatCurrency(reportData.netIncome)}</span>
                </div>
            </CardContent>
        </Card>
    {/if}
</div>

<style>
    @media print {
        :global(.no-print) {
            display: none !important;
        }
        :global(.print-border-none) {
            border: none !important;
        }
        :global(.print-shadow-none) {
            box-shadow: none !important;
        }
    }
</style>
