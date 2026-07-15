<script lang="ts">
    import { onMount } from "svelte";
    import { AssetsController } from "$lib/features/finance/accounting/assets/assets.controller.svelte";
    import AssetsHeader from "$lib/features/finance/accounting/assets/components/AssetsHeader.svelte";
    import AssetsStats from "$lib/features/finance/accounting/assets/components/AssetsStats.svelte";
    import AssetDetailModal from "$lib/features/finance/accounting/assets/components/AssetDetailModal.svelte";
    import AssetsTable from "$lib/features/finance/accounting/assets/components/AssetsTable.svelte";

    const controller = new AssetsController();

    onMount(() => {
        controller.init();
    });
</script>

<div class="space-y-6 animate-in fade-in duration-500 pb-10">
    <!-- The header and buttons -->
    <div
        class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
    >
        <AssetsHeader {controller} />
        <div class="flex items-center gap-3">
            <AssetDetailModal {controller} />
        </div>
    </div>

    <!-- Stats -->
    <AssetsStats {controller} />

    <!-- Assets Table -->
    <AssetsTable {controller} />
</div>
