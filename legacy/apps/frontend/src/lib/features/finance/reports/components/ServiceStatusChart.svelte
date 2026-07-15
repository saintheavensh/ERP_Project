<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import {
        Chart,
        Title,
        Tooltip,
        Legend,
        ArcElement,
        DoughnutController,
        type ChartItem,
    } from "chart.js";

    Chart.register(Title, Tooltip, Legend, ArcElement, DoughnutController);

    let { data } = $props<{ data: { status: string; count: number }[] }>();

    let canvas: HTMLCanvasElement;
    let chart: Chart;

    const chartConfig = $derived({
        labels: data.map((d: { status: string; count: number }) => d.status),
        datasets: [
            {
                data: data.map(
                    (d: { status: string; count: number }) => d.count,
                ),
                backgroundColor: [
                    "rgba(34, 197, 94, 0.7)", // Selesai (Green)
                    "rgba(59, 130, 246, 0.7)", // Dikerjakan (Blue)
                    "rgba(249, 115, 22, 0.7)", // Antrian (Orange)
                    "rgba(168, 85, 247, 0.7)", // Konfirmasi (Purple)
                    "rgba(239, 68, 68, 0.7)", // Batal (Red)
                    "rgba(107, 114, 128, 0.7)", // Others (Gray)
                ],
                borderWidth: 0,
                hoverOffset: 4,
            },
        ],
    });

    onMount(() => {
        const ctx = canvas.getContext("2d");
        if (ctx) {
            chart = new Chart(ctx as ChartItem, {
                type: "doughnut",
                data: chartConfig,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "70%",
                    plugins: {
                        legend: {
                            position: "bottom",
                            labels: {
                                usePointStyle: true,
                                padding: 20,
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

