<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { AccountingController } from "$lib/features/finance/accounting/accounting.controller.svelte";
    import AccountingHeader from "$lib/features/finance/accounting/components/AccountingHeader.svelte";
    import DailyTargetCard from "$lib/features/finance/accounting/components/DailyTargetCard.svelte";
    import AccountingStats from "$lib/features/finance/accounting/components/AccountingStats.svelte";
    import ProfitLossSection from "$lib/features/finance/accounting/components/ProfitLossSection.svelte";
    import QuickLinks from "$lib/features/finance/accounting/components/QuickLinks.svelte";
    import SetupGuide from "$lib/features/finance/accounting/components/SetupGuide.svelte";

    const controller = new AccountingController();

    onMount(() => {
        controller.init();
    });

    onDestroy(() => {
        controller.destroy();
    });
</script>

<div class="space-y-8 animate-in fade-in duration-500 pb-10">
    <!-- Header -->
    <AccountingHeader {controller} />

    <!-- Setup Guide (if incomplete) -->
    {#if controller.dashboard?.checklist}
        <SetupGuide checklist={controller.dashboard.checklist} />
    {/if}

    <!-- Daily Target Progress -->
    <DailyTargetCard {controller} />

    <!-- Quick Stats Grid -->
    <AccountingStats {controller} />

    <!-- Profit & Loss Breakdown Section -->
    <ProfitLossSection {controller} />

    <!-- Quick Links -->
    <QuickLinks />
</div>
