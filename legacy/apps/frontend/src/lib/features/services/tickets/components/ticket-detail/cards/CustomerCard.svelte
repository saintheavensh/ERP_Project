<script lang="ts">
    import { User } from "lucide-svelte";
    import type { TicketDetailController } from "../../../ticket-detail.controller.svelte";

    let { controller }: { controller: TicketDetailController } = $props();
</script>

<div
    class="group relative overflow-hidden bg-card rounded-[2rem] shadow-lg border-2 border-slate-100 p-8 hover:border-primary/20 transition-all duration-300"
>
    <!-- svelte-ignore a11y_consider_explicit_label -->
    <div
        class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"
    >
        <User class="h-24 w-24" />
    </div>
    <h3 class="font-bold text-xl mb-6 flex items-center gap-3">
        <div class="p-2 bg-primary/10 rounded-xl">
            <User class="h-6 w-6 text-primary" />
        </div>
        Data Pelanggan
    </h3>
    <div class="space-y-4 text-sm relative z-10">
        <div class="flex flex-col gap-1">
            <span
                class="text-slate-400 font-bold uppercase text-[10px] tracking-widest"
                >Nama Lengkap</span
            >
            <span class="text-lg font-black"
                >{controller.serviceOrder.customer?.name || "-"}</span
            >
        </div>
        <div class="flex flex-col gap-1">
            <span
                class="text-slate-400 font-bold uppercase text-[10px] tracking-widest"
                >Nomor Telepon</span
            >
            <span class="text-lg font-mono font-bold">
                {#if controller.canViewContact}
                    {controller.serviceOrder.customer?.phone || "-"}
                {:else}
                    {controller.serviceOrder.customer?.phone
                        ? controller.serviceOrder.customer.phone.slice(0, 4) +
                          "****" +
                          controller.serviceOrder.customer.phone.slice(-3)
                        : "-"}
                {/if}
            </span>
        </div>
        {#if controller.serviceOrder.customer?.address}
            <div class="flex flex-col gap-1">
                <span
                    class="text-slate-400 font-bold uppercase text-[10px] tracking-widest"
                    >Alamat</span
                >
                <span class="font-medium text-slate-600 italic">
                    {#if controller.canViewContact}
                        {controller.serviceOrder.customer.address}
                    {:else}
                        Hidden
                    {/if}
                </span>
            </div>
        {/if}
    </div>
</div>
