<script lang="ts">
    import { Card, CardContent } from "$lib/shared/components/ui/card";
    import { Wallet, TrendingUp, Calculator } from "lucide-svelte";
    import { type AccountingController } from "../accounting.controller.svelte";

    interface Props {
        controller: AccountingController;
    }

    let { controller }: Props = $props();
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    <!-- Cash Register Status -->
    <Card class="border-0 shadow-lg rounded-3xl overflow-hidden">
        <CardContent class="p-6">
            <div class="flex items-start justify-between mb-4">
                <div class="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <Wallet
                        class="h-6 w-6 text-green-600 dark:text-green-400"
                    />
                </div>
                {#if controller.dashboard?.registerStatus?.isOpen}
                    <span
                        class="text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded-full"
                        >BUKA</span
                    >
                {:else}
                    <span
                        class="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full"
                        >TUTUP</span
                    >
                {/if}
            </div>
            <p class="text-slate-500 text-sm">Kas Register</p>
            {#if controller.dashboard?.registerStatus?.isOpen}
                <p
                    class="text-2xl font-bold text-slate-900 dark:text-white mt-1"
                >
                    {controller.formatCurrency(
                        controller.dashboard.registerStatus.expectedClosing ||
                            0,
                    )}
                </p>
                <p class="text-xs text-slate-400 mt-1">
                    {controller.dashboard.registerStatus.transactionCount || 0} transaksi
                </p>
            {:else}
                <p class="text-lg font-medium text-slate-500 mt-1">
                    Belum dibuka
                </p>
            {/if}
        </CardContent>
    </Card>

    <!-- Total Assets -->
    <Card class="border-0 shadow-lg rounded-3xl overflow-hidden">
        <CardContent class="p-6">
            <div
                class="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl w-fit mb-4"
            >
                <TrendingUp class="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <p class="text-slate-500 text-sm">Harta Perusahaan (Assets)</p>
            <p class="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {controller.formatCurrency(
                    controller.dashboard?.balanceSummary?.ASSET?.total || 0,
                )}
            </p>
            <p class="text-xs text-slate-400 mt-1">
                Uang tunai, stok barang, & peralatan.
            </p>
        </CardContent>
    </Card>

    <!-- Total Liabilities -->
    <Card class="border-0 shadow-lg rounded-3xl overflow-hidden">
        <CardContent class="p-6">
            <div
                class="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-xl w-fit mb-4"
            >
                <Calculator class="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <p class="text-slate-500 text-sm">Total Hutang (Liabilities)</p>
            <p class="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {controller.formatCurrency(
                    controller.dashboard?.balanceSummary?.LIABILITY?.total || 0,
                )}
            </p>
            <p class="text-xs text-slate-400 mt-1">
                Kewajiban pembayaran ke pihak lain.
            </p>
        </CardContent>
    </Card>

    <!-- Monthly Revenue -->
    <Card
        class="border-0 shadow-lg rounded-3xl overflow-hidden text-white bg-slate-900"
    >
        <CardContent class="p-6">
            <div class="flex items-center justify-between mb-4">
                <div class="p-2.5 bg-white/10 rounded-xl">
                    <TrendingUp class="h-6 w-6 text-green-400" />
                </div>
                <span
                    class="text-[10px] font-bold uppercase tracking-widest text-slate-400"
                    >Bulan Ini</span
                >
            </div>
            <p class="text-slate-400 text-sm">Keuntungan Bersih</p>
            <div class="flex items-baseline gap-2">
                <p
                    class="text-2xl font-black italic mt-1 {controller.netIncome >=
                    0
                        ? 'text-green-400'
                        : 'text-red-400'}"
                >
                    {controller.formatCurrency(controller.netIncome)}
                </p>
            </div>
            <p class="text-xs text-slate-400 mt-1">
                {controller.netIncome >= 0 ? "Profit (Untung)" : "Loss (Rugi)"} bersih
                bulan ini.
            </p>
        </CardContent>
    </Card>
</div>
