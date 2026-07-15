<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import { Textarea } from "$lib/shared/components/ui/textarea";
    import {
        Loader2,
        Save,
        Store,
        UploadCloud,
        FileText,
        LayoutTemplate,
        Receipt,
        MapPin,
        Phone,
        Mail,
        Instagram,
        Image as ImageIcon,
        AlertCircle,
    } from "lucide-svelte";
    import { onMount } from "svelte";
    import { SettingsController } from "$lib/features/settings/settings.controller.svelte";

    const controller = new SettingsController();

    onMount(() => {
        controller.loadStoreInfo();
    });
</script>

<div class="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
    <!-- Header -->
    <div
        class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-sm"
    >
        <div class="flex items-center gap-4">
            <div
                class="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl text-white shadow-lg shadow-blue-500/20"
            >
                <Store class="h-8 w-8" />
            </div>
            <div>
                <h1
                    class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-indigo-400"
                >
                    Pengaturan Toko
                </h1>
                <p class="text-muted-foreground text-sm font-medium">
                    Kelola identitas dan branding outlet Anda.
                </p>
            </div>
        </div>
        <div class="flex gap-3">
            <Button
                onclick={() => controller.saveStoreInfo()}
                disabled={controller.saving || controller.loading}
                size="lg"
                class="rounded-xl shadow-lg shadow-blue-500/20 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
                {#if controller.saving}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                {:else}
                    <Save class="mr-2 h-4 w-4" />
                    Simpan Perubahan
                {/if}
            </Button>
        </div>
    </div>

    {#if controller.loading}
        <div class="flex justify-center py-20">
            <Loader2 class="h-10 w-10 animate-spin text-indigo-500" />
        </div>
    {:else}
        <div class="grid lg:grid-cols-[1.5fr_1fr] gap-8 items-start">
            <!-- Left Column: Form -->
            <div class="space-y-6">
                <!-- 1. Identitas Brand -->
                <div
                    class="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/20 shadow-sm p-6 sm:p-8 space-y-6 relative overflow-hidden group"
                >
                    <div
                        class="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full -mr-8 -mt-8 pointer-events-none"
                    ></div>
                    <div class="flex items-center gap-3 mb-4">
                        <div
                            class="p-2 bg-indigo-50 text-indigo-600 rounded-lg"
                        >
                            <LayoutTemplate class="h-5 w-5" />
                        </div>
                        <h3 class="font-bold text-lg text-foreground">
                            Identitas Brand & Logo
                        </h3>
                    </div>

                    <div
                        class="bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl p-4 border border-dashed border-slate-200 flex flex-col sm:flex-row gap-6 items-center"
                    >
                        <div
                            class="relative group/logo w-32 h-32 flex-shrink-0"
                        >
                            {#if controller.storeInfo.logo}
                                <img
                                    src={controller.storeInfo.logo}
                                    alt="Store Logo"
                                    class="w-full h-full object-contain rounded-xl bg-white border shadow-sm"
                                />
                                <div
                                    class="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center"
                                >
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        class="rounded-full h-8 w-8"
                                        onclick={() =>
                                            (controller.storeInfo.logo = "")}
                                    >
                                        <Loader2 class="h-4 w-4" />
                                        <!-- Trash Icon substitute logic, lucide import issue on quick fix but using existing logic is fine -->
                                        X
                                    </Button>
                                </div>
                            {:else}
                                <div
                                    class="w-full h-full rounded-xl bg-white border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground gap-2"
                                >
                                    <ImageIcon class="h-8 w-8 opacity-20" />
                                    <span
                                        class="text-[10px] uppercase font-bold text-center px-2"
                                        >No Logo</span
                                    >
                                </div>
                            {/if}
                        </div>

                        <div class="flex-1 w-full space-y-3">
                            <div>
                                <Label for="logo-upload" class="sr-only"
                                    >Upload Logo</Label
                                >
                                <div class="relative">
                                    <Input
                                        id="logo-upload"
                                        type="file"
                                        accept="image/*"
                                        class="pl-10 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                        onchange={(e) =>
                                            controller.handleLogoUpload(e)}
                                    />
                                    <UploadCloud
                                        class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointing-events-none"
                                    />
                                </div>
                            </div>
                            <div
                                class="text-xs text-muted-foreground space-y-1"
                            >
                                <p class="flex items-center gap-1.5">
                                    <LayoutTemplate
                                        class="h-3 w-3 text-indigo-500"
                                    /> Icon Aplikasi (Sidebar)
                                </p>
                                <p class="flex items-center gap-1.5">
                                    <Receipt class="h-3 w-3 text-indigo-500" /> Header
                                    Nota Transaksi
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-2">
                        <Label class="text-base font-semibold"
                            >Nama Toko <span class="text-red-500">*</span
                            ></Label
                        >
                        <Input
                            bind:value={controller.storeInfo.name}
                            placeholder="Nama Bisnis Anda"
                            class="h-12 bg-white/50 text-lg font-bold"
                        />
                        <p class="text-xs text-muted-foreground">
                            Ditampilkan di Header Aplikasi & Judul Nota.
                        </p>
                    </div>
                </div>

                <!-- 2. Kontak & Lokasi -->
                <div
                    class="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/20 shadow-sm p-6 sm:p-8 space-y-6 relative overflow-hidden"
                >
                    <div class="flex items-center gap-3 mb-4">
                        <div
                            class="p-2 bg-emerald-50 text-emerald-600 rounded-lg"
                        >
                            <MapPin class="h-5 w-5" />
                        </div>
                        <h3 class="font-bold text-lg text-foreground">
                            Kontak & Lokasi
                        </h3>
                    </div>

                    <div class="grid md:grid-cols-2 gap-6">
                        <div class="space-y-2">
                            <Label
                                >No. Telepon / WhatsApp <span
                                    class="text-red-500">*</span
                                ></Label
                            >
                            <div class="relative">
                                <Phone
                                    class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                                />
                                <Input
                                    bind:value={controller.storeInfo.phone}
                                    class="pl-10 bg-white/50"
                                    placeholder="0812-xxxx-xxxx"
                                />
                            </div>
                        </div>
                        <div class="space-y-2">
                            <Label>Email (Opsional)</Label>
                            <div class="relative">
                                <Mail
                                    class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                                />
                                <Input
                                    bind:value={controller.storeInfo.email}
                                    class="pl-10 bg-white/50"
                                    placeholder="admin@store.com"
                                />
                            </div>
                        </div>
                    </div>

                    <div class="space-y-2">
                        <Label>Alamat Lengkap</Label>
                        <Textarea
                            bind:value={controller.storeInfo.address}
                            rows={3}
                            class="bg-white/50 leading-relaxed"
                            placeholder="Alamat lengkap toko untuk ditampilkan di nota..."
                        />
                    </div>

                    <div class="space-y-2">
                        <Label>Social Media / Footer Note</Label>
                        <div class="relative">
                            <Instagram
                                class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                            />
                            <Input
                                bind:value={controller.storeInfo.socialMedia}
                                class="pl-10 bg-white/50"
                                placeholder="@instagram_toko / Terima Kasih"
                            />
                        </div>
                        <p class="text-xs text-muted-foreground">
                            Text ini akan muncul di bagian paling bawah nota
                            (Footer).
                        </p>
                    </div>
                </div>
            </div>

            <!-- Right Column: Explainer / Preview -->
            <div class="space-y-6 lg:sticky lg:top-8">
                <div
                    class="bg-indigo-900 text-white rounded-[2rem] p-6 shadow-xl relative overflow-hidden group"
                >
                    <!-- Decoration -->
                    <div
                        class="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
                    ></div>

                    <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
                        <Receipt class="h-5 w-5 text-indigo-300" />
                        Preview Struktur Nota
                    </h3>

                    <div
                        class="bg-white text-slate-800 p-6 rounded-xl font-mono text-xs shadow-lg space-y-4 opacity-95 relative z-10"
                    >
                        <!-- Header -->
                        <div
                            class="text-center space-y-2 border-b border-dashed border-slate-300 pb-4"
                        >
                            {#if controller.storeInfo.logo}
                                <div
                                    class="mx-auto w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center p-1"
                                >
                                    <img
                                        src={controller.storeInfo.logo}
                                        class="max-w-full max-h-full"
                                        alt="logo"
                                    />
                                </div>
                            {:else}
                                <div
                                    class="mx-auto w-8 h-8 bg-slate-200 rounded-full"
                                ></div>
                            {/if}

                            <div
                                class="font-bold text-base uppercase animate-pulse duration-1000"
                                style:animation-duration="2s"
                            >
                                {controller.storeInfo.name || "[NAMA TOKO]"}
                            </div>
                            <div class="text-slate-500 leading-tight">
                                {controller.storeInfo.address ||
                                    "[Alamat Toko]"}
                            </div>
                            <div class="text-slate-500">
                                {controller.storeInfo.phone || "[No. Telp]"}
                            </div>
                        </div>

                        <!-- Body Dummy -->
                        <div class="space-y-2 py-2">
                            <div class="flex justify-between">
                                <span>No. Nota</span>
                                <span>INV/001</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Tanggal</span>
                                <span
                                    >{new Date().toLocaleDateString(
                                        "id-ID",
                                    )}</span
                                >
                            </div>
                            <div
                                class="border-t border-dashed border-slate-300 my-2"
                            ></div>
                            <div class="flex justify-between font-bold">
                                <span>TOTAL</span>
                                <span>Rp 150.000</span>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div
                            class="text-center border-t border-dashed border-slate-300 pt-4 text-slate-500 italic"
                        >
                            {controller.storeInfo.socialMedia ||
                                "[Social Media / Footer Info]"}
                        </div>
                    </div>

                    <div class="mt-6 text-indigo-200 text-sm space-y-2">
                        <p class="flex items-start gap-2">
                            <AlertCircle class="h-4 w-4 mt-0.5 shrink-0" />
                            <span
                                >Perubahan data toko akan langsung berefek pada
                                semua nota baru yang dicetak.</span
                            >
                        </p>
                    </div>
                </div>

                <!-- Info Cards -->
                <div
                    class="bg-white/40 border border-white/20 rounded-3xl p-6 backdrop-blur-sm space-y-4"
                >
                    <h4
                        class="font-bold text-sm uppercase tracking-wider text-muted-foreground"
                    >
                        Keterangan Field
                    </h4>
                    <ul class="space-y-3 text-sm">
                        <li class="flex gap-3">
                            <div
                                class="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-lg h-fit text-blue-600 dark:text-blue-400"
                            >
                                <LayoutTemplate class="h-3.5 w-3.5" />
                            </div>
                            <div>
                                <strong class="block text-foreground"
                                    >Header Aplikasi</strong
                                >
                                <span class="text-muted-foreground"
                                    >Nama Toko akan muncul di pojok kiri atas
                                    aplikasi.</span
                                >
                            </div>
                        </li>
                        <li class="flex gap-3">
                            <div
                                class="p-1.5 bg-green-100 dark:bg-green-900 rounded-lg h-fit text-green-600 dark:text-green-400"
                            >
                                <FileText class="h-3.5 w-3.5" />
                            </div>
                            <div>
                                <strong class="block text-foreground"
                                    >Kop Nota</strong
                                >
                                <span class="text-muted-foreground"
                                    >Logo, Alamat, dan No. HP menjadi identitas
                                    utama di struk belanja.</span
                                >
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    {/if}
</div>
