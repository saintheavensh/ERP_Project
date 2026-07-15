<script lang="ts">
    import { Label } from "$lib/shared/components/ui/label";
    import { Textarea } from "$lib/shared/components/ui/textarea";
    import { Badge } from "$lib/shared/components/ui/badge";
    import {
        CheckCircle,
        XCircle,
        ArrowRight,
        AlertCircle,
        ClipboardCheck,
        Minus,
    } from "lucide-svelte";
    import { TicketFormController } from "../../ticket-form.controller.svelte";

    let { form }: { form: TicketFormController } = $props();

    const qcItems = TicketFormController.QC_ITEMS;

    function setQCValue(key: string, value: boolean) {
        form.qcAfter = { ...form.qcAfter, [key]: value };
    }

    function getComparison(
        key: string,
    ): "improved" | "same" | "degraded" | "na" {
        if (!form.canDoInitialQC) return "na";
        const before = form.initialQC[key];
        const after = form.qcAfter[key];
        if (before === undefined || after === undefined) return "na";
        if (!before && after) return "improved";
        if (before && !after) return "degraded";
        return "same";
    }
</script>

<div class="grid gap-8 animate-in fly-in-from-bottom-4 duration-500">
    <!-- Header -->
    <div class="space-y-2">
        <div
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100/50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2"
        >
            <ClipboardCheck class="h-3.5 w-3.5" />
            Langkah 3
        </div>
        <h2 class="text-3xl font-bold tracking-tight text-foreground">
            Quality Control
        </h2>
        <p class="text-muted-foreground text-lg">
            {#if form.canDoInitialQC}
                Cek fungsi awal perangkat sebelum diproses.
            {:else}
                <span
                    class="flex items-center gap-2 text-amber-600 font-medium"
                >
                    <AlertCircle class="h-5 w-5" />
                    Perangkat Mati Total - QC Dilewati
                </span>
            {/if}
        </p>
    </div>

    <!-- QC Checklist Card -->
    <div
        class="relative group rounded-[2rem] border border-white/50 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md shadow-xl overflow-hidden p-6 sm:p-8"
    >
        {#if !form.canDoInitialQC}
            <div
                class="flex flex-col items-center justify-center py-12 text-center space-y-4"
            >
                <div class="p-4 rounded-full bg-amber-50 text-amber-500">
                    <AlertCircle class="h-12 w-12" />
                </div>
                <div class="max-w-md">
                    <h3 class="text-lg font-bold text-foreground">
                        QC Tidak Tersedia
                    </h3>
                    <p class="text-muted-foreground">
                        Kondisi perangkat mati total atau error parah sehingga
                        pengecekan fungsi awal tidak dapat dilakukan.
                    </p>
                </div>
            </div>
        {:else}
            <!-- Headers -->
            <div
                class="hidden sm:grid grid-cols-[1fr_repeat(2,100px)] gap-4 px-4 py-3 bg-slate-50/80 rounded-xl mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground border border-slate-100"
            >
                <span>Fungsi Perangkat</span>
                <span class="text-center">Berfungsi?</span>
                <span class="text-center">Kondisi?</span>
            </div>

            <div class="grid gap-3">
                {#each qcItems as item}
                    <div
                        class="group/item relative flex flex-col sm:grid sm:grid-cols-[1fr_repeat(2,100px)] gap-3 items-center p-3 rounded-xl hover:bg-white/60 transition-colors border border-transparent hover:border-indigo-100"
                    >
                        <!-- Label -->
                        <div class="flex items-center gap-3 w-full sm:w-auto">
                            <div
                                class={form.initialQC[item.key] === true
                                    ? "w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                                    : form.initialQC[item.key] === false
                                      ? "w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                                      : "w-2 h-2 rounded-full bg-slate-200"}
                            ></div>
                            <span
                                class="font-bold text-foreground/80 group-hover/item:text-indigo-700 transition-colors"
                            >
                                {item.label}
                            </span>
                        </div>

                        <!-- Action Buttons -->
                        <div class="flex justify-center gap-2 w-full sm:w-auto">
                            <button
                                type="button"
                                class={`flex-1 sm:flex-none p-2 rounded-lg transition-all ${
                                    form.initialQC[item.key] === true
                                        ? "bg-green-100 text-green-700 ring-2 ring-green-500/20 shadow-sm font-bold scale-105"
                                        : "bg-slate-50 text-slate-400 hover:bg-green-50 hover:text-green-600"
                                }`}
                                onclick={() =>
                                    (form.initialQC = {
                                        ...form.initialQC,
                                        [item.key]: true,
                                    })}
                                title="Berfungsi Baik"
                            >
                                <span class="sr-only">OK</span>
                                <CheckCircle class="h-5 w-5 mx-auto" />
                            </button>
                            <button
                                type="button"
                                class={`flex-1 sm:flex-none p-2 rounded-lg transition-all ${
                                    form.initialQC[item.key] === false
                                        ? "bg-red-100 text-red-700 ring-2 ring-red-500/20 shadow-sm font-bold scale-105"
                                        : "bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                }`}
                                onclick={() =>
                                    (form.initialQC = {
                                        ...form.initialQC,
                                        [item.key]: false,
                                    })}
                                title="Rusak / Bermasalah"
                            >
                                <span class="sr-only">Rusak</span>
                                <XCircle class="h-5 w-5 mx-auto" />
                            </button>
                        </div>

                        <!-- Status Badge -->
                        <div
                            class="flex items-center justify-center w-full sm:w-auto"
                        >
                            {#if form.initialQC[item.key] === true}
                                <Badge
                                    variant="outline"
                                    class="bg-green-50 text-green-700 border-green-200"
                                    >Normal</Badge
                                >
                            {:else if form.initialQC[item.key] === false}
                                <Badge
                                    variant="destructive"
                                    class="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                    >Rusak</Badge
                                >
                            {:else}
                                <div
                                    class="h-0.5 w-4 bg-slate-200 rounded-full"
                                ></div>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>
        {/if}

        <!-- Optional Note -->
        <div class="mt-8 pt-6 border-t border-dashed border-slate-200">
            <Label
                class="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 mb-2 block"
                >Catatan Tambahan (Opsional)</Label
            >
            <Textarea
                bind:value={form.qcNotes}
                placeholder="Misal: Speaker pecah suaranya, Layar ada shadow..."
                class="min-h-[80px] rounded-xl bg-slate-50/50 border-slate-200"
            />
        </div>
    </div>
</div>
