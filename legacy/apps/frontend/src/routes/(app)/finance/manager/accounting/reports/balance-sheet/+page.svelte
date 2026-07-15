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
    import {
        Loader2,
        ArrowLeft,
        Printer,
        AlertTriangle,
        CheckCircle,
    } from "lucide-svelte";

    let loading = $state(false);
    let reportData = $state<any>(null);

    let asOfDate = $state(new Date().toISOString().split("T")[0]);

    async function loadReport() {
        try {
            loading = true;
            reportData = await AccountingReportService.getBalanceSheet(
                new Date(asOfDate),
            );
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
            <h1 class="text-2xl font-bold text-slate-900">
                Neraca (Balance Sheet)
            </h1>
            <p class="text-slate-500">Posisi Keuangan Perusahaan.</p>
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
                <label for="date-filter" class="text-sm font-medium"
                    >Per Tanggal</label
                >
                <Input id="date-filter" type="date" bind:value={asOfDate} />
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
                    NERACA
                </h2>
                <p class="text-slate-500">
                    Per Tanggal: {formatDate(asOfDate)}
                </p>
            </CardHeader>
            <CardContent
                class="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 font-mono text-sm print:grid-cols-2"
            >
                <!-- LEFT COLUMN: ASSETS -->
                <div class="space-y-8">
                    <h3 class="font-bold text-lg border-b pb-2 text-blue-800">
                        AKTIVA (ASSETS)
                    </h3>

                    {#each Object.entries(reportData.assets.groups) as [prefix, group]}
                        {@const g = group as { total: number; accounts: any[] }}
                        <div>
                            <h4 class="font-bold text-slate-600 mb-2">
                                {prefix.startsWith("1-1")
                                    ? "Aset Lancar"
                                    : "Aset Tetap"} ({prefix})
                            </h4>
                            <div
                                class="space-y-1 pl-2 border-l-2 border-slate-100"
                            >
                                {#each g.accounts as acc}
                                    <div
                                        class="flex justify-between hover:bg-slate-50 p-1 rounded"
                                    >
                                        <span>{acc.accountName}</span>
                                        <span>{formatCurrency(acc.amount)}</span
                                        >
                                    </div>
                                {/each}
                                <div
                                    class="flex justify-between font-bold pt-1 border-t text-slate-700"
                                >
                                    <span>Total</span>
                                    <span>{formatCurrency(g.total)}</span>
                                </div>
                            </div>
                        </div>
                    {/each}

                    <div
                        class="bg-blue-50 p-4 rounded border border-blue-100 flex justify-between font-bold text-lg mt-8"
                    >
                        <span>TOTAL AKTIVA</span>
                        <span class="text-blue-700"
                            >{formatCurrency(reportData.assets.total)}</span
                        >
                    </div>
                </div>

                <!-- RIGHT COLUMN: LIABILITIES & EQUITY -->
                <div class="space-y-8">
                    <!-- LIABILITIES -->
                    <div>
                        <h3
                            class="font-bold text-lg border-b pb-2 text-red-800"
                        >
                            KEWAJIBAN (LIABILITIES)
                        </h3>
                        <div
                            class="space-y-1 pl-2 border-l-2 border-slate-100 mt-4"
                        >
                            {#each reportData.liabilities.accounts as acc}
                                <div
                                    class="flex justify-between hover:bg-slate-50 p-1 rounded"
                                >
                                    <span>{acc.accountName}</span>
                                    <span>{formatCurrency(acc.amount)}</span>
                                </div>
                            {/each}
                            {#if reportData.liabilities.accounts.length === 0}
                                <div class="text-slate-400 italic">
                                    Tidak ada kewajiban.
                                </div>
                            {/if}
                            <div
                                class="flex justify-between font-bold pt-1 border-t text-slate-700 mt-2"
                            >
                                <span>Total Kewajiban</span>
                                <span
                                    >{formatCurrency(
                                        reportData.liabilities.total,
                                    )}</span
                                >
                            </div>
                        </div>
                    </div>

                    <!-- EQUITY -->
                    <div>
                        <h3
                            class="font-bold text-lg border-b pb-2 text-purple-800"
                        >
                            MODAL (EQUITY)
                        </h3>
                        <div
                            class="space-y-1 pl-2 border-l-2 border-slate-100 mt-4"
                        >
                            {#each reportData.equity.accounts as acc}
                                <div
                                    class="flex justify-between hover:bg-slate-50 p-1 rounded"
                                >
                                    <span>{acc.accountName}</span>
                                    <span>{formatCurrency(acc.amount)}</span>
                                </div>
                            {/each}
                            <div
                                class="flex justify-between font-bold pt-1 border-t text-slate-700 mt-2"
                            >
                                <span>Total Modal</span>
                                <span
                                    >{formatCurrency(
                                        reportData.equity.total,
                                    )}</span
                                >
                            </div>
                        </div>
                    </div>

                    <div
                        class="bg-slate-50 p-4 rounded border border-slate-200 flex justify-between font-bold text-lg mt-8"
                    >
                        <span>TOTAL PASIVA</span>
                        <span class="text-slate-800"
                            >{formatCurrency(
                                reportData.liabilities.total +
                                    reportData.equity.total,
                            )}</span
                        >
                    </div>

                    <!-- CHECK -->
                    {#if reportData.check === 0}
                        <div
                            class="flex items-center justify-center gap-2 text-green-600 bg-green-50 p-2 rounded text-xs font-bold border border-green-200"
                        >
                            <CheckCircle class="h-4 w-4" />
                            BALANCE
                        </div>
                    {:else}
                        <div
                            class="flex items-center justify-center gap-2 text-red-600 bg-red-50 p-2 rounded text-xs font-bold border border-red-200"
                        >
                            <AlertTriangle class="h-4 w-4" />
                            NOT BALANCE ({formatCurrency(reportData.check)})
                        </div>
                    {/if}
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
