<script lang="ts">
    import { Badge } from "$lib/shared/components/ui/badge";
    import { Smartphone } from "lucide-svelte";
    import type { TicketDetailController } from "../../../ticket-detail.controller.svelte";

    let { controller }: { controller: TicketDetailController } = $props();
</script>

<div
    class="group relative overflow-hidden bg-card rounded-[2rem] shadow-lg border-2 border-slate-100 p-8 hover:border-blue-500/20 transition-all duration-300"
>
    <!-- svelte-ignore a11y_consider_explicit_label -->
    <div
        class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"
    >
        <Smartphone class="h-24 w-24" />
    </div>
    <h3 class="font-bold text-xl mb-6 flex items-center gap-3">
        <div class="p-2 bg-blue-500/10 rounded-xl">
            <Smartphone class="h-6 w-6 text-blue-500" />
        </div>
        Spesifikasi Unit
    </h3>
    <div class="space-y-4 text-sm relative z-10">
        <div class="flex flex-col gap-1">
            <span
                class="text-slate-400 font-bold uppercase text-[10px] tracking-widest"
                >Merk & Model</span
            >
            <span class="text-lg font-black uppercase"
                >{controller.serviceOrder.phone?.brand || "-"}
                {controller.serviceOrder.phone?.model || ""}</span
            >
        </div>
        <div class="grid grid-cols-2 gap-4">
            {#if controller.serviceOrder.phone?.imei}
                <div class="flex flex-col gap-1">
                    <span
                        class="text-slate-400 font-bold uppercase text-[10px] tracking-widest"
                        >IMEI / SN</span
                    >
                    <span class="font-mono font-bold"
                        >{controller.serviceOrder.phone.imei}</span
                    >
                </div>
            {/if}
            {#if controller.serviceOrder.phone?.status}
                <div class="flex flex-col gap-1">
                    <span
                        class="text-slate-400 font-bold uppercase text-[10px] tracking-widest"
                        >Status Unit</span
                    >
                    <div>
                        <Badge
                            variant="secondary"
                            class="font-bold uppercase tracking-tighter bg-slate-100"
                        >
                            {controller.serviceOrder.phone.status}
                        </Badge>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>
