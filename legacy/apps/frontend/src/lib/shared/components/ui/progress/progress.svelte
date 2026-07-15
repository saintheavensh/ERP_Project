<script lang="ts">
    import { cn } from "$lib/shared/lib/utils";

    let {
        value = 0,
        max = 100,
        class: className = "",
        indicatorClass = "",
    }: {
        value?: number;
        max?: number;
        class?: string;
        indicatorClass?: string;
    } = $props();

    let percentage = $derived(Math.min(Math.max((value / max) * 100, 0), 100));
</script>

<div
    class={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800",
        className,
    )}
    role="progressbar"
    aria-valuemin={0}
    aria-valuemax={max}
    aria-valuenow={value}
>
    <div
        class={cn(
            "h-full bg-blue-600 transition-all duration-300 ease-in-out",
            indicatorClass,
        )}
        style="width: {percentage}%"
    ></div>
</div>
