<script lang="ts">
    import { onMount } from "svelte";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { Button } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import { Progress } from "$lib/shared/components/ui/progress";
    import {
        Target,
        ChevronRight,
        Loader2,
        Calculator,
        TrendingUp,
        CheckCircle2,
        AlertCircle,
    } from "lucide-svelte";
    import { api } from "$lib/shared/lib/api-client";

    let loading = $state(true);
    let todayProgress = $state<any>(null);
    let monthProgress = $state<any>(null);
    let selectedMonth = $state(new Date().toISOString().slice(0, 7));
    let submitting = $state(false);

    // Form for setting target
    let workingDays = $state(22);
    let profitMargin = $state(20);

    async function fetchData() {
        try {
            loading = true;
            const [todayRes, monthRes] = await Promise.all([
                api.get("/accounting/targets/today"),
                api.get(`/accounting/targets/${selectedMonth}`),
            ]);
            todayProgress = todayRes.data.data;
            monthProgress = monthRes.data.data;

            if (monthProgress && !monthProgress.error) {
                workingDays = monthProgress.workingDays || 22;
            }
        } catch (e) {
            console.error("Failed to fetch target data", e);
        } finally {
            loading = false;
        }
    }

    async function setTarget() {
        try {
            submitting = true;
            await api.post(`/accounting/targets/${selectedMonth}`, {
                workingDays,
                profitMarginPercent: profitMargin,
            });
            await fetchData();
        } catch (e: any) {
            console.error("Failed to set target", e);
            alert(e.response?.data?.error || "Gagal menyimpan target");
        } finally {
            submitting = false;
        }
    }

    onMount(() => {
        fetchData();
    });

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(val);

    let progressColor = $derived.by(() => {
        const pct = todayProgress?.progressPercent || 0;
        if (pct >= 100) return "bg-green-500";
        if (pct >= 70) return "bg-blue-500";
        if (pct >= 40) return "bg-yellow-500";
        return "bg-red-500";
    });
</script>

