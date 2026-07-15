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

    let { data } = $props<{ data: { name: string; value: number }[] }>();

    let canvas: HTMLCanvasElement;
    let chart: Chart;

    let chartConfig = $derived({
        labels: data.map((d: { name: string; value: number }) => d.name),
        datasets: [
            {
                label: "Units Sold",
                data: data.map((d: { name: string; value: number }) => d.value),
                backgroundColor: [
                    "rgba(255, 99, 132, 0.2)",
                    "rgba(54, 162, 235, 0.2)",
                    "rgba(255, 206, 86, 0.2)",
                    "rgba(75, 192, 192, 0.2)",
                    "rgba(153, 102, 255, 0.2)",
                    "rgba(255, 159, 64, 0.2)",
                ],
                borderColor: [
                    "rgba(255, 99, 132, 1)",
                    "rgba(54, 162, 235, 1)",
                    "rgba(255, 206, 86, 1)",
                    "rgba(75, 192, 192, 1)",
                    "rgba(153, 102, 255, 1)",
                    "rgba(255, 159, 64, 1)",
                ],
                borderWidth: 1,
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
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
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
