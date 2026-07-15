<script lang="ts">
    import type { HTMLTextareaAttributes } from "svelte/elements";
    import { cn } from "$lib/shared/lib/utils";

    let {
        class: className = undefined,
        value = $bindable(undefined),
        ...rest
    }: HTMLTextareaAttributes = $props();
</script>

<textarea
    bind:value
    class={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
    )}
    {...rest}
></textarea>
