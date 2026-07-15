<script lang="ts">
    import { cn } from "$lib/shared/lib/utils";
    let className: string | undefined | null = undefined;
    export { className as class };
</script>

<div
    class={cn("animate-pulse rounded-md bg-muted", className)}
    {...$$restProps}
></div>
