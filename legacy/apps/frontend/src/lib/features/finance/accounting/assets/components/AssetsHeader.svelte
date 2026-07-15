<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import { Label } from "$lib/shared/components/ui/label";
    import { Input } from "$lib/shared/components/ui/input";
    import {
        Dialog,
        DialogContent,
        DialogTrigger,
    } from "$lib/shared/components/ui/dialog";
    import {
        ChevronRight,
        History,
        Calculator,
        Info,
        Loader2,
    } from "lucide-svelte";
    import type { AssetsController } from "../assets.controller.svelte";

    let { controller }: { controller: AssetsController } = $props();
</script>

<div>
    <div class="flex items-center gap-2 text-slate-500 text-sm mb-1">
        <a href="/accounting" class="hover:text-blue-600">Akuntansi</a>
        <ChevronRight class="h-4 w-4" />
        <span class="text-slate-900 font-medium">Aset & Penyusutan</span>
    </div>
    <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
        Aset Tetap
    </h1>
</div>

<div class="flex items-center gap-3">
    <Dialog bind:open={controller.showDeprDialog}>
        <DialogTrigger>
            <Button
                variant="outline"
                class="group/btn gap-2 h-11 px-6 rounded-2xl border-orange-200 hover:border-orange-500 hover:bg-orange-50 text-orange-700 transition-all"
            >
                <History
                    class="h-4 w-4 group-hover/btn:rotate-180 transition-transform duration-500"
                />
                Proses Penyusutan
            </Button>
        </DialogTrigger>
        <DialogContent
            class="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl"
        >
            <div class="h-1.5 bg-orange-500"></div>
            <div class="p-8 space-y-6">
                <div class="space-y-2">
                    <h3 class="text-xl font-bold flex items-center gap-2">
                        <Calculator class="h-5 w-5 text-orange-500" />
                        Posting Penyusutan Bulanan
                    </h3>
                    <p class="text-sm text-slate-500 leading-relaxed">
                        Tindakan ini akan mencatat <strong
                            >Beban Penyusutan</strong
                        >
                        untuk semua aset aktif pada periode yang dipilih ke dalam
                        jurnal.
                    </p>
                </div>

                <div class="space-y-2">
                    <Label
                        class="text-xs font-bold text-slate-400 uppercase tracking-widest"
                        >Pilih Periode (Bulan/Tahun)</Label
                    >
                    <Input
                        type="month"
                        bind:value={controller.deprPeriod}
                        class="h-12 rounded-xl border-slate-200 focus:ring-orange-500"
                    />
                </div>

                <div
                    class="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex gap-3"
                >
                    <Info class="h-5 w-5 text-orange-600 shrink-0" />
                    <div class="text-[11px] text-orange-800 leading-normal">
                        <p class="font-bold mb-1 underline">
                            Mengapa ini perlu dilakukan?
                        </p>
                        Setiap bulan, nilai aset berkurang karena pemakaian. Beban
                        ini dicatat agar laba rugi akurat.
                    </div>
                </div>

                <div class="flex gap-3">
                    <Button
                        variant="ghost"
                        class="flex-1 rounded-xl h-11"
                        onclick={() => (controller.showDeprDialog = false)}
                    >
                        Batal
                    </Button>
                    <Button
                        disabled={controller.processingDepr}
                        class="flex-1 rounded-xl h-11 bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-100"
                        onclick={controller.handleProcessDepreciation}
                    >
                        {#if controller.processingDepr}
                            <Loader2 class="h-4 w-4 animate-spin mr-2" />
                            Memproses...
                        {:else}
                            Posting Sekarang
                        {/if}
                    </Button>
                </div>
            </div>
        </DialogContent>
    </Dialog>
</div>
