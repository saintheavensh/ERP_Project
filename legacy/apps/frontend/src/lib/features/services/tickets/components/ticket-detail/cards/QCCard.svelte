<script lang="ts">
    import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-svelte";
    import type { TicketDetailController } from "../../../ticket-detail.controller.svelte";

    let { controller }: { controller: TicketDetailController } = $props();
</script>

{#if controller.serviceOrder.phone?.initialQC || controller.serviceOrder.phone?.qc || (controller.serviceOrder.phone?.status && ["mati_total", "blank", "restart", "bootloop"].includes(controller.serviceOrder.phone.status))}
    <div class="bg-card rounded-[2rem] shadow-lg border-2 border-slate-100 p-8">
        <h3 class="font-bold text-xl mb-6 flex items-center gap-3">
            <div class="p-2 bg-blue-500/10 rounded-xl">
                <CheckCircle class="h-6 w-6 text-blue-500" />
            </div>
            Quality Control Perangkat
        </h3>
        <div class="grid gap-8 md:grid-cols-2">
            <!-- QC Awal -->
            <div class="space-y-4">
                <p
                    class="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full w-fit border"
                >
                    Pengecekan Awal
                </p>
                {#if controller.serviceOrder.phone?.initialQC && Object.keys(controller.serviceOrder.phone.initialQC).length > 0}
                    <div
                        class="grid grid-cols-1 gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100"
                    >
                        {#each Object.entries(controller.serviceOrder.phone.initialQC) as [key, value]}
                            <div
                                class="flex items-center justify-between text-sm group"
                            >
                                <span
                                    class="text-slate-500 font-medium group-hover:text-slate-800 transition-colors"
                                >
                                    {key.replace(/([A-Z])/g, " $1").trim()}
                                </span>
                                {#if value}
                                    <div
                                        class="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase"
                                    >
                                        <span>OK</span>
                                        <CheckCircle class="h-4 w-4" />
                                    </div>
                                {:else}
                                    <div
                                        class="flex items-center gap-1.5 text-rose-500 font-black text-[10px] uppercase"
                                    >
                                        <span>FAIL</span>
                                        <XCircle class="h-4 w-4" />
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {:else if controller.serviceOrder.phone?.status && ["mati_total", "blank", "restart", "bootloop"].includes(controller.serviceOrder.phone.status)}
                    <div
                        class="flex flex-col items-center justify-center p-8 bg-amber-50 rounded-2xl border-2 border-dashed border-amber-200 text-center"
                    >
                        <AlertCircle class="h-8 w-8 text-amber-500 mb-2" />
                        <p
                            class="text-xs font-black text-amber-700 uppercase tracking-tighter"
                        >
                            QC Dileveri Lewati
                        </p>
                        <span
                            class="text-[10px] text-amber-600 font-bold uppercase"
                            >Unit {controller.serviceOrder.phone?.status?.replace(
                                /_/g,
                                " ",
                            )}</span
                        >
                    </div>
                {:else}
                    <div
                        class="p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center"
                    >
                        <p class="text-xs font-bold text-slate-400 uppercase">
                            Tidak ada data QC awal
                        </p>
                    </div>
                {/if}
            </div>

            <!-- QC Akhir -->
            <div class="space-y-4">
                <p
                    class="text-[10px] font-black uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full w-fit border border-emerald-100 text-emerald-600"
                >
                    Hasil Pengerjaan
                </p>
                {#if controller.serviceOrder.phone?.qc?.after}
                    <div
                        class="grid grid-cols-1 gap-2 p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100"
                    >
                        {#each Object.entries(controller.serviceOrder.phone.qc.after) as [key, value]}
                            <div
                                class="flex items-center justify-between text-sm group"
                            >
                                <span
                                    class="text-emerald-900/70 font-bold group-hover:text-emerald-900 transition-colors lowercase"
                                >
                                    {key}
                                </span>
                                {#if value}
                                    <div class="p-1 bg-emerald-500 rounded-lg">
                                        <CheckCircle
                                            class="h-3 w-3 text-white"
                                        />
                                    </div>
                                {:else}
                                    <div class="p-1 bg-rose-500 rounded-lg">
                                        <XCircle class="h-3 w-3 text-white" />
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {:else}
                    <div
                        class="p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center flex flex-col items-center"
                    >
                        <Loader2
                            class="h-8 w-8 text-slate-300 animate-spin mb-2"
                        />
                        <p class="text-xs font-bold text-slate-400 uppercase">
                            Menunggu QC Akhir
                        </p>
                    </div>
                {/if}
            </div>
        </div>

        {#if controller.serviceOrder.phone?.qc?.notes}
            <div
                class="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 italic font-medium text-slate-600 text-sm"
            >
                <span
                    class="not-italic text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2"
                    >Catatan QC Lapangan:</span
                >
                "{controller.serviceOrder.phone.qc.notes}"
            </div>
        {/if}
    </div>
{/if}
