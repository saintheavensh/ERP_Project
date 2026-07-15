<script lang="ts">
    import { onMount } from "svelte";
    import { BrandsController } from "$lib/features/inventory/brands/brands.controller.svelte";
    import BrandHeader from "$lib/features/inventory/brands/components/BrandHeader.svelte";
    import BrandCard from "$lib/features/inventory/brands/components/BrandCard.svelte";
    import BrandDialog from "$lib/features/inventory/brands/components/BrandDialog.svelte";
    import BrandEmptyState from "$lib/features/inventory/brands/components/BrandEmptyState.svelte";

    const controller = new BrandsController();

    onMount(() => {
        controller.init();
    });
</script>

<div class="flex flex-col gap-4 p-4 md:p-8">
    <BrandHeader {controller} />

    {#if controller.loading}
        <div class="flex items-center justify-center h-64">
            <div class="text-muted-foreground">Loading brands...</div>
        </div>
    {:else if controller.brands.length === 0}
        <BrandEmptyState {controller} />
    {:else}
        <div
            class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        >
            {#each controller.brands as brand (brand.id)}
                <BrandCard {brand} {controller} />
            {/each}
        </div>
    {/if}

    <BrandDialog {controller} />
</div>
