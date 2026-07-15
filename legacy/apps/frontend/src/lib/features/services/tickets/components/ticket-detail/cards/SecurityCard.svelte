<script lang="ts">
    import PatternLock from "$lib/shared/components/ui/pattern-lock.svelte";
    import { Shield } from "lucide-svelte";
    import type { TicketDetailController } from "../../../ticket-detail.controller.svelte";

    let { controller }: { controller: TicketDetailController } = $props();
</script>

{#if controller.serviceOrder.phone?.pin || controller.serviceOrder.phone?.pattern}
    <div class="bg-card rounded-[2rem] shadow-lg border-2 border-slate-100 p-8">
        <h3 class="font-bold text-xl mb-6 flex items-center gap-3">
            <div class="p-2 bg-slate-100 rounded-xl">
                <Shield class="h-6 w-6 text-slate-500" />
            </div>
            Keamanan Perangkat
        </h3>
        <div class="flex flex-wrap items-center gap-12">
            {#if controller.serviceOrder.phone?.pin}
                <div class="space-y-2">
                    <p
                        class="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full w-fit border"
                    >
                        PIN Access
                    </p>
                    <p
                        class="font-mono text-4xl font-black tracking-[0.2em] text-primary"
                    >
                        {controller.serviceOrder.phone.pin}
                    </p>
                </div>
            {/if}
            {#if controller.serviceOrder.phone?.pattern && Array.isArray(controller.serviceOrder.phone.pattern)}
                <div class="space-y-4">
                    <p
                        class="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full w-fit border"
                    >
                        Pattern Lock
                    </p>
                    <div
                        class="p-4 bg-slate-50 rounded-3xl border shadow-inner"
                    >
                        <PatternLock
                            value={controller.serviceOrder.phone.pattern}
                            readonly
                            size={140}
                        />
                    </div>
                </div>
            {/if}
        </div>
    </div>
{/if}
