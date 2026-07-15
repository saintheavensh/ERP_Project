<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation"; // Import goto
    import { ShoppingBag } from "lucide-svelte";
    import {
        Sheet,
        SheetContent,
        SheetTrigger,
    } from "$lib/shared/components/ui/sheet";
    import { SalesController } from "$lib/features/sales/components/sales.controller.svelte";
    import SalesHeader from "$lib/features/sales/components/SalesHeader.svelte";
    import ProductCatalog from "$lib/features/sales/components/ProductCatalog.svelte";
    import SalesCart from "$lib/features/sales/components/SalesCart.svelte";
    import PaymentDialog from "$lib/features/sales/components/PaymentDialog.svelte";
    import ApprovalModal from "$lib/features/sales/components/ApprovalModal.svelte";
    import { CashRegisterService } from "$lib/features/accounting/services/cash-register.service"; // Import Service
    import { authStore } from "$lib/shared/lib/auth-store.svelte"; // Import Auth
    import { toast } from "svelte-sonner"; // Import Toast

    const controller = new SalesController();
    const user = $derived(authStore.user);

    onMount(async () => {
        // Redirection Guard
        try {
            const status = await CashRegisterService.getStatus();
            if (!status.isOpen) {
                toast.error("Register is closed. Please open a session first.");
                goto("/kasir");
                return;
            }
        } catch (e) {
            console.error("Failed to check register status", e);
        }

        controller.init();
    });
</script>

<div class="h-screen flex bg-background overflow-hidden font-sans">
    <!-- Left: Product Catalog -->
    <div class="flex-1 flex flex-col min-w-0 bg-muted/5 relative">
        <!-- Decoration Background -->
        <div
            class="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none"
        ></div>

        <SalesHeader {controller} />

        <ProductCatalog {controller} />
    </div>

    <!-- Right: Cart & Checkout (Desktop) -->
    <div
        class="hidden lg:flex w-[400px] flex-col border-l bg-background/95 backdrop-blur shadow-2xl z-30 relative"
    >
        <SalesCart {controller} />
    </div>

    <!-- Mobile Cart Trigger -->
    <div class="lg:hidden fixed bottom-6 right-6 z-50">
        <Sheet>
            <SheetTrigger
                class="h-14 w-14 rounded-full shadow-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-105 transition-all flex items-center justify-center relative"
            >
                <ShoppingBag class="h-6 w-6" />
                {#if controller.cart.length > 0}
                    <span
                        class="absolute -top-1 -right-1 h-6 w-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900 shadow-sm"
                    >
                        {controller.cart.length}
                    </span>
                {/if}
            </SheetTrigger>
            <SheetContent
                side="right"
                class="w-full sm:w-[450px] p-0 flex flex-col h-full border-l shadow-2xl"
            >
                <SalesCart {controller} />
            </SheetContent>
        </Sheet>
    </div>

    <PaymentDialog {controller} />
    <ApprovalModal {controller} />
</div>
