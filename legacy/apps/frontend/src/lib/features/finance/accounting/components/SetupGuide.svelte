<script lang="ts">
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { Button } from "$lib/shared/components/ui/button";
    import { Progress } from "$lib/shared/components/ui/progress";
    import {
        CheckCircle2,
        Circle,
        ArrowRight,
        X,
        ListChecks,
        Wallet,
        Target,
        Settings,
    } from "lucide-svelte";
    import { slide } from "svelte/transition";

    let {
        checklist,
    }: {
        checklist: {
            hasOpeningBalance: boolean;
            hasAssets: boolean;
            hasTarget: boolean;
            isRegisterOpen: boolean;
        };
    } = $props();

    let visible = $state(true);

    let totalItems = 3; // Excluding Register for persistent setup
    let completedItems = $derived(
        [
            checklist?.hasOpeningBalance,
            checklist?.hasAssets,
            checklist?.hasTarget,
        ].filter(Boolean).length,
    );
    let progress = $derived((completedItems / totalItems) * 100);
    let isComplete = $derived(progress === 100);

    function dismiss() {
        visible = false;
    }
</script>

{#if visible && !isComplete}
    <div transition:slide class="mb-8">
        <Card
            class="border-blue-100 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/10 shadow-sm"
        >
            <CardHeader class="pb-3">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div
                            class="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg text-blue-600 dark:text-blue-400"
                        >
                            <ListChecks class="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle
                                class="text-lg font-bold text-slate-900 dark:text-white"
                            >
                                Panduan Setup Awal
                            </CardTitle>
                            <p class="text-sm text-slate-500">
                                Lengkapi data agar laporan keuangan Anda akurat.
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        class="h-8 w-8 text-slate-400 hover:text-slate-600"
                        onclick={dismiss}
                    >
                        <X class="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <!-- Progress Bar -->
                <div class="flex items-center gap-4 mb-6">
                    <Progress value={progress} class="h-2 flex-1" />
                    <span class="text-sm font-bold text-blue-600"
                        >{Math.round(progress)}% Selesai</span
                    >
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <!-- 1. Opening Balance -->
                    <div
                        class="flex flex-col p-4 bg-white dark:bg-slate-900 rounded-xl border {checklist.hasOpeningBalance
                            ? 'border-green-100 dark:border-green-900/30'
                            : 'border-slate-200 dark:border-slate-800'}"
                    >
                        <div class="flex items-center justify-between mb-3">
                            <div
                                class="p-2 rounded-lg {checklist.hasOpeningBalance
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-slate-100 text-slate-500'}"
                            >
                                <Wallet class="h-4 w-4" />
                            </div>
                            {#if checklist.hasOpeningBalance}
                                <CheckCircle2 class="h-5 w-5 text-green-500" />
                            {:else}
                                <Circle class="h-5 w-5 text-slate-300" />
                            {/if}
                        </div>
                        <h4 class="font-semibold text-sm mb-1">Saldo Awal</h4>
                        <p class="text-xs text-slate-500 mb-4 flex-1">
                            Input saldo tunai & bank saat mulai menggunakan
                            sistem.
                        </p>
                        {#if !checklist.hasOpeningBalance}
                            <Button
                                size="sm"
                                variant="outline"
                                class="w-full justify-between"
                                href="/accounting/setup"
                            >
                                Atur Sekarang <ArrowRight class="h-3 w-3" />
                            </Button>
                        {/if}
                    </div>

                    <!-- 2. Assets -->
                    <div
                        class="flex flex-col p-4 bg-white dark:bg-slate-900 rounded-xl border {checklist.hasAssets
                            ? 'border-green-100 dark:border-green-900/30'
                            : 'border-slate-200 dark:border-slate-800'}"
                    >
                        <div class="flex items-center justify-between mb-3">
                            <div
                                class="p-2 rounded-lg {checklist.hasAssets
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-slate-100 text-slate-500'}"
                            >
                                <Settings class="h-4 w-4" />
                            </div>
                            {#if checklist.hasAssets}
                                <CheckCircle2 class="h-5 w-5 text-green-500" />
                            {:else}
                                <Circle class="h-5 w-5 text-slate-300" />
                            {/if}
                        </div>
                        <h4 class="font-semibold text-sm mb-1">Aset Tetap</h4>
                        <p class="text-xs text-slate-500 mb-4 flex-1">
                            Catat peralatan & inventaris untuk hitung penyusutan
                            otomatis.
                        </p>
                        {#if !checklist.hasAssets}
                            <Button
                                size="sm"
                                variant="outline"
                                class="w-full justify-between"
                                href="/accounting/assets"
                            >
                                Tambah Aset <ArrowRight class="h-3 w-3" />
                            </Button>
                        {/if}
                    </div>

                    <!-- 3. Target -->
                    <div
                        class="flex flex-col p-4 bg-white dark:bg-slate-900 rounded-xl border {checklist.hasTarget
                            ? 'border-green-100 dark:border-green-900/30'
                            : 'border-slate-200 dark:border-slate-800'}"
                    >
                        <div class="flex items-center justify-between mb-3">
                            <div
                                class="p-2 rounded-lg {checklist.hasTarget
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-slate-100 text-slate-500'}"
                            >
                                <Target class="h-4 w-4" />
                            </div>
                            {#if checklist.hasTarget}
                                <CheckCircle2 class="h-5 w-5 text-green-500" />
                            {:else}
                                <Circle class="h-5 w-5 text-slate-300" />
                            {/if}
                        </div>
                        <h4 class="font-semibold text-sm mb-1">
                            Target Bulanan
                        </h4>
                        <p class="text-xs text-slate-500 mb-4 flex-1">
                            Tentukan target pendapatan untuk memantau performa
                            harian.
                        </p>
                        {#if !checklist.hasTarget}
                            <Button
                                size="sm"
                                variant="outline"
                                class="w-full justify-between"
                                href="/accounting/targets"
                            >
                                Set Target <ArrowRight class="h-3 w-3" />
                            </Button>
                        {/if}
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
{/if}
