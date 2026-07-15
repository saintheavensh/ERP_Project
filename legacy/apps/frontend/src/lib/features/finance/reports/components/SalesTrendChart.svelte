<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import {
        Chart,
        Title,
        Tooltip,
        Legend,
        LineElement,
        LinearScale,
        PointElement,
        CategoryScale,
        LineController,
        Filler,
        type ChartItem,
        type ScriptableContext,
    } from "chart.js";

    Chart.register(
        Title,
        Tooltip,
        Legend,
        LineElement,
        LinearScale,
        PointElement,
        CategoryScale,
        LineController,
        Filler,
    );

    let { data } = $props<{ data: { date: string; value: number }[] }>();

    let canvas: HTMLCanvasElement;
    let chart: Chart;

    const chartConfig = $derived({
        labels: data.map((d: { date: string; value: number }) => {
            const date = new Date(d.date);
            return date.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
            });
        }),
        datasets: [
            {
                label: "Penjualan",
                fill: true,
                tension: 0.4,
                backgroundColor: (context: ScriptableContext<"line">) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, "rgba(59, 130, 246, 0.5)"); // Brand primary color
                    gradient.addColorStop(1, "rgba(59, 130, 246, 0.0)");
                    return gradient;
                },
                borderColor: "rgb(59, 130, 246)",
                borderWidth: 2,
                pointBackgroundColor: "rgb(59, 130, 246)",
                pointBorderColor: "#fff",
                pointBorderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 6,
                data: data.map((d: { date: string; value: number }) => d.value),
            },
        ],
    });

    onMount(() => {
        const ctx = canvas.getContext("2d");
        if (ctx) {
            chart = new Chart(ctx as ChartItem, {
                type: "line",
                data: chartConfig,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: "index",
                        intersect: false,
                    },
                    plugins: {
                        legend: {
                            display: false,
                        },
                        tooltip: {
                            backgroundColor: "rgba(0, 0, 0, 0.8)",
                            titleColor: "#fff",
                            bodyColor: "#fff",
                            padding: 12,
                            cornerRadius: 8,
                            callbacks: {
                                label: function (context) {
                                    return (
                                        "Rp " +
                                        (context.parsed.y || 0).toLocaleString(
                                            "id-ID",
                                        )
                                    );
                                },
                            },
                        },
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false,
                            },
                            ticks: {
                                maxRotation: 0,
                                autoSkip: true,
                                maxTicksLimit: 10,
                            },
                        },
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: "rgba(0, 0, 0, 0.05)",
                            },
                            ticks: {
                                callback: function (value: any) {
                                    if (value >= 1000000)
                                        return value / 1000000 + "jt";
                                    if (value >= 1000)
                                        return value / 1000 + "rb";
                                    return value;
                                },
                            },
                        },
                    },
                },
            });
        }
    });

    $effect(() => {
        if (chart) {
            chart.data = chartConfig;
            chart.update();
        }
    });

    onDestroy(() => {
        if (chart) {
            chart.destroy();
        }
    });
</script>

<div class="h-[300px] w-full">
    <canvas bind:this={canvas}></canvas>
</div>

