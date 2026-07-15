<script lang="ts">
    import { Badge } from "$lib/shared/components/ui/badge";
    import { Wrench } from "lucide-svelte";
    import type { TicketDetailController } from "../../../ticket-detail.controller.svelte";

    let { controller }: { controller: TicketDetailController } = $props();
</script>

{#if controller.serviceOrder.parts?.length}
    <div class="bg-card rounded-[2rem] shadow-lg border-2 border-slate-100 p-8">
        <h3 class="font-bold text-xl mb-6 flex items-center gap-3">
            <div class="p-2 bg-slate-100 rounded-xl">
                <Wrench class="h-6 w-6 text-slate-500" />
            </div>
            Suku Cadang / Spareparts
        </h3>
        <div
            class="overflow-hidden bg-slate-50/50 rounded-2xl border border-slate-100"
        >
            <table class="w-full text-sm">
                <thead>
                    <tr class="border-b bg-slate-100/50">
                        <th
                            class="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400"
                            >Nama Part</th
                        >
                        <th
                            class="text-center py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400"
                            >Sumber</th
                        >
                        <th
                            class="text-center py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400"
                            >Qty</th
                        >
                        <th
                            class="text-right py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400"
                            >Harga</th
                        >
                        <th
                            class="text-right py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400"
                            >Total</th
                        >
                    </tr>
                </thead>
                <tbody>
                    {#each controller.serviceOrder.parts as part}
                        <tr
                            class="border-b border-slate-100 last:border-none group hover:bg-white transition-colors"
                        >
                            <td class="py-4 px-6 font-bold text-slate-700"
                                >{part.name}</td
                            >
                            <td class="py-4 px-6 text-center">
                                <Badge
                                    variant="outline"
                                    class="rounded-lg text-[10px] font-black uppercase tracking-tighter {part.source ===
                                    'stok'
                                        ? 'bg-blue-50 text-blue-600 border-blue-100'
                                        : 'bg-amber-50 text-amber-600 border-amber-100'}"
                                >
                                    {part.source === "stok"
                                        ? "STOK UNIT"
                                        : "ORDER BARU"}
                                </Badge>
                            </td>
                            <td
                                class="py-4 px-6 text-center font-mono font-bold text-slate-400"
                                >{part.qty}x</td
                            >
                            <td
                                class="py-4 px-6 text-right text-slate-500 font-medium"
                                >Rp {part.price?.toLocaleString("id-ID")}</td
                            >
                            <td
                                class="py-4 px-6 text-right font-black text-slate-800"
                            >
                                Rp {part.subtotal?.toLocaleString("id-ID")}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>
{/if}
