<script lang="ts">
    import { ImageIcon } from "lucide-svelte";

    let {
        src,
        alt = "Product Image",
        className = "h-12 w-12",
    }: {
        src?: string;
        alt?: string;
        className?: string;
    } = $props();

    let error = $state(false);
</script>

<div
    class="rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden {className} border border-slate-200 dark:border-slate-700"
>
    {#if src && !error}
        <img
            {src}
            {alt}
            class="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            onerror={() => (error = true)}
        />
    {:else}
        <ImageIcon class="h-1/2 w-1/2 text-slate-400" />
    {/if}
</div>
