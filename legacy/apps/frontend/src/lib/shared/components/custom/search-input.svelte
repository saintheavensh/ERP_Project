<script lang="ts">
    import { Input } from "$lib/shared/components/ui/input";
    import { Search } from "lucide-svelte";
    import { cn } from "$lib/shared/lib/utils";

    let {
        value = $bindable(""),
        placeholder = "Cari...",
        class: className = "",
    } = $props();
</script>

<div class={cn("relative w-full max-w-sm", className)}>
    <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
    <Input type="search" {placeholder} class="pl-8" bind:value />
</div>
