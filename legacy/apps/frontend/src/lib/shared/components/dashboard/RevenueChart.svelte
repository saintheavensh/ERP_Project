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

    let { data } = $props<{ data: { date: string; revenue: number }[] }>();

    let canvas: HTMLCanvasElement;
    let chart: Chart;

    // Use derived for data processing to keep it reactive
    let chartConfig = $derived({
        labels: data.map((d: { date: string; revenue: number }) => {
            const date = new Date(d.date);
            return date.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
            });
        }),
        datasets: [
            {
                label: "Global Revenue",
                fill: true,
                tension: 0.3,
                backgroundColor: "rgba(59, 130, 246, 0.2)",
                borderColor: "rgb(59, 130, 246)",
                borderCapStyle: "butt" as const,
                borderDash: [],
                borderDashOffset: 0.0,
                borderJoinStyle: "miter" as const,
                pointBorderColor: "rgb(59, 130, 246)",
                pointBackgroundColor: "#fff",
                pointBorderWidth: 1,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: "rgb(59, 130, 246)",
                pointHoverBorderColor: "rgba(220, 220, 220, 1)",
                pointHoverBorderWidth: 2,
                pointRadius: 1,
                pointHitRadius: 10,
                data: data.map(
                    (d: { date: string; revenue: number }) => d.revenue,
                ),
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
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function (value: any) {
                                    if (value >= 1000000)
                                        return value / 1000000 + "M";
                                    if (value >= 1000)
                                        return value / 1000 + "k";
                                    return value;
                                },
                            },
                        },
                    },
                },
            });
        }
    });

    // Reactive update using $effect
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
