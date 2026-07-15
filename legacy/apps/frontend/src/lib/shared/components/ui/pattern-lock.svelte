<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { cn } from "$lib/shared/lib/utils";

    interface Props {
        size?: number;
        value?: number[];
        readonly?: boolean;
    }

    let {
        size = 300,
        value = $bindable([]),
        readonly = false,
    }: Props = $props();

    const dispatch = createEventDispatcher();

    // 3x3 Grid - use $derived for computed values
    let points = $derived(
        Array.from({ length: 9 }, (_, i) => ({
            id: i,
            x: (i % 3) * (size / 3) + size / 6,
            y: Math.floor(i / 3) * (size / 3) + size / 6,
        })),
    );

    let isDrawing = $state(false);
    let currentPath = $state<number[]>([]);
    let currentPos = $state({ x: 0, y: 0 });

    // Sync currentPath with value prop
    $effect(() => {
        if (value) {
            currentPath = value;
        }
    });

    function getPointAt(x: number, y: number) {
        const radius = 20; // Hit radius
        return points.find((p) => Math.hypot(p.x - x, p.y - y) < radius);
    }

    function handleStart(e: MouseEvent | TouchEvent, pointId: number) {
        if (readonly) return;
        isDrawing = true;
        currentPath = [pointId];
        updateCurrentPos(e);
    }

    function handleMove(e: MouseEvent | TouchEvent) {
        if (!isDrawing || readonly) return;
        e.preventDefault();
        updateCurrentPos(e);

        const svg = e.currentTarget as SVGSVGElement;
        const rect = svg.getBoundingClientRect();

        let clientX, clientY;
        if ("touches" in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as MouseEvent).clientX;
            clientY = (e as MouseEvent).clientY;
        }

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        const point = getPointAt(x, y);
        if (point && !currentPath.includes(point.id)) {
            currentPath = [...currentPath, point.id];
        }
    }

    function handleEnd() {
        if (!isDrawing || readonly) return;
        isDrawing = false;
        dispatch("change", currentPath);
    }

    function updateCurrentPos(e: MouseEvent | TouchEvent) {
        const svg = (e.target as Element).closest("svg");
        if (!svg) return;
        const rect = svg.getBoundingClientRect();

        let clientX, clientY;
        if ("touches" in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as MouseEvent).clientX;
            clientY = (e as MouseEvent).clientY;
        }

        currentPos = {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };
    }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<svg
    width={size}
    height={size}
    class={cn(
        "touch-none select-none bg-muted/20 rounded-lg cursor-pointer",
        readonly && "pointer-events-none opacity-80",
    )}
    onmousemove={handleMove}
    onmouseup={handleEnd}
    onmouseleave={handleEnd}
    ontouchmove={handleMove}
    ontouchend={handleEnd}
    role="application"
    aria-label="Pattern Lock Input"
>
    <!-- Lines -->
    {#if currentPath.length > 0}
        <polyline
            points={currentPath
                .map((id) => `${points[id].x},${points[id].y}`)
                .join(" ")}
            fill="none"
            stroke="hsl(var(--primary))"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
        />
        <!-- Line to current mouse pos while drawing -->
        {#if isDrawing}
            <line
                x1={points[currentPath[currentPath.length - 1]].x}
                y1={points[currentPath[currentPath.length - 1]].y}
                x2={currentPos.x}
                y2={currentPos.y}
                stroke="hsl(var(--primary))"
                stroke-width="4"
                stroke-linecap="round"
                stroke-dasharray="4 4"
                opacity="0.5"
            />
        {/if}
    {/if}

    <!-- Points -->
    {#each points as point}
        <!-- Line/Fill indicator -->
        <circle
            cx={point.x}
            cy={point.y}
            r="24"
            class={cn(
                "fill-transparent transition-all duration-200",
                currentPath.includes(point.id)
                    ? "fill-primary/20"
                    : "hover:fill-muted/50",
            )}
        />

        <!-- Visible Dot -->
        <circle
            cx={point.x}
            cy={point.y}
            r="8"
            class={cn(
                "fill-muted-foreground transition-all duration-200",
                currentPath.includes(point.id) ? "fill-primary" : "",
            )}
        />

        <!-- Number Label -->
        <text
            x={point.x}
            y={point.y + 40}
            text-anchor="middle"
            class="text-[10px] fill-muted-foreground select-none pointer-events-none font-medium"
        >
            {point.id + 1}
        </text>

        <!-- Invisible Hit Area (Larger) -->
        <circle
            cx={point.x}
            cy={point.y}
            r="30"
            fill="transparent"
            onmousedown={(e) => handleStart(e, point.id)}
            ontouchstart={(e) => {
                e.preventDefault();
                handleStart(e, point.id);
            }}
            role="button"
            aria-label="Connect point {point.id + 1}"
            tabindex="-1"
            class="outline-none"
        />
    {/each}
</svg>
