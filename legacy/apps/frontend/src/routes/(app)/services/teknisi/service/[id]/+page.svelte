<script lang="ts">
    import { page } from "$app/stores";
    import { TicketDetailController } from "$lib/features/services/tickets/ticket-detail.controller.svelte";
    import TicketHeader from "$lib/features/services/tickets/components/ticket-detail/TicketHeader.svelte";
    import TicketSidebar from "$lib/features/services/tickets/components/ticket-detail/TicketSidebar.svelte";
    import CustomerCard from "$lib/features/services/tickets/components/ticket-detail/cards/CustomerCard.svelte";
    import DeviceCard from "$lib/features/services/tickets/components/ticket-detail/cards/DeviceCard.svelte";
    import ConditionCard from "$lib/features/services/tickets/components/ticket-detail/cards/ConditionCard.svelte";
    import SecurityCard from "$lib/features/services/tickets/components/ticket-detail/cards/SecurityCard.svelte";
    import PhotosCard from "$lib/features/services/tickets/components/ticket-detail/cards/PhotosCard.svelte";
    import DiagnosisCard from "$lib/features/services/tickets/components/ticket-detail/cards/DiagnosisCard.svelte";
    import QCCard from "$lib/features/services/tickets/components/ticket-detail/cards/QCCard.svelte";
    import ServiceItemsCard from "$lib/features/services/tickets/components/ticket-detail/cards/ServiceItemsCard.svelte";
    import PaymentCard from "$lib/features/services/tickets/components/ticket-detail/cards/PaymentCard.svelte";
    import CostSummary from "$lib/features/services/tickets/components/ticket-detail/cards/CostSummary.svelte";
    import ActionButtons from "$lib/features/services/tickets/components/ticket-detail/ActionButtons.svelte";
    import ServiceModals from "$lib/features/services/tickets/components/ticket-detail/modals/ServiceModals.svelte";
    import { Loader2 } from "lucide-svelte";
    import { Button } from "$lib/shared/components/ui/button";

    const serviceId = parseInt($page.params.id ?? "0");
    const controller = new TicketDetailController(serviceId);

    $effect(() => {
        controller.init();
    });
</script>

{#if controller.loading}
    <div class="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 class="h-8 w-8 animate-spin text-primary" />
        <p class="text-muted-foreground font-medium">Memuat data service...</p>
    </div>
{:else if controller.serviceOrder}
    <div class="min-h-screen bg-slate-50/50 pb-32">
        <!-- Header -->
        <TicketHeader {controller} />

        <div class="container mx-auto px-4 max-w-7xl -mt-8 relative z-10">
            <div class="grid lg:grid-cols-[1fr_380px] gap-8">
                <!-- Main Content -->
                <div class="space-y-8 min-w-0">
                    <CustomerCard {controller} />
                    <DeviceCard {controller} />
                    <ConditionCard {controller} />
                    <SecurityCard {controller} />
                    <PhotosCard {controller} />
                    <DiagnosisCard {controller} />
                    <QCCard {controller} />
                    <ServiceItemsCard {controller} />
                    <PaymentCard {controller} />
                    <CostSummary {controller} />
                </div>

                <!-- Sidebar -->
                <div class="lg:sticky lg:top-8 h-fit space-y-6">
                    <TicketSidebar {controller} />
                </div>
            </div>
        </div>

        <!-- Sticky Action Buttons -->
        <div
            class="fixed bottom-0 left-0 right-0 p-4 pointer-events-none z-40 bg-gradient-to-t from-background via-background/80 to-transparent pb-6 pt-12"
        >
            <div class="container mx-auto max-w-7xl pointer-events-auto">
                <ActionButtons {controller} />
            </div>
        </div>

        <!-- Modals -->
        <ServiceModals {controller} />
    </div>
{:else}
    <div class="flex flex-col items-center justify-center min-h-screen gap-4">
        <p class="text-muted-foreground font-medium">
            Gagal memuat data service.
        </p>
        <Button onclick={() => location.reload()}>Coba Lagi</Button>
    </div>
{/if}
