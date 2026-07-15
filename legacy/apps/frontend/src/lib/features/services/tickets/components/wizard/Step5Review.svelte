<script lang="ts">
    import { Badge } from "$lib/shared/components/ui/badge";
    import { Separator } from "$lib/shared/components/ui/separator";
    import {
        CheckCircle,
        XCircle,
        AlertCircle,
        FileCheck,
        User,
        Smartphone,
        ClipboardCheck,
        Wrench,
        ShoppingBag,
        ShieldCheck,
    } from "lucide-svelte";
    import type { TicketFormController } from "../../ticket-form.controller.svelte";

    let { form } = $props<{ form: TicketFormController }>();
</script>

<div class="grid gap-8 animate-in fly-in-from-bottom-4 duration-500">
    <!-- Header -->
    <div class="space-y-2">
        <div
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2"
        >
            <FileCheck class="h-3.5 w-3.5" />
            Langkah 5
        </div>
        <h2 class="text-3xl font-bold tracking-tight text-foreground">
            Konfirmasi Akhir
        </h2>
        <p class="text-muted-foreground text-lg">
            Pastikan data sudah benar sebelum tiket dibuat.
        </p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
        <!-- 1. Customer & Device Data -->
        <div class="space-y-6">
            <!-- Customer Card -->
            <div
                class="relative group rounded-3xl border border-white/50 bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm p-6 shadow-sm hover:shadow-md transition-all"
            >
                <div class="flex items-center gap-3 mb-4">
                    <div class="p-2 rounded-xl bg-blue-50 text-blue-600">
                        <User class="h-5 w-5" />
                    </div>
                    <h3 class="font-bold text-lg">Pelanggan</h3>
                </div>

                <div class="space-y-3 pl-2 border-l-2 border-slate-100 ml-3.5">
                    <div class="pl-4">
                        <p
                            class="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                        >
                            Nama
                        </p>
                        <p class="font-medium text-lg">{form.customerName}</p>
                    </div>
                    <div class="pl-4">
                        <p
                            class="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                        >
                            Kontak
                        </p>
                        <p class="font-medium">{form.customerPhone || "-"}</p>
                    </div>
                    <div class="pl-4">
                        <p
                            class="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                        >
                            Alamat
                        </p>
                        <p
                            class="font-medium text-sm leading-relaxed text-muted-foreground"
                        >
                            {form.customerAddress || "-"}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Device Card -->
            <div
                class="relative group rounded-3xl border border-white/50 bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm p-6 shadow-sm hover:shadow-md transition-all"
            >
                <div class="flex items-center gap-3 mb-4">
                    <div class="p-2 rounded-xl bg-cyan-50 text-cyan-600">
                        <Smartphone class="h-5 w-5" />
                    </div>
                    <h3 class="font-bold text-lg">Perangkat</h3>
                </div>

                <div
                    class="grid grid-cols-2 gap-4 pl-2 border-l-2 border-slate-100 ml-3.5"
                >
                    <div class="pl-4 col-span-2">
                        <p
                            class="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                        >
                            Model
                        </p>
                        <p class="font-medium text-lg text-cyan-700">
                            {form.phoneBrand}
                            {form.phoneModel}
                        </p>
                    </div>
                    <div class="pl-4">
                        <p
                            class="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                        >
                            IMEI
                        </p>
                        <p
                            class="font-mono text-sm bg-slate-50 px-2 py-1 rounded inline-block mt-1"
                        >
                            {form.imei || "N/A"}
                        </p>
                    </div>
                    <div class="pl-4">
                        <p
                            class="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                        >
                            Kunci Layar
                        </p>
                        <p
                            class="font-mono text-sm bg-slate-50 px-2 py-1 rounded inline-block mt-1"
                        >
                            {form.pinPattern || "N/A"}
                        </p>
                    </div>
                    <div class="pl-4 col-span-2">
                        <p
                            class="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2"
                        >
                            Kondisi Fisik
                        </p>
                        <div class="flex flex-wrap gap-2">
                            {#each form.physicalConditions as cond}
                                <Badge
                                    variant="outline"
                                    class="text-xs font-normal border-cyan-200 bg-cyan-50 text-cyan-800"
                                    >{cond}</Badge
                                >
                            {/each}
                            {#if form.physicalConditions.length === 0}
                                <span
                                    class="text-sm italic text-muted-foreground"
                                    >-</span
                                >
                            {/if}
                        </div>
                    </div>
                    <div class="pl-4 col-span-2">
                        <p
                            class="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2"
                        >
                            Kelengkapan
                        </p>
                        <div class="flex flex-wrap gap-2">
                            {#each form.completeness as comp}
                                <Badge
                                    variant="outline"
                                    class="text-xs font-normal border-blue-200 bg-blue-50 text-blue-800"
                                    >{comp}</Badge
                                >
                            {/each}
                            {#if form.completeness.length === 0}
                                <span
                                    class="text-sm italic text-muted-foreground"
                                    >Unit Only</span
                                >
                            {/if}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 2. Technical & Service Data -->
        <div class="space-y-6">
            <!-- QC & Complaint Card -->
            <div
                class="relative group rounded-3xl border border-white/50 bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm p-6 shadow-sm hover:shadow-md transition-all"
            >
                <div class="flex items-center gap-3 mb-4">
                    <div class="p-2 rounded-xl bg-amber-50 text-amber-600">
                        <AlertCircle class="h-5 w-5" />
                    </div>
                    <h3 class="font-bold text-lg">Masalah & QC</h3>
                </div>

                <div class="space-y-4">
                    <div
                        class="p-4 rounded-2xl bg-slate-50 border border-slate-100/50"
                    >
                        <p
                            class="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1"
                        >
                            Keluhan Utama
                        </p>
                        <p class="font-medium">{form.complaint}</p>
                    </div>

                    <div>
                        <p
                            class="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2"
                        >
                            Status QC Awal
                        </p>
                        {#if form.canDoInitialQC}
                            <div class="grid grid-cols-2 gap-2">
                                {#each Object.entries(form.initialQC).slice(0, 6) as [key, val]}
                                    <div
                                        class="flex items-center gap-2 text-sm p-2 rounded-lg border bg-white/50"
                                    >
                                        {#if val}
                                            <CheckCircle
                                                class="h-4 w-4 text-green-500"
                                            />
                                        {:else}
                                            <XCircle
                                                class="h-4 w-4 text-red-500"
                                            />
                                        {/if}
                                        <span
                                            class="capitalize text-xs font-medium truncate"
                                            >{key
                                                .replace(/([A-Z])/g, " $1")
                                                .trim()}</span
                                        >
                                    </div>
                                {/each}
                                {#if Object.keys(form.initialQC).length > 6}
                                    <div
                                        class="col-span-2 text-center text-xs text-muted-foreground italic"
                                    >
                                        + {Object.keys(form.initialQC).length -
                                            6} item lainnya
                                    </div>
                                {/if}
                            </div>
                        {:else}
                            <div
                                class="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100"
                            >
                                <AlertCircle class="h-4 w-4" />
                                <span class="text-sm font-medium"
                                    >QC Dilewati (Mati Total)</span
                                >
                            </div>
                        {/if}
                    </div>

                    {#if form.photos.length > 0}
                        <div>
                            <p
                                class="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2"
                            >
                                Foto ({form.photos.length})
                            </p>
                            <div class="flex gap-2 overflow-x-auto pb-2">
                                {#each form.photos as photo}
                                    <img
                                        src={photo}
                                        alt="Device"
                                        class="h-16 w-16 object-cover rounded-xl border-2 border-white shadow-sm"
                                    />
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Walk-in Summary (Conditional) -->
            {#if form.isWalkin}
                <div
                    class="relative group rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white backdrop-blur-sm p-6 shadow-sm hover:shadow-md transition-all"
                >
                    <div class="flex items-center gap-3 mb-4">
                        <div
                            class="p-2 rounded-xl bg-emerald-100 text-emerald-600"
                        >
                            <ShoppingBag class="h-5 w-5" />
                        </div>
                        <h3 class="font-bold text-lg text-emerald-950">
                            Detail Biaya
                        </h3>
                    </div>

                    <div class="space-y-3">
                        <div class="flex justify-between text-sm">
                            <span class="text-muted-foreground"
                                >Jasa Service</span
                            >
                            <span class="font-medium"
                                >Rp {form.walkinServiceFee.toLocaleString()}</span
                            >
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-muted-foreground"
                                >Total Sparepart</span
                            >
                            <span class="font-medium"
                                >Rp {form.totalPartPrice.toLocaleString()}</span
                            >
                        </div>
                        {#if form.extPartBuyPrice > 0}
                            <div class="flex justify-between text-sm">
                                <span class="text-muted-foreground"
                                    >Part Luar</span
                                >
                                <span class="font-medium"
                                    >Rp {form.extPartBuyPrice.toLocaleString()}</span
                                >
                            </div>
                        {/if}
                        <Separator class="bg-emerald-200/50" />
                        <div
                            class="flex justify-between items-center bg-white p-3 rounded-xl border border-emerald-100 shadow-sm"
                        >
                            <span class="font-bold text-emerald-800"
                                >Grand Total</span
                            >
                            <span class="text-xl font-black text-emerald-600"
                                >Rp {form.grandTotal.toLocaleString()}</span
                            >
                        </div>

                        <div
                            class="mt-4 flex items-center justify-between text-xs text-muted-foreground bg-slate-50 p-2 rounded-lg"
                        >
                            <div class="flex items-center gap-1.5">
                                <ShieldCheck
                                    class="h-3.5 w-3.5 text-emerald-500"
                                />
                                <span>Garansi:</span>
                            </div>
                            <span class="font-bold text-emerald-700"
                                >{form.warranty === "none"
                                    ? "Tidak Ada"
                                    : form.warranty}</span
                            >
                        </div>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>
