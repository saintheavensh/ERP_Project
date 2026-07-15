<script lang="ts">
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import { Textarea } from "$lib/shared/components/ui/textarea";
    import { User, Phone, MapPin, Contact } from "lucide-svelte";
    import type { TicketFormController } from "../../ticket-form.controller.svelte";
    import { Badge } from "$lib/shared/components/ui/badge";

    let { form }: { form: TicketFormController } = $props();
</script>

<div class="grid gap-8 animate-in fly-in-from-bottom-4 duration-500">
    <div class="space-y-2">
        <div
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-2"
        >
            <User class="h-3.5 w-3.5" />
            Langkah 1
        </div>
        <h2 class="text-3xl font-bold tracking-tight text-foreground">
            Data Pelanggan
        </h2>
        <p class="text-muted-foreground text-lg">
            Siapa yang akan menerima layanan ini?
        </p>
    </div>

    <!-- Glass Card Form -->
    <div
        class="relative group rounded-[2rem] border border-white/50 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md shadow-xl overflow-hidden p-8 transition-all hover:shadow-2xl hover:shadow-blue-500/5"
    >
        <!-- Decoration -->
        <div
            class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-700"
        ></div>

        <div class="grid md:grid-cols-2 gap-8">
            <!-- Name Input -->
            <div class="space-y-4">
                <Label
                    for="name"
                    class="text-sm font-bold text-foreground/80 uppercase tracking-wider ml-1"
                >
                    Nama Lengkap <span class="text-red-500">*</span>
                </Label>
                <div class="relative group/input">
                    <div
                        class="absolute inset-y-0 left-4 flex items-center pointer-events-none"
                    >
                        <User
                            class="h-5 w-5 text-muted-foreground transition-colors group-focus-within/input:text-blue-600"
                        />
                    </div>
                    <Input
                        id="name"
                        bind:value={form.customerName}
                        placeholder="Contoh: Budi Santoso"
                        class="pl-12 h-14 rounded-2xl bg-white/50 dark:bg-slate-950/50 border-slate-200/60 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-lg shadow-sm"
                    />
                </div>
            </div>

            <!-- Phone Input -->
            <div class="space-y-4">
                <div class="flex items-center justify-between ml-1">
                    <Label
                        for="phone"
                        class="text-sm font-bold text-foreground/80 uppercase tracking-wider"
                    >
                        No. WhatsApp / HP
                        {#if !form.isWalkin}<span class="text-red-500">*</span
                            >{/if}
                    </Label>
                    {#if form.isWalkin}
                        <Badge
                            variant="secondary"
                            class="h-5 px-2 text-[10px] font-medium bg-slate-100 text-slate-500"
                            >Opsional</Badge
                        >
                    {/if}
                </div>
                <div class="relative group/input">
                    <div
                        class="absolute inset-y-0 left-4 flex items-center pointer-events-none"
                    >
                        <Phone
                            class="h-5 w-5 text-muted-foreground transition-colors group-focus-within/input:text-blue-600"
                        />
                    </div>
                    <Input
                        id="phone"
                        type="tel"
                        bind:value={form.customerPhone}
                        placeholder="0812-3456-7890"
                        class="pl-12 h-14 rounded-2xl bg-white/50 dark:bg-slate-950/50 border-slate-200/60 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-lg shadow-sm font-mono tracking-wide"
                    />
                </div>
            </div>

            <!-- Address Input (Full Width) -->
            <div class="md:col-span-2 space-y-4">
                <div class="flex items-center justify-between ml-1">
                    <Label
                        for="address"
                        class="text-sm font-bold text-foreground/80 uppercase tracking-wider"
                    >
                        Alamat Domisili
                        {#if form.isWalkin}
                            <span
                                class="text-muted-foreground font-normal text-xs normal-case tracking-normal ml-1"
                                >(Tidak wajib untuk walk-in)</span
                            >
                        {/if}
                    </Label>
                </div>
                <div class="relative group/input">
                    <div
                        class="absolute top-4 left-4 flex items-start pointer-events-none"
                    >
                        <MapPin
                            class="h-5 w-5 text-muted-foreground transition-colors group-focus-within/input:text-blue-600"
                        />
                    </div>
                    <Textarea
                        id="address"
                        bind:value={form.customerAddress}
                        placeholder="Jl. Merdeka No. 45, Kecamatan..."
                        disabled={form.isWalkin}
                        class="pl-12 min-h-[120px] rounded-2xl bg-white/50 dark:bg-slate-950/50 border-slate-200/60 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-blue-500/10 transition-all -visible:ring-offset-0 text-base shadow-sm resize-none py-4 leading-relaxed"
                    />
                </div>
            </div>
        </div>
    </div>

    <div
        class="flex items-start gap-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100 text-blue-700 text-sm"
    >
        <Contact class="h-5 w-5 shrink-0 mt-0.5" />
        <p>
            Pastikan nomor WhatsApp aktif untuk pengiriman notifikasi status
            service otomatis.
        </p>
    </div>
</div>
