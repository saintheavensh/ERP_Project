<script lang="ts">
    import {
        Card,
        CardHeader,
        CardTitle,
        CardDescription,
        CardContent,
    } from "$lib/shared/components/ui/card";
    import { Button } from "$lib/shared/components/ui/button";
    import {
        Calculator,
        Clock,
        CheckCircle2,
        AlertCircle,
        ArrowRight,
    } from "lucide-svelte";
    import { type AccountingController } from "../accounting.controller.svelte";

    interface Props {
        controller: AccountingController;
    }

    let { controller }: Props = $props();
</script>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <Card
        class="lg:col-span-2 border-0 shadow-xl rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border-none"
    >
        <CardHeader class="pb-2">
            <div class="flex items-center justify-between">
                <div>
                    <CardTitle class="text-xl font-bold"
                        >Ringkasan Untung/Rugi Bisnis</CardTitle
                    >
                    <CardDescription
                        >Analisa pemasukan dan pengeluaran Anda.</CardDescription
                    >
                </div>
                <div
                    class="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full"
                >
                    <Calculator class="h-4 w-4 text-blue-600" />
                    <span class="text-xs font-bold text-blue-600"
                        >Data Real-time</span
                    >
                </div>
            </div>
        </CardHeader>
        <CardContent class="p-6 pt-2">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <!-- Progress Stats -->
                <div class="space-y-6">
                    <div class="space-y-2">
                        <div class="flex justify-between text-sm">
                            <span class="text-slate-500"
                                >Pemasukan (Revenue)</span
                            >
                            <span
                                class="font-bold text-slate-900 dark:text-white"
                            >
                                {controller.formatCurrency(
                                    controller.dashboard?.balanceSummary
                                        ?.REVENUE?.total || 0,
                                )}
                            </span>
                        </div>
                        <div
                            class="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"
                        >
                            <div
                                class="h-full bg-green-500 rounded-full"
                                style="width: 100%"
                            ></div>
                        </div>
                    </div>

                    <div class="space-y-2">
                        <div class="flex justify-between text-sm">
                            <span class="text-slate-500"
                                >Pengeluaran (Expenses)</span
                            >
                            <span
                                class="font-bold text-slate-900 dark:text-white"
                            >
                                {controller.formatCurrency(
                                    controller.dashboard?.balanceSummary
                                        ?.EXPENSE?.total || 0,
                                )}
                            </span>
                        </div>
                        <div
                            class="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"
                        >
                            <div
                                class="h-full bg-red-500 rounded-full"
                                style="width: {Math.min(
                                    controller.expenseRatio,
                                    100,
                                )}%"
                            ></div>
                        </div>
                        <p class="text-[10px] text-red-500 font-medium italic">
                            Pengeluaran memakan {controller.expenseRatio.toFixed(
                                1,
                            )}% dari total pemasukan.
                        </p>
                    </div>
                </div>

                <!-- Highlights -->
                <div
                    class="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 space-y-4"
                >
                    <h4
                        class="text-xs font-bold text-slate-400 uppercase tracking-widest"
                    >
                        Highlights
                    </h4>

                    {#if controller.deprExpense}
                        <div
                            class="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800"
                        >
                            <div class="flex items-center gap-3">
                                <div
                                    class="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg"
                                >
                                    <Clock class="h-4 w-4 text-orange-600" />
                                </div>
                                <div>
                                    <p
                                        class="text-[11px] font-bold text-slate-900 dark:text-white line-clamp-1"
                                    >
                                        {controller.deprExpense.name}
                                    </p>
                                    <p class="text-[10px] text-slate-500">
                                        Penyusutan Aset
                                    </p>
                                </div>
                            </div>
                            <span class="text-xs font-black text-orange-600">
                                -{controller.formatCurrency(
                                    controller.deprExpense.balance,
                                )}
                            </span>
                        </div>
                    {/if}

                    <div
                        class="flex items-center justify-between p-3 bg-green-50/50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30"
                    >
                        <div class="flex items-center gap-3">
                            <div
                                class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg"
                            >
                                <CheckCircle2 class="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                                <p
                                    class="text-[11px] font-bold text-green-700 dark:text-green-400"
                                >
                                    Margin Keuntungan
                                </p>
                                <p
                                    class="text-[10px] text-green-600 opacity-70"
                                >
                                    Efisiensi Bisnis
                                </p>
                            </div>
                        </div>
                        <span
                            class="text-xs font-black text-green-700 dark:text-green-400"
                        >
                            {(100 - controller.expenseRatio).toFixed(1)}%
                        </span>
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>

    <!-- Dynamic Tip Card -->
    <Card
        class="border-0 shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-3xl overflow-hidden relative group"
    >
        <div
            class="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"
        ></div>
        <CardContent
            class="p-6 flex flex-col h-full justify-between relative z-10"
        >
            <div class="space-y-4">
                <div class="p-3 bg-white/20 rounded-2xl w-fit">
                    <AlertCircle class="h-6 w-6 text-white" />
                </div>
                <h3 class="text-xl font-bold leading-tight">Tips Keuangan</h3>
                <p class="text-sm text-indigo-100 leading-relaxed">
                    Penyusutan aset adalah biaya 'tersembunyi'. Pastikan alat
                    kerja Anda tercatat agar laba bersih akurat.
                </p>
            </div>

            <Button
                variant="outline"
                href="/accounting/assets"
                class="mt-6 bg-white/10 border-white/20 hover:bg-white/20 text-white rounded-xl border-none"
            >
                Cek Aset & Penyusutan
                <ArrowRight class="ml-2 h-4 w-4" />
            </Button>
        </CardContent>
    </Card>
</div>
