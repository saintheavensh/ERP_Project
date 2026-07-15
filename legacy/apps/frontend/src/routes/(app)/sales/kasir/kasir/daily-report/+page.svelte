<script lang="ts">
    import { api } from "$lib/shared/lib/api-client";
    import { onMount } from "svelte";
    import {
        Card,
        CardHeader,
        CardTitle,
        CardContent,
    } from "$lib/shared/components/ui/card";
    import { Button } from "$lib/shared/components/ui/button";
    import {
        Loader2,
        Calendar,
        Printer,
        DollarSign,
        ShoppingBag,
        CreditCard,
        Wallet,
    } from "lucide-svelte";
    import { formatCurrency } from "$lib/shared/lib/utils";

    let report = $state<any>(null);
    let loading = $state(true);

    async function fetchReport() {
        try {
            loading = true;
            const res = await api.get("/reports/kasir/daily");
            report = res.data.data;
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    onMount(fetchReport);

    function handlePrint() {
        window.print();
    }
</script>

<div class="space-y-6 max-w-4xl mx-auto pb-12">
    <div class="flex items-center justify-between print:hidden">
        <div>
            <h1 class="text-3xl font-bold tracking-tight">
                Daily Shift Report
            </h1>
            <p class="text-muted-foreground italic">
                Summary of transactions and cash flow for today's session.
            </p>
        </div>
        <div class="flex gap-2">
            <Button variant="outline" onclick={fetchReport}>Refresh</Button>
            <Button
                class="bg-indigo-600 hover:bg-indigo-700"
                onclick={handlePrint}
            >
                <Printer class="mr-2 h-4 w-4" />
                Print Shift
            </Button>
        </div>
    </div>

    {#if loading}
        <div class="flex items-center justify-center p-24">
            <Loader2 class="h-12 w-12 animate-spin text-primary" />
        </div>
    {:else if report}
        <div class="grid gap-6 md:grid-cols-3">
            <Card class="border-t-4 border-t-emerald-500 shadow-lg">
                <CardHeader>
                    <CardTitle
                        class="text-sm font-medium text-muted-foreground flex items-center gap-2"
                    >
                        <DollarSign class="h-4 w-4" /> Total Omzet
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div class="text-3xl font-bold text-emerald-600">
                        {formatCurrency(report.salesSummary.totalAmount)}
                    </div>
                </CardContent>
            </Card>

            <Card class="border-t-4 border-t-blue-500 shadow-lg">
                <CardHeader>
                    <CardTitle
                        class="text-sm font-medium text-muted-foreground flex items-center gap-2"
                    >
                        <ShoppingBag class="h-4 w-4" /> Total Transaksi
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div class="text-3xl font-bold">
                        {report.salesSummary.count}
                    </div>
                </CardContent>
            </Card>

            <Card class="border-t-4 border-t-amber-500 shadow-lg">
                <CardHeader>
                    <CardTitle
                        class="text-sm font-medium text-muted-foreground flex items-center gap-2"
                    >
                        <Wallet class="h-4 w-4" /> Kas di Tangan
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div class="text-3xl font-bold text-amber-600">
                        {formatCurrency(
                            report.session?.closingCash ||
                                report.session?.openingCash +
                                    report.salesSummary.totalAmount,
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>

        <div class="grid gap-6 md:grid-cols-2 mt-6">
            <Card class="rounded-3xl shadow-md border-0">
                <CardHeader class="border-b bg-slate-50/50">
                    <CardTitle>Metode Pembayaran</CardTitle>
                </CardHeader>
                <CardContent class="p-0">
                    <div class="divide-y">
                        {#each report.paymentBreakdown as p}
                            <div
                                class="p-4 flex justify-between items-center group hover:bg-slate-50 transition-colors"
                            >
                                <div class="flex items-center gap-3">
                                    <div
                                        class="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center"
                                    >
                                        {#if p.method.includes("Cash") || p.method.includes("Tunai")}
                                            <DollarSign
                                                class="h-4 w-4 text-emerald-600"
                                            />
                                        {:else if p.method.includes("Transfer")}
                                            <CreditCard
                                                class="h-4 w-4 text-blue-600"
                                            />
                                        {:else}
                                            <Wallet
                                                class="h-4 w-4 text-muted-foreground"
                                            />
                                        {/if}
                                    </div>
                                    <span class="font-medium">{p.method}</span>
                                </div>
                                <div class="text-right">
                                    <p class="font-bold">
                                        {formatCurrency(p.amount)}
                                    </p>
                                    <p class="text-xs text-muted-foreground">
                                        {p.count} Transaksi
                                    </p>
                                </div>
                            </div>
                        {/each}
                    </div>
                </CardContent>
            </Card>

            <Card class="rounded-3xl shadow-md border-0">
                <CardHeader class="border-b bg-slate-50/50">
                    <CardTitle>Ringkasan Item</CardTitle>
                </CardHeader>
                <CardContent class="p-0">
                    <div class="p-4 space-y-4">
                        <div class="flex justify-between items-center text-sm">
                            <span class="text-muted-foreground"
                                >Item Terjual</span
                            >
                            <span class="font-bold"
                                >{report.itemsSold} unit</span
                            >
                        </div>
                        <div class="flex justify-between items-center text-sm">
                            <span class="text-muted-foreground"
                                >Total Diskon</span
                            >
                            <span class="font-bold text-red-600"
                                >{formatCurrency(report.totalDiscounts)}</span
                            >
                        </div>
                        <div class="flex justify-between items-center text-sm">
                            <span class="text-muted-foreground"
                                >Penerimaan Service</span
                            >
                            <span class="font-bold"
                                >{report.servicesCollected} job</span
                            >
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    {/if}
</div>

<style>
    @media print {
        :global(nav),
        :global(header) {
            display: none !important;
        }
    }
</style>
