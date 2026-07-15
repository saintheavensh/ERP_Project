<script lang="ts">
    import { Input } from "$lib/shared/components/ui/input";
    import { Search, Barcode } from "lucide-svelte";
    import { cn } from "$lib/shared/lib/utils";
    import { onMount } from "svelte";

    let {
        value = $bindable(""),
        placeholder = "Scan Barcode or Search...",
        class: className = "",
        onScan = (val: string) => {},
    } = $props();

    let inputElement = $state<any>(null);

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") {
            onScan(value);
        }
    }

    onMount(() => {
        if (inputElement && typeof inputElement.focus === "function") {
            inputElement.focus();
        }
    });
</script>

<div class={cn("relative w-full", className)}>
    <div
        class="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none text-muted-foreground"
    >
        <Search class="h-4 w-4" />
        <div class="h-4 w-[1px] bg-border mx-1"></div>
        <Barcode class="h-4 w-4" />
    </div>
    <Input
        bind:this={inputElement}
        type="text"
        {placeholder}
        class="pl-16 h-12 text-lg rounded-2xl border-2 focus-visible:ring-primary shadow-sm"
        bind:value
        onkeydown={handleKeydown}
    />
</div>
