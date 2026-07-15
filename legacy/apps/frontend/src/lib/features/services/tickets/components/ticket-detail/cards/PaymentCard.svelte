<script lang="ts">
    import { Badge } from "$lib/shared/components/ui/badge";
    import { formatDate } from "$lib/shared/lib/utils";
    import { CreditCard, RefreshCw, Shield } from "lucide-svelte";
    import type { TicketDetailController } from "../../../ticket-detail.controller.svelte";

    let { controller }: { controller: TicketDetailController } = $props();
</script>

{#if controller.serviceOrder.isWalkin && (controller.serviceOrder.payments || controller.serviceOrder.paymentMethod)}
    <div
        class="bg-card rounded-[2rem] shadow-lg border-2 border-slate-100 p-8 border-l-[6px] border-l-emerald-500"
    >
        <div class="flex items-center justify-between mb-8">
            <h3 class="font-bold text-xl flex items-center gap-3">
                <div class="p-2 bg-emerald-500/10 rounded-xl">
                    <CreditCard class="h-6 w-6 text-emerald-600" />
                </div>
                Informasi Pembayaran
            </h3>
            <div class="flex flex-col items-end">
                <span
                    class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 leading-none"
                    >Status</span
                >
                <Badge
                    class="bg-emerald-500 text-white font-black uppercase tracking-widest px-4 border-none shadow-sm shadow-emerald-200"
                    >LUNAS</Badge
                >
            </div>
        </div>

        <div class="grid gap-8 md:grid-cols-2">
            <div class="space-y-4">
                <div
                    class="p-6 bg-slate-50/50 rounded-[1.5rem] border border-slate-100 hover:bg-white transition-colors"
                >
                    <span
                        class="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2"
                        >Metode</span
                    >
                    <div class="flex items-center gap-3">
                        <div
                            class="p-2.5 bg-white rounded-xl shadow-sm border text-slate-400"
                        >
                            {#if controller.serviceOrder.paymentMethod === "transfer"}
                                <RefreshCw class="h-5 w-5" />
                            {:else}
                                <CreditCard class="h-5 w-5" />
                            {/if}
                        </div>
                        <span
                            class="text-2xl font-black text-slate-800 tracking-tight uppercase"
                        >
                            {controller.serviceOrder.paymentMethod || "CASH"}
                        </span>
                    </div>
                </div>

                {#if controller.serviceOrder.transferDetails}
                    <div
                        class="p-6 bg-blue-50/50 rounded-[1.5rem] border border-blue-100 relative overflow-hidden group hover:bg-blue-50 transition-colors"
                    >
                        <div
                            class="absolute -top-4 -right-4 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity"
                        >
                            <RefreshCw class="h-24 w-24 text-blue-500" />
                        </div>
                        <span
                            class="text-[10px] font-black uppercase tracking-widest text-blue-400 block mb-3 relative z-10"
                            >Konfirmasi Transfer</span
                        >
                        <div class="space-y-1 relative z-10">
                            <p
                                class="text-[10px] font-black text-blue-900/40 uppercase tracking-widest"
                            >
                                Bank {controller.serviceOrder.transferDetails
                                    .bankName}
                            </p>
                            <p
                                class="text-2xl font-black text-blue-900 tracking-tighter leading-none"
                            >
                                {controller.serviceOrder.transferDetails
                                    .accountNumber}
                            </p>
                            <p
                                class="text-xs font-bold text-blue-700/60 border-t border-blue-200/50 pt-2 mt-2 uppercase tracking-widest"
                            >
                                A.N. {controller.serviceOrder.transferDetails
                                    .accountHolder}
                            </p>
                        </div>
                    </div>
                {/if}
            </div>

            <div class="space-y-6">
                <div
                    class="flex flex-col gap-1 p-6 bg-slate-50/50 rounded-[1.5rem] border border-slate-100"
                >
                    <span
                        class="text-[10px] font-black uppercase tracking-widest text-slate-400"
                        >Total Nominal</span
                    >
                    <div class="flex items-baseline gap-1">
                        <span class="text-sm font-bold text-slate-400 uppercase"
                            >Rp</span
                        >
                        <span
                            class="text-4xl font-black text-slate-800 tracking-tighter"
                        >
                            {(
                                controller.serviceOrder.actualCost || 0
                            ).toLocaleString("id-ID")}
                        </span>
                    </div>
                </div>

                {#if controller.serviceOrder.warranty && controller.serviceOrder.warranty !== "none"}
                    <div
                        class="p-6 bg-indigo-50/50 rounded-[1.5rem] border border-indigo-100 group hover:bg-indigo-50 transition-colors"
                    >
                        <div class="flex items-center gap-3 mb-2">
                            <Shield class="h-5 w-5 text-indigo-500" />
                            <span
                                class="text-[10px] font-black uppercase tracking-widest text-indigo-400"
                                >Garansi Toko</span
                            >
                        </div>
                        <p
                            class="text-xl font-black text-indigo-900 leading-tight"
                        >
                            {controller.serviceOrder.warranty}
                            {#if controller.serviceOrder.warrantyExpiryDate}
                                <span
                                    class="block text-[10px] font-bold text-indigo-400/60 uppercase mt-1"
                                    >Berlaku s/d {formatDate(
                                        controller.serviceOrder
                                            .warrantyExpiryDate,
                                    ).split(",")[0]}</span
                                >
                            {/if}
                        </p>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}
