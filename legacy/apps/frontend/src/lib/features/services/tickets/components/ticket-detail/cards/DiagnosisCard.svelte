<script lang="ts">
    import { AlertTriangle, Wrench, Search, CheckCircle } from "lucide-svelte";
    import type { TicketDetailController } from "../../../ticket-detail.controller.svelte";

    let { controller }: { controller: TicketDetailController } = $props();
</script>

<div class="grid gap-6 md:grid-cols-2">
    <div
        class="bg-card rounded-[2rem] shadow-lg border-2 border-slate-100 p-8 border-l-[6px] border-l-amber-400"
    >
        <h3 class="font-bold text-xl mb-4 flex items-center gap-3">
            <AlertTriangle class="h-6 w-6 text-amber-500" /> Keluhan Utama
        </h3>
        <div
            class="p-4 bg-amber-50 rounded-2xl font-medium text-slate-700 leading-relaxed border border-amber-100"
        >
            "{controller.serviceOrder.complaint || "-"}"
        </div>
    </div>

    {#if controller.serviceOrder.diagnosis && controller.serviceOrder.diagnosis !== "null" && controller.serviceOrder.diagnosis !== "{}"}
        <div
            class="bg-card rounded-[2rem] shadow-lg border-2 border-slate-100 p-8 border-l-[6px] border-l-blue-400"
        >
            <h3 class="font-bold text-xl mb-4 flex items-center gap-3">
                <Wrench class="h-6 w-6 text-blue-500" /> Analisa Teknisi
            </h3>

            {#if controller.serviceOrder.diagnosis}
                {@const diag =
                    typeof controller.serviceOrder.diagnosis === "string"
                        ? controller.serviceOrder.diagnosis.startsWith("{")
                            ? JSON.parse(controller.serviceOrder.diagnosis)
                            : null
                        : controller.serviceOrder.diagnosis}

                {#if diag && typeof diag === "object"}
                    <div class="space-y-4">
                        {#if diag.initial}
                            <div
                                class="p-4 bg-blue-50 rounded-2xl border border-blue-100"
                            >
                                <p class="font-bold text-slate-700">
                                    {diag.initial}
                                </p>
                            </div>
                        {/if}
                        {#if diag.possibleCauses}
                            <div class="px-4">
                                <h4
                                    class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2"
                                >
                                    Kemungkinan Penyebab
                                </h4>
                                <p
                                    class="text-sm font-medium text-slate-600 border-l-2 border-blue-200 pl-4"
                                >
                                    {diag.possibleCauses}
                                </p>
                            </div>
                        {/if}
                    </div>
                {:else}
                    <div
                        class="p-4 bg-blue-50 rounded-2xl border border-blue-100"
                    >
                        <p class="font-bold text-slate-700">
                            {controller.serviceOrder.diagnosis}
                        </p>
                    </div>
                {/if}
            {:else}
                <p class="text-sm text-muted-foreground italic">
                    Belum ada diagnosa
                </p>
            {/if}

            {#if controller.serviceOrder.notes}
                {@const noteParts = controller.serviceOrder.notes.split(
                    "\n\nSparepart Perlu Diganti: ",
                )}
                <div class="mt-6 pt-6 border-t border-dashed border-slate-200">
                    <h4
                        class="font-black text-xs uppercase tracking-[0.2em] text-emerald-600 mb-4 flex items-center gap-2"
                    >
                        <CheckCircle class="h-4 w-4" /> Solusi & Pengerjaan
                    </h4>

                    <div class="space-y-4">
                        {#if noteParts[0]}
                            <div
                                class="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-800 font-bold"
                            >
                                {noteParts[0].trim()}
                            </div>
                        {/if}
                        {#if noteParts[1]}
                            <div
                                class="p-4 bg-slate-50 rounded-2xl border border-slate-100"
                            >
                                <span
                                    class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1"
                                    >Parts Diganti:</span
                                >
                                <p class="font-black text-slate-700">
                                    {noteParts[1].trim()}
                                </p>
                            </div>
                        {/if}
                    </div>
                </div>
            {/if}
        </div>
    {:else}
        <div
            class="bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 p-8 flex flex-col items-center justify-center text-center"
        >
            <div class="p-3 bg-white rounded-2xl mb-4 shadow-sm">
                <Search class="h-8 w-8 text-slate-300" />
            </div>
            <p class="text-sm font-bold text-slate-400 max-w-[200px]">
                Menunggu diagnosa teknisi untuk informasi lebih detail.
            </p>
        </div>
    {/if}
</div>
