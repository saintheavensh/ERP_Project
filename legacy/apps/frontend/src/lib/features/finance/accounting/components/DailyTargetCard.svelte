<script lang="ts">
    import { Card, CardContent } from "$lib/shared/components/ui/card";
    import { Target, CheckCircle2, AlertCircle, Clock } from "lucide-svelte";
    import { type AccountingController } from "../accounting.controller.svelte";

    interface Props {
        controller: AccountingController;
    }

    let { controller }: Props = $props();
</script>

{#if controller.dashboard?.todayProgress?.hasTarget}
    <Card
        class="border-0 shadow-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden rounded-3xl"
    >
        <CardContent class="p-8">
            <div class="flex flex-col lg:flex-row justify-between gap-8">
                <!-- Target Info -->
                <div class="flex-1">
                    <div class="flex items-center gap-2 text-blue-200 mb-2">
                        <Target class="h-5 w-5" />
                        <span class="text-sm font-medium">Target Harian</span>
                    </div>
                    <div class="text-4xl font-bold mb-1">
                        {controller.formatCurrency(
                            controller.dashboard.todayProgress.dailyTarget,
                        )}
                    </div>
                    <p class="text-blue-200 text-sm">
                        Titik Impas (BEP): {controller.formatCurrency(
                            controller.dashboard.todayProgress.dailyBreakeven,
                        )}
                    </p>

                    <!-- Progress Bar -->
                    <div class="mt-6 space-y-2">
                        <div class="flex justify-between text-sm">
                            <span>Progress Hari Ini</span>
                            <span class="font-bold"
                                >{controller.dashboard.todayProgress
                                    .progressPercent}%</span
                            >
                        </div>
                        <div
                            class="h-4 bg-white/20 rounded-full overflow-hidden"
                        >
                            <div
                                class="h-full {controller.progressColor} transition-all duration-500 rounded-full"
                                style="width: {Math.min(
                                    controller.dashboard.todayProgress
                                        .progressPercent,
                                    100,
                                )}%"
                            ></div>
                        </div>
                    </div>
                </div>

                <!-- Today's Revenue -->
                <div
                    class="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-6"
                >
                    <p class="text-blue-200 text-sm mb-1">
                        Pendapatan Hari Ini
                    </p>
                    <div class="text-3xl font-bold mb-4">
                        {controller.formatCurrency(
                            Number(
                                controller.dashboard.todayProgress.todayRevenue,
                            ) || 0,
                        )}
                    </div>

                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div class="flex items-center gap-2">
                            {#if controller.dashboard.todayProgress.isAboveBreakeven}
                                <CheckCircle2 class="h-4 w-4 text-green-300" />
                                <span class="text-green-200">Profit (Aman)</span
                                >
                            {:else}
                                <AlertCircle class="h-4 w-4 text-yellow-300" />
                                <span class="text-yellow-200">Belum BEP</span>
                            {/if}
                        </div>
                        <div class="flex items-center gap-2">
                            <Clock class="h-4 w-4 text-blue-200" />
                            <span
                                >Kurang: {controller.formatCurrency(
                                    controller.dashboard.todayProgress
                                        .remaining,
                                )}</span
                            >
                        </div>
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
{/if}