<div class="space-y-6 animate-in fade-in duration-500 pb-10">
    <!-- Header -->
    <div
        class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
    >
        <div>
            <div class="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <a href="/accounting" class="hover:text-blue-600">Akuntansi</a>
                <ChevronRight class="h-4 w-4" />
                <span class="text-slate-900 font-medium">Target Pendapatan</span
                >
            </div>
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
                Revenue Targets
            </h1>
        </div>

        <div class="flex items-center gap-3">
            <Input
                type="month"
                bind:value={selectedMonth}
                onchange={() => fetchData()}
                class="w-40"
            />
        </div>
    </div>

    {#if loading}
        <div class="flex items-center justify-center py-20">
            <Loader2 class="h-8 w-8 animate-spin text-blue-600" />
        </div>
    {:else}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Today's Progress -->
            {#if todayProgress?.hasTarget}
                <Card
                    class="border-0 shadow-lg rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 text-white"
                >
                    <CardContent class="p-8">
                        <div class="flex items-center gap-2 text-blue-200 mb-2">
                            <Target class="h-5 w-5" />
                            <span class="text-sm font-medium"
                                >Progress Hari Ini</span
                            >
                        </div>

                        <div class="text-4xl font-bold mb-1">
                            {todayProgress.progressPercent}%
                        </div>
                        <p class="text-blue-200 text-sm mb-4">
                            dari target {formatCurrency(
                                todayProgress.dailyTarget,
                            )}
                        </p>

                        <!-- Progress Bar -->
                        <div
                            class="h-4 bg-white/20 rounded-full overflow-hidden mb-6"
                        >
                            <div
                                class="h-full {progressColor} transition-all duration-500 rounded-full"
                                style="width: {Math.min(
                                    todayProgress.progressPercent,
                                    100,
                                )}%"
                            ></div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="bg-white/10 rounded-xl p-4">
                                <p class="text-sm text-blue-200">Pendapatan</p>
                                <p class="text-xl font-bold">
                                    {formatCurrency(
                                        Number(todayProgress.todayRevenue) || 0,
                                    )}
                                </p>
                            </div>
                            <div class="bg-white/10 rounded-xl p-4">
                                <p class="text-sm text-blue-200">Kurang</p>
                                <p class="text-xl font-bold">
                                    {formatCurrency(todayProgress.remaining)}
                                </p>
                            </div>
                        </div>

                        <div
                            class="flex items-center gap-4 mt-6 pt-4 border-t border-white/20 text-sm"
                        >
                            {#if todayProgress.isAboveBreakeven}
                                <div
                                    class="flex items-center gap-2 text-green-200"
                                >
                                    <CheckCircle2 class="h-4 w-4" />
                                    <span>Di atas BEP</span>
                                </div>
                            {:else}
                                <div
                                    class="flex items-center gap-2 text-yellow-200"
                                >
                                    <AlertCircle class="h-4 w-4" />
                                    <span>Di bawah BEP</span>
                                </div>
                            {/if}
                            <span class="text-blue-200">
                                BEP: {formatCurrency(
                                    todayProgress.dailyBreakeven,
                                )}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            {:else}
                <Card class="border-0 shadow-lg rounded-3xl">
                    <CardContent class="p-8 text-center">
                        <Target class="h-12 w-12 mx-auto mb-4 text-slate-300" />
                        <p class="text-slate-500">
                            Target bulan ini belum diatur
                        </p>
                        <p class="text-sm text-slate-400 mt-2">
                            Gunakan form di samping untuk mengatur target
                        </p>
                    </CardContent>
                </Card>
            {/if}

            <!-- Target Setup -->
            <Card class="border-0 shadow-lg rounded-2xl">
                <CardHeader>
                    <CardTitle class="text-lg flex items-center gap-2">
                        <Calculator class="h-5 w-5 text-blue-600" />
                        Setup Target Bulan {selectedMonth}
                    </CardTitle>
                </CardHeader>
                <CardContent class="space-y-4">
                    <div class="space-y-2">
                        <Label>Jumlah Hari Kerja</Label>
                        <Input
                            type="number"
                            bind:value={workingDays}
                            min="1"
                            max="31"
                        />
                        <p class="text-xs text-slate-500">
                            Jumlah hari toko buka dalam 1 bulan
                        </p>
                    </div>

                    <div class="space-y-2">
                        <Label>Target Margin Profit (%)</Label>
                        <Input
                            type="number"
                            bind:value={profitMargin}
                            min="0"
                            max="100"
                        />
                        <p class="text-xs text-slate-500">
                            Persentase keuntungan di atas break-even
                        </p>
                    </div>

                    {#if monthProgress && !monthProgress.error}
                        <Card class="bg-blue-50 border-blue-200">
                            <CardContent class="p-4 space-y-2">
                                <div class="flex justify-between text-sm">
                                    <span class="text-slate-600"
                                        >Total Biaya Bulanan</span
                                    >
                                    <span class="font-bold"
                                        >{formatCurrency(
                                            monthProgress.totalMonthlyExpenses ||
                                                0,
                                        )}</span
                                    >
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span class="text-slate-600"
                                        >Penyusutan</span
                                    >
                                    <span class="font-bold"
                                        >{formatCurrency(
                                            monthProgress.totalDepreciation ||
                                                0,
                                        )}</span
                                    >
                                </div>
                                <div
                                    class="border-t pt-2 flex justify-between text-sm"
                                >
                                    <span class="text-slate-600"
                                        >Break-even/Hari</span
                                    >
                                    <span class="font-bold text-blue-700"
                                        >{formatCurrency(
                                            monthProgress.dailyBreakeven || 0,
                                        )}</span
                                    >
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span class="text-slate-600"
                                        >Target/Hari</span
                                    >
                                    <span class="font-bold text-green-700"
                                        >{formatCurrency(
                                            monthProgress.dailyTarget || 0,
                                        )}</span
                                    >
                                </div>
                            </CardContent>
                        </Card>
                    {/if}

                    <Button
                        class="w-full"
                        onclick={setTarget}
                        disabled={submitting}
                    >
                        {#if submitting}
                            <Loader2 class="h-4 w-4 animate-spin mr-2" />
                        {/if}
                        Simpan Target
                    </Button>
                </CardContent>
            </Card>
        </div>
    {/if}
</div>
