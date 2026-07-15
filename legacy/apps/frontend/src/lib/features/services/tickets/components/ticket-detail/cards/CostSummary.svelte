<script lang="ts">
    import type { TicketDetailController } from "../../../ticket-detail.controller.svelte";

    let { controller }: { controller: TicketDetailController } = $props();
</script>

{#if controller.canViewFinancials && controller.serviceOrder.status !== "antrian" && controller.serviceOrder.status !== "dicek"}
    <div
        class="bg-slate-900 rounded-[2rem] shadow-2xl p-8 text-white relative overflow-hidden"
    >
        <!-- Abstract background flare -->
        <div
            class="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[100px]"
        ></div>
        <div
            class="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px]"
        ></div>

        <h3
            class="font-black text-xs uppercase tracking-[0.3em] text-white/40 mb-8 flex items-center gap-3 relative z-10"
        >
            <div class="h-px w-8 bg-white/20"></div>
            Final Financial Summary
        </h3>

        <div class="space-y-6 relative z-10">
            <div class="flex justify-between items-center group">
                <div class="flex flex-col">
                    <span
                        class="text-[10px] font-black uppercase tracking-widest text-white/30 group-hover:text-white/50 transition-colors"
                        >Service Fee</span
                    >
                    <span class="text-xs text-white/50"
                        >Biaya Jasa & Pengerjaan</span
                    >
                </div>
                <span class="text-xl font-bold tracking-tight"
                    >Rp {controller.derivedServiceFee.toLocaleString(
                        "id-ID",
                    )}</span
                >
            </div>

            <div class="flex justify-between items-center group">
                <div class="flex flex-col">
                    <span
                        class="text-[10px] font-black uppercase tracking-widest text-white/30 group-hover:text-white/50 transition-colors"
                        >Replacement Parts</span
                    >
                    <span class="text-xs text-white/50"
                        >Total Biaya Suku Cadang</span
                    >
                </div>
                <span class="text-xl font-bold tracking-tight"
                    >Rp {controller.totalParts.toLocaleString("id-ID")}</span
                >
            </div>

            <div class="pt-6 mt-6 border-t border-white/10 relative">
                <div class="flex justify-between items-end">
                    <div class="flex flex-col">
                        <span
                            class="text-[10px] font-black uppercase tracking-[0.2em] text-primary"
                            >Grand Total Revenue</span
                        >
                        <span class="text-[10px] text-white/30 italic"
                            >Total tagihan ke customer</span
                        >
                    </div>
                    <div class="flex flex-col items-end">
                        <div class="flex items-baseline gap-1">
                            <span class="text-sm font-black text-white/40"
                                >IDR</span
                            >
                            <span
                                class="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50"
                            >
                                {controller.grandTotal.toLocaleString("id-ID")}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}
