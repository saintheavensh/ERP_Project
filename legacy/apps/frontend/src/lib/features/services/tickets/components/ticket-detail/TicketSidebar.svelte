<script lang="ts">
    import { Separator } from "$lib/shared/components/ui/separator";
    import { formatDate } from "$lib/shared/lib/utils";
    import {
        Activity,
        Calendar,
        CheckCircle,
        Clock,
        ShieldCheck,
        User,
        Wrench,
    } from "lucide-svelte";
    import { fade } from "svelte/transition";
    import type { TicketDetailController } from "../../ticket-detail.controller.svelte";

    let { controller }: { controller: TicketDetailController } = $props();
</script>

<aside class="space-y-6">
    <!-- Status & Progress Card -->
    <div
        class="relative overflow-hidden bg-card rounded-[2rem] shadow-lg border-2 border-slate-100 p-6"
    >
        <div class="absolute top-0 right-0 p-4 opacity-5">
            <Activity class="h-16 w-16" />
        </div>

        <h3
            class="font-bold text-sm uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2"
        >
            <Activity class="h-4 w-4" /> Progres Service
        </h3>

        <!-- Status Progress -->
        <div class="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div
                class="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3"
            >
                <span>Check-in</span>
                <span>Target</span>
            </div>
            <div
                class="h-3 bg-slate-200 rounded-full overflow-hidden p-0.5 border shadow-inner"
            >
                <div
                    class="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-1000 ease-out shadow-sm"
                    style="width: {Math.max(
                        5,
                        Math.min(controller.progress, 100),
                    )}%"
                ></div>
            </div>
            <p
                class="text-[10px] font-bold text-center mt-2 text-primary uppercase tracking-tighter"
            >
                {Math.round(controller.progress)}% Selesai
            </p>
        </div>

        <!-- Dates Section -->
        <div class="space-y-4 mb-8">
            <div
                class="flex items-center gap-3 p-3 bg-white rounded-2xl border shadow-sm group hover:border-primary/30 transition-colors"
            >
                <div
                    class="p-2 bg-slate-100 rounded-xl group-hover:bg-primary/10 transition-colors"
                >
                    <Calendar
                        class="h-4 w-4 text-slate-500 group-hover:text-primary"
                    />
                </div>
                <div class="flex flex-col">
                    <span
                        class="text-[10px] font-black uppercase tracking-tighter text-slate-400"
                        >Tgl Masuk</span
                    >
                    <span class="text-xs font-bold"
                        >{formatDate(controller.serviceOrder.dateIn)}</span
                    >
                </div>
            </div>

            {#if controller.serviceOrder.estimatedCompletionDate}
                <div
                    class="flex items-center gap-3 p-3 bg-white rounded-2xl border shadow-sm group hover:border-amber-500/30 transition-colors"
                >
                    <div
                        class="p-2 bg-slate-100 rounded-xl group-hover:bg-amber-500/10 transition-colors"
                    >
                        <Clock
                            class="h-4 w-4 text-slate-500 group-hover:text-amber-600"
                        />
                    </div>
                    <div class="flex flex-col">
                        <span
                            class="text-[10px] font-black uppercase tracking-tighter text-slate-400"
                            >Estimasi Selesai</span
                        >
                        <span class="text-xs font-bold text-amber-600"
                            >{formatDate(
                                controller.serviceOrder.estimatedCompletionDate,
                            )}</span
                        >
                    </div>
                </div>
            {/if}

            {#if controller.serviceOrder.dateOut}
                <div
                    class="flex items-center gap-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm group"
                >
                    <div class="p-2 bg-emerald-500/10 rounded-xl">
                        <CheckCircle class="h-4 w-4 text-emerald-600" />
                    </div>
                    <div class="flex flex-col">
                        <span
                            class="text-[10px] font-black uppercase tracking-tighter text-emerald-400"
                            >Selesai/Keluar</span
                        >
                        <span class="text-xs font-black text-emerald-700"
                            >{formatDate(controller.serviceOrder.dateOut)}</span
                        >
                    </div>
                </div>
            {/if}
        </div>

        <!-- Warranty Badge -->
        {#if controller.serviceOrder.warranty && controller.serviceOrder.warranty !== "Tanpa Garansi" && controller.serviceOrder.warranty !== "none"}
            <div
                class="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[1.5rem] text-white shadow-lg shadow-indigo-100 mb-6"
            >
                <div class="flex items-center gap-2 mb-3">
                    <ShieldCheck class="h-5 w-5" />
                    <span class="text-xs font-black uppercase tracking-widest"
                        >Garansi Aktif</span
                    >
                </div>
                <div class="flex items-end justify-between">
                    <span class="text-2xl font-black"
                        >{controller.serviceOrder.warranty}</span
                    >
                    <div class="text-[10px] font-bold opacity-80 text-right">
                        Sampai<br />{formatDate(
                            controller.serviceOrder.warrantyExpiryDate,
                        ).split(",")[0]}
                    </div>
                </div>
            </div>
        {/if}

        <Separator class="mb-6" />

        <!-- Activity View -->
        <h3
            class="font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2"
        >
            Aktivitas Terkini
        </h3>

        <div
            class="space-y-6 relative before:absolute before:inset-y-0 before:left-[11px] before:w-0.5 before:bg-slate-100"
        >
            {#each (controller.serviceOrder.timeline || [])
                .slice(-3)
                .reverse() as item, i}
                <div class="relative pl-8 group" transition:fade>
                    <div
                        class="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 border-slate-200 group-hover:border-primary transition-colors flex items-center justify-center z-10"
                    >
                        <div
                            class="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-primary transition-colors"
                        ></div>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-xs font-black tracking-tight"
                            >{item.event}</span
                        >
                        <span
                            class="text-[10px] text-slate-400 font-bold uppercase tracking-tighter"
                            >{item.time}</span
                        >
                        {#if item.details?.technician}
                            <div
                                class="mt-1 px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-500 inline-block w-fit uppercase"
                            >
                                {item.details.technician}
                            </div>
                        {/if}
                    </div>
                </div>
            {/each}
            {#if !controller.serviceOrder.timeline?.length}
                <p
                    class="text-[10px] text-slate-400 italic font-bold text-center py-4"
                >
                    Belum ada aktivitas
                </p>
            {/if}
        </div>
    </div>

    <!-- Technician Card -->
    <div
        class="group relative overflow-hidden bg-card rounded-[2rem] shadow-lg border-2 border-slate-100 p-6 hover:border-primary/20 transition-all duration-300"
    >
        <div class="flex items-center justify-between mb-4">
            <h3
                class="font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2"
            >
                <Wrench class="h-4 w-4" /> Teknisi Pengerjaan
            </h3>
        </div>

        <div class="flex items-center gap-4">
            <div class="relative">
                <div
                    class="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden"
                >
                    <User class="h-8 w-8 text-slate-400" />
                </div>
                <!-- svelte-ignore a11y_consider_explicit_label -->
                <div
                    class="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-emerald-500 border-2 border-white flex items-center justify-center"
                >
                    <CheckCircle class="h-3 w-3 text-white" />
                </div>
            </div>
            <div class="flex flex-col">
                <p
                    class="font-black text-lg tracking-tight leading-none mb-1 text-slate-800"
                >
                    {controller.serviceOrder.technician?.name ||
                        "Belum Ditentukan"}
                </p>
                <span
                    class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter"
                >
                    {controller.serviceOrder.technician?.id
                        ? "Teknisi Utama"
                        : "Hubungi Admin"}
                </span>
            </div>
        </div>
    </div>
</aside>
