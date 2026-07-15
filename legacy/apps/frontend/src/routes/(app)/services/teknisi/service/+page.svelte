<script lang="ts">
    import ServiceList from "$lib/features/services/service/components/service-list.svelte";
    import { Wrench, Sparkles } from "lucide-svelte";
    import { fade } from "svelte/transition";
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { CashRegisterService } from "$lib/features/accounting/services/cash-register.service";
    import { authStore } from "$lib/shared/lib/auth-store.svelte";
    import { toast } from "svelte-sonner";

    const user = $derived(authStore.user);

    onMount(async () => {
        try {
            const status = await CashRegisterService.getStatus();
            if (!status.isOpen) {
                toast.error("Register is closed. Please open a session first.");
                goto("/sales/kasir/kasir");
            }
        } catch (e) {
            console.error("Failed to check register status", e);
        }
    });
</script>

<div class="min-h-screen space-y-8 p-6 pb-20">
    <!-- Header with Gradient -->
    <div
        class="relative bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl p-8 text-white overflow-hidden shadow-2xl"
    >
        <div
            class="absolute inset-0 bg-white/10 opacity-20 pattern-grid-lg pointer-events-none"
        ></div>
        <div
            class="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        >
            <div>
                <div class="flex items-center gap-3 mb-2">
                    <div class="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Wrench class="h-6 w-6 text-white" />
                    </div>
                    <h1 class="text-3xl font-bold tracking-tight text-white">
                        Service & Reparasi
                    </h1>
                </div>
                <p class="text-white/80 max-w-xl text-lg font-light">
                    Kelola antrian service, pantau progress teknisi, dan update
                    status reparasi.
                </p>
            </div>

            <!-- Optional: Add a high-level action or stat if needed directly in header -->
        </div>
    </div>

    <!-- Main Content -->
    <div in:fade={{ duration: 500 }}>
        <ServiceList />
    </div>
</div>
