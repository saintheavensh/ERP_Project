<script lang="ts">
    import { Badge } from "$lib/shared/components/ui/badge";
    import { FileText } from "lucide-svelte";
    import type { TicketDetailController } from "../../../ticket-detail.controller.svelte";

    let { controller }: { controller: TicketDetailController } = $props();

    function getPhysicalLabel(v: string) {
        const map: Record<string, string> = {
            normal: "Normal (Mulus)",
            lecet: "Lecet / Goresan",
            retak: "Retak / Pecah",
            bekas_air: "Bekas Air / Korosi",
            bengkok: "Bengkok / Dent",
        };
        return map[v] || v;
    }

    function getCompletenessLabel(v: string) {
        const map: Record<string, string> = {
            charger: "Charger",
            box: "Dus/Box",
            simcard: "SIM Card",
            memorycard: "Memory Card",
            case: "Case/Casing",
            earphone: "Earphone",
        };
        return map[v] || v;
    }
</script>

{#if controller.serviceOrder.phone?.physical?.length || controller.serviceOrder.phone?.completeness?.length}
    <div class="bg-card rounded-[2rem] shadow-lg border-2 border-slate-100 p-8">
        <h3 class="font-bold text-xl mb-6 flex items-center gap-3">
            <div class="p-2 bg-slate-100 rounded-xl">
                <FileText class="h-6 w-6 text-slate-500" />
            </div>
            Kondisi & Kelengkapan
        </h3>
        <div class="grid gap-8 md:grid-cols-2">
            {#if controller.serviceOrder.phone?.physical?.length}
                <div class="space-y-3">
                    <p
                        class="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full w-fit border"
                    >
                        Fisik Perangkat
                    </p>
                    <div class="flex flex-wrap gap-2">
                        {#each controller.serviceOrder.phone.physical as p}
                            <Badge
                                variant="secondary"
                                class="rounded-xl px-4 py-1.5 font-bold uppercase tracking-tighter bg-slate-100 text-slate-600 border-none"
                            >
                                {getPhysicalLabel(p)}
                            </Badge>
                        {/each}
                    </div>
                </div>
            {/if}
            {#if controller.serviceOrder.phone?.completeness?.length}
                <div class="space-y-3">
                    <p
                        class="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full w-fit border"
                    >
                        Aksesoris / Kelengkapan
                    </p>
                    <div class="flex flex-wrap gap-2">
                        {#each controller.serviceOrder.phone.completeness as c}
                            <Badge
                                variant="outline"
                                class="rounded-xl px-4 py-1.5 font-bold uppercase tracking-tighter border-slate-200 text-slate-500 bg-white shadow-sm"
                            >
                                {getCompletenessLabel(c)}
                            </Badge>
                        {/each}
                    </div>
                </div>
            {/if}
        </div>
    </div>
{/if}
