<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import {
        Chart,
        Title,
        Tooltip,
        Legend,
        BarElement,
        CategoryScale,
        LinearScale,
        BarController,
        type ChartItem,
    } from "chart.js";

    Chart.register(
        Title,
        Tooltip,
        Legend,
        BarElement,
        CategoryScale,
        LinearScale,
        BarController,
    );

    let { data } = $props<{
        data: {
            revenue: number;
            cogs: number;
            expenses: number;
        };
    }>();

    let canvas: HTMLCanvasElement;
    let chart: Chart;

    const chartConfig = $derived({
        labels: ["Pendapatan", "HPP (Modal)", "Pengeluaran"],
        datasets: [
            {
                label: "Amount",
                data: [data.revenue, data.cogs, data.expenses],
                backgroundColor: [
                    "rgba(34, 197, 94, 0.7)", // Green for Revenue
                    "rgba(249, 115, 22, 0.7)", // Orange for COGS
                    "rgba(239, 68, 68, 0.7)", // Red for Expenses
                ],
                borderColor: [
                    "rgb(34, 197, 94)",
                    "rgb(249, 115, 22)",
                    "rgb(239, 68, 68)",
                ],
                borderWidth: 1,
                borderRadius: 8,
                barThickness: 60,
            },
        ],
    });

    onMount(() => {
        const ctx = canvas.getContext("2d");
        if (ctx) {
            chart = new Chart(ctx as ChartItem, {
                type: "bar",
                data: chartConfig,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false,
                        },
                        tooltip: {
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

