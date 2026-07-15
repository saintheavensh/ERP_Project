<script lang="ts">
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import { Button } from "$lib/shared/components/ui/button";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/shared/components/ui/select";
    import { Separator } from "$lib/shared/components/ui/separator";

    import type { TicketFormController } from "../../ticket-form.controller.svelte";
    import { API_URL } from "$lib/shared/lib/api-client";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
    } from "$lib/shared/components/ui/dialog";
    import PatternLock from "$lib/shared/components/ui/pattern-lock.svelte";

    // New Imports for Device Search
    import { ProductsService as InventoryService } from "$lib/features/inventory/products/products.service";
    import {
        BrandsService,
        type Brand,
    } from "$lib/features/inventory/brands/brands.service";
    import { createQuery } from "@tanstack/svelte-query";
    import { Badge } from "$lib/shared/components/ui/badge";
    import {
        CheckCircle,
        Smartphone,
        Grid3X3,
        Camera,
        X,
        Upload,
        Search,
        Loader2,
        Zap,
        Box,
        ScanBarcode,
    } from "lucide-svelte";
    import { cn } from "$lib/shared/lib/utils";
    import { toast } from "svelte-sonner";
    import {
        DEVICE_STATUS_OPTIONS,
        PHYSICAL_CONDITIONS,
        COMPLETENESS_OPTIONS,
    } from "@repo/shared";

    let { form }: { form: TicketFormController } = $props();

    let deviceSearch = $state("");
    let debouncedSearch = $state("");
    let searchTimeout: any;

    $effect(() => {
        const term = deviceSearch;
        if (searchTimeout) clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            debouncedSearch = term;
        }, 300);
    });

    let manualMode = $state(false);
    let manualBrandMode = $state(false);
    let manualColorMode = $state(false);

    $effect(() => {
        if (form.selectedDeviceId) {
            manualMode = false;
        }
    });

    const devicesQuery = createQuery(() => ({
        queryKey: ["devices", debouncedSearch, form.phoneBrand],
        queryFn: () =>
            InventoryService.getDevices(
                debouncedSearch,
                50,
                0,
                form.phoneBrand,
            ),
    }));

    $effect(() => {
        if (devicesQuery.isError) {
            toast.error("Gagal mengambil data perangkat.");
        }
    });

    import type { CreateQueryResult } from "@tanstack/svelte-query";

    const brandsQuery: CreateQueryResult<Brand[], Error> = createQuery(() => ({
        queryKey: ["brands"],
        queryFn: BrandsService.getAll,
    }));

    const isErrorStatus = (status: string) =>
        ["mati_total", "restart", "blank_hitam"].includes(status);

    function handleSavePattern() {
        form.isPatternOpen = false;
    }
</script>

<div class="grid gap-8 animate-in fly-in-from-bottom-4 duration-500">
    <!-- Header -->
    <div class="space-y-2">
        <div
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100/50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 text-xs font-bold uppercase tracking-wider mb-2"
        >
            <Smartphone class="h-3.5 w-3.5" />
            Langkah 2
        </div>
        <h2 class="text-3xl font-bold tracking-tight text-foreground">
            Identitas Perangkat
        </h2>
        <p class="text-muted-foreground text-lg">
            Spesifikasi, kondisi fisik, dan kelengkapan unit.
        </p>
    </div>

    <div class="grid gap-6">
        <!-- 1. Device Selection Card -->
        <div
            class="relative group rounded-[2rem] border border-white/50 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md shadow-xl overflow-visible p-6 sm:p-8 transition-all hover:border-cyan-200"
        >
            {#if form.selectedDeviceId || (manualMode && form.phoneModel)}
                <!-- Selected State -->
                <div
                    class="flex flex-col sm:flex-row gap-6 animate-in fade-in slide-in-from-top-4 duration-500"
                >
                    <div
                        class="w-full sm:w-32 aspect-[3/4] rounded-2xl bg-white border-4 border-white shadow-lg overflow-hidden shrink-0 relative group/img"
                    >
                        {#if form.deviceImage}
                            <img
                                src={form.deviceImage}
                                alt={form.phoneModel}
                                class="w-full h-full object-cover transition-transform group-hover/img:scale-110"
                            />
                        {:else}
                            <div
                                class="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-300"
                            >
                                <Smartphone class="h-10 w-10 mb-2" />
                                <span class="text-[10px] font-bold uppercase"
                                    >No Image</span
                                >
                            </div>
                        {/if}
                    </div>

                    <div class="flex-1 space-y-4">
                        <div class="flex justify-between items-start">
                            <div>
                                <Badge
                                    variant="outline"
                                    class="mb-2 border-cyan-200 bg-cyan-50 text-cyan-700"
                                    >Device Terpilih</Badge
                                >
                                <h3
                                    class="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none"
                                >
                                    {form.phoneBrand} <br />
                                    <span class="text-cyan-600"
                                        >{form.phoneModel}</span
                                    >
                                </h3>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                class="h-8 rounded-full hover:bg-red-50 hover:text-red-600 text-muted-foreground"
                                onclick={() => {
                                    form.selectedDeviceId = null;
                                    form.phoneBrand = "";
                                    form.phoneModel = "";
                                    manualMode = false;
                                    manualBrandMode = false;
                                    manualColorMode = false;
                                    form.phoneColor = "";
                                    form.deviceImage = null;
                                    form.deviceColors = [];
                                }}
                            >
                                <X class="h-4 w-4 mr-1" /> Ganti
                            </Button>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <!-- Color Selector -->
                            <div class="space-y-1.5">
                                <Label
                                    class="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                                    >Warna Unit</Label
                                >
                                {#if form.deviceColors && form.deviceColors.length > 0}
                                    <Select
                                        type="single"
                                        value={manualColorMode
                                            ? "Lainnya"
                                            : form.phoneColor}
                                        onValueChange={(v) => {
                                            if (v === "Lainnya") {
                                                manualColorMode = true;
                                                form.phoneColor = "";
                                            } else {
                                                manualColorMode = false;
                                                form.phoneColor = v;
                                            }
                                        }}
                                    >
                                        <SelectTrigger
                                            class="h-11 rounded-xl bg-white/50 border-slate-200"
                                        >
                                            {form.phoneColor || "Pilih Warna"}
                                        </SelectTrigger>
                                        <SelectContent>
                                            {#each form.deviceColors as color}
                                                <SelectItem value={color}
                                                    >{color}</SelectItem
                                                >
                                            {/each}
                                            <SelectItem value="Lainnya"
                                                >Lainnya...</SelectItem
                                            >
                                        </SelectContent>
                                    </Select>
                                    {#if form.phoneColor === "Lainnya" || manualColorMode}
                                        <Input
                                            bind:value={form.phoneColor}
                                            placeholder="Ketik warna..."
                                            class="h-11 mt-2 rounded-xl bg-white/50"
                                        />
                                    {/if}
                                {:else}
                                    <Input
                                        bind:value={form.phoneColor}
                                        placeholder="Warna (Hitam, Putih...)"
                                        class="h-11 rounded-xl bg-white/50 border-slate-200"
                                    />
                                {/if}
                            </div>
                        </div>
                    </div>
                </div>
            {:else}
                <!-- Search State -->
                <div class="space-y-6">
                    <div class="grid md:grid-cols-2 gap-6">
                        <!-- Brand -->
                        <div class="space-y-2">
                            <Label class="text-sm font-bold ml-1"
                                >Merk Perangkat</Label
                            >
                            {#if manualBrandMode}
                                <div class="flex gap-2 animate-in fade-in">
                                    <Input
                                        bind:value={form.phoneBrand}
                                        placeholder="Ketik Merk..."
                                        class="h-12 rounded-xl"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onclick={() => {
                                            manualBrandMode = false;
                                            form.phoneBrand = "";
                                            manualMode = false;
                                        }}><X class="h-4 w-4" /></Button
                                    >
                                </div>
                            {:else}
                                <Select
                                    type="single"
                                    value={form.phoneBrand}
                                    onValueChange={(v) => {
                                        if (v === "Lainnya") {
                                            manualBrandMode = true;
                                            form.phoneBrand = "";
                                            manualMode = true;
                                        } else {
                                            manualBrandMode = false;
                                            form.phoneBrand = v;
                                        }
                                    }}
                                >
                                    <SelectTrigger
                                        class="h-12 rounded-xl bg-white/50 border-slate-200 text-base"
                                    >
                                        {form.phoneBrand || "Pilih Brand"}
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value=""
                                            >Semua Brand</SelectItem
                                        >
                                        {#if brandsQuery.data}
                                            {#each brandsQuery.data as brand}
                                                <SelectItem value={brand.name}
                                                    >{brand.name}</SelectItem
                                                >
                                            {/each}
                                        {/if}
                                        <Separator class="my-1" />
                                        <SelectItem
                                            value="Lainnya"
                                            class="font-bold text-cyan-600"
                                            >Lainnya (Manual)</SelectItem
                                        >
                                    </SelectContent>
                                </Select>
                            {/if}
                        </div>

                        <!-- Model -->
                        <div class="space-y-2">
                            <div class="flex justify-between items-center px-1">
                                <Label class="text-sm font-bold"
                                    >Model / Tipe</Label
                                >
                                <button
                                    onclick={() => (manualMode = !manualMode)}
                                    class="text-[10px] font-bold text-cyan-600 hover:underline uppercase tracking-wider"
                                >
                                    {manualMode
                                        ? "Cari Database?"
                                        : "Input Manual?"}
                                </button>
                            </div>

                            {#if manualMode}
                                <Input
                                    bind:value={form.phoneModel}
                                    placeholder="Tipe Lengkap..."
                                    class="h-12 rounded-xl bg-orange-50/50 border-orange-200 text-orange-900 placeholder:text-orange-300"
                                />
                            {:else}
                                <div class="relative">
                                    <Search
                                        class="absolute left-4 top-4 h-4 w-4 text-muted-foreground"
                                    />
                                    <input
                                        bind:value={deviceSearch}
                                        placeholder="Cari model..."
                                        class="flex h-12 w-full rounded-xl border border-input bg-white/50 px-3 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all border-slate-200/80"
                                    />
                                    {#if devicesQuery.isLoading}
                                        <Loader2
                                            class="absolute right-4 top-4 h-4 w-4 animate-spin text-muted-foreground"
                                        />
                                    {/if}

                                    {#if deviceSearch.length > 0 && devicesQuery.data}
                                        <div
                                            class="absolute top-14 left-0 right-0 z-50 bg-white rounded-xl shadow-xl border border-slate-100 max-h-[300px] overflow-y-auto animate-in slide-in-from-top-2"
                                        >
                                            {#if devicesQuery.data.length === 0}
                                                <div
                                                    class="p-4 text-center text-sm text-muted-foreground"
                                                >
                                                    Tidak ditemukan. <button
                                                        class="text-cyan-600 font-bold hover:underline"
                                                        onclick={() => {
                                                            manualMode = true;
                                                            form.phoneModel =
                                                                deviceSearch;
                                                            deviceSearch = "";
                                                        }}>Pakai Manual?</button
                                                    >
                                                </div>
                                            {:else}
                                                {#each devicesQuery.data as device}
                                                    <button
                                                        class="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-0"
                                                        onclick={() => {
                                                            form.selectedDeviceId =
                                                                device.id;
                                                            form.phoneBrand =
                                                                device.brand;
                                                            form.phoneModel =
                                                                device.model;
                                                            form.deviceImage =
                                                                device.image ||
                                                                null;
                                                            form.deviceColors =
                                                                device.colors ||
                                                                [];
                                                            deviceSearch = "";
                                                        }}
                                                    >
                                                        <div
                                                            class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0"
                                                        >
                                                            {#if device.image}
                                                                <img
                                                                    src={device.image}
                                                                    alt={device.model}
                                                                    class="w-full h-full object-cover"
                                                                />
                                                            {:else}
                                                                <Smartphone
                                                                    class="h-5 w-5 text-slate-300"
                                                                />
                                                            {/if}
                                                        </div>
                                                        <div>
                                                            <div
                                                                class="font-bold text-sm text-slate-800"
                                                            >
                                                                {device.brand}
                                                                {device.model}
                                                            </div>
                                                        </div>
                                                    </button>
                                                {/each}
                                            {/if}
                                        </div>
                                    {/if}
                                </div>
                            {/if}
                        </div>
                    </div>

                    <!-- Quick Helper Text -->
                    <div
                        class="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100/50 text-xs text-muted-foreground"
                    >
                        <Box class="h-4 w-4" />
                        <span
                            >Database terintegrasi dengan inventory sparepart
                            untuk estimasi yang lebih akurat.</span
                        >
                    </div>
                </div>
            {/if}
        </div>

        <!-- 2. Status & Condition Tiles -->
        <h3
            class="text-sm font-bold uppercase tracking-wider text-muted-foreground mt-4 ml-1"
        >
            Status Awal
        </h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            {#each DEVICE_STATUS_OPTIONS as option}
                <button
                    onclick={() => (form.phoneStatus = option.value)}
                    class={cn(
                        "relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-300 overflow-hidden group",
                        form.phoneStatus === option.value
                            ? `${option.border} ${option.bg} shadow-md`
                            : "border-transparent bg-white/60 hover:bg-white/80 hover:scale-[1.02]",
                    )}
                >
                    {#if form.phoneStatus === option.value}
                        <div
                            class="absolute inset-0 bg-current opacity-5 pointer-events-none"
                        ></div>
                        <CheckCircle
                            class="absolute top-3 right-3 h-5 w-5 text-current animate-in zoom-in"
                        />
                    {/if}
                    <div
                        class={cn(
                            "p-2.5 rounded-full transition-colors",
                            form.phoneStatus === option.value
                                ? "bg-white shadow-sm"
                                : "bg-slate-100 group-hover:bg-white",
                        )}
                    >
                        <Smartphone class={cn("h-6 w-6", option.color)} />
                    </div>
                    <span class="font-bold text-sm">{option.label}</span>
                </button>
            {/each}
        </div>

        <!-- 3. Security & Identifiers -->
        <div
            class="grid md:grid-cols-2 gap-6 p-6 rounded-[2rem] bg-slate-50/50 border border-slate-100/60"
        >
            <div class="space-y-3">
                <Label class="text-xs font-bold uppercase tracking-wider ml-1"
                    >IMEI / S/N (15 Digit)</Label
                >
                <div class="relative">
                    <ScanBarcode
                        class="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground"
                    />
                    <Input
                        bind:value={form.imei}
                        placeholder={isErrorStatus(form.phoneStatus)
                            ? "Boleh kosong (HP Mati)"
                            : "Scan atau ketik..."}
                        disabled={isErrorStatus(form.phoneStatus)}
                        class="pl-12 h-12 rounded-xl border-slate-200 bg-white font-mono tracking-wider focus:ring-cyan-500/20"
                        maxlength={15}
                    />
                </div>
            </div>
            <div class="space-y-3">
                <Label class="text-xs font-bold uppercase tracking-wider ml-1"
                    >Kunci Layar</Label
                >
                <div class="flex gap-2">
                    <Input
                        bind:value={form.pinPattern}
                        placeholder={isErrorStatus(form.phoneStatus)
                            ? "-"
                            : "PIN / Password"}
                        disabled={isErrorStatus(form.phoneStatus)}
                        class="h-12 rounded-xl bg-white border-slate-200 font-mono"
                    />
                    <Button
                        size="icon"
                        class="h-12 w-12 rounded-xl bg-slate-800 text-white hover:bg-slate-700 shadow-sm"
                        disabled={isErrorStatus(form.phoneStatus)}
                        onclick={() => (form.isPatternOpen = true)}
                    >
                        <Grid3X3 class="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>

        <!-- 4. Physical & Completeness -->
        <div class="grid md:grid-cols-2 gap-8">
            <div class="space-y-4">
                <h4 class="text-sm font-bold flex items-center gap-2">
                    <div class="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
                    Kondisi Fisik
                </h4>
                <div class="grid grid-cols-2 gap-2">
                    {#each PHYSICAL_CONDITIONS as item}
                        <label
                            class={cn(
                                "cursor-pointer flex items-center gap-3 p-3 rounded-xl border transition-all",
                                form.physicalConditions.includes(item.v)
                                    ? "bg-cyan-50 border-cyan-200 text-cyan-800 font-medium"
                                    : "bg-white/50 border-transparent hover:bg-white",
                            )}
                        >
                            <input
                                type="checkbox"
                                bind:group={form.physicalConditions}
                                value={item.v}
                                class="rounded border-cyan-300 text-cyan-600 focus:ring-cyan-500"
                            />
                            <span class="text-sm">{item.l}</span>
                        </label>
                    {/each}
                </div>
            </div>

            <div class="space-y-4">
                <h4 class="text-sm font-bold flex items-center gap-2">
                    <div class="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    Kelengkapan
                </h4>
                <div class="grid grid-cols-2 gap-2">
                    {#each COMPLETENESS_OPTIONS as item}
                        <label
                            class={cn(
                                "cursor-pointer flex items-center gap-3 p-3 rounded-xl border transition-all",
                                form.completeness.includes(item.v)
                                    ? "bg-blue-50 border-blue-200 text-blue-800 font-medium"
                                    : "bg-white/50 border-transparent hover:bg-white",
                            )}
                        >
                            <input
                                type="checkbox"
                                bind:group={form.completeness}
                                value={item.v}
                                class="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span class="text-sm">{item.l}</span>
                        </label>
                    {/each}
                </div>
            </div>

            <div class="md:col-span-2">
                <Input
                    bind:value={form.physicalNotes}
                    placeholder="Catatan tambahan kondisi fisik..."
                    class="h-12 rounded-xl bg-white/50 border-slate-200"
                />
            </div>
        </div>

        <!-- 5. Documentation -->
        <div
            class="p-6 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50/50"
        >
            <div class="flex justify-between items-center mb-4">
                <h4 class="font-bold flex items-center gap-2 text-slate-700">
                    <Camera class="h-5 w-5" /> Foto Dokumentasi
                </h4>
                <Badge variant="secondary" class="font-mono text-[10px]"
                    >{form.photos.length}/10</Badge
                >
            </div>

            <div class="flex flex-wrap gap-4">
                <label
                    class="w-24 h-24 sm:w-28 sm:h-28 flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white cursor-pointer hover:bg-cyan-50 hover:border-cyan-200 hover:text-cyan-600 transition-all shadow-sm group"
                >
                    <div
                        class="p-2.5 rounded-full bg-slate-100 group-hover:bg-cyan-100 transition-colors mb-2"
                    >
                        <Upload class="h-5 w-5" />
                    </div>
                    <span class="text-[10px] font-bold uppercase tracking-wide"
                        >Upload</span
                    >
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        class="hidden"
                        onchange={form.handleFileUpload.bind(form)}
                        disabled={form.isUploading}
                    />
                </label>

                {#each form.photos as photo, index}
                    <div
                        class="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-sm group animate-in zoom-in-50"
                    >
                        <img
                            src={`${API_URL}${photo}`}
                            alt="Evidence"
                            class="w-full h-full object-cover"
                        />
                        <button
                            onclick={() => form.removePhoto(index)}
                            class="absolute top-1 right-1 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X class="h-3 w-3" />
                        </button>
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>

<!-- Pattern Lock Dialog -->
<Dialog bind:open={form.isPatternOpen}>
    <DialogContent
        class="sm:max-w-[400px] rounded-3xl border-0 bg-slate-900/95 text-white backdrop-blur-xl"
    >
        <DialogHeader>
            <DialogTitle class="text-xl text-center pt-2"
                >Input Pola</DialogTitle
            >
            <DialogDescription class="text-center text-slate-400"
                >Gambarkan pola kunci layar</DialogDescription
            >
        </DialogHeader>
        <div class="flex flex-col items-center justify-center py-8">
            <PatternLock
                size={260}
                on:change={(e) => form.handlePatternChange(e.detail)}
                bind:value={form.patternPoints}
            />
            <div
                class="mt-6 px-4 py-1.5 rounded-full bg-white/10 text-xs font-mono tracking-[0.2em] font-bold text-cyan-400"
            >
                {form.patternString || "..."}
            </div>
        </div>
        <DialogFooter class="flex gap-2 w-full">
            <Button
                variant="ghost"
                class="flex-1 rounded-xl hover:bg-white/10 hover:text-white"
                onclick={() => {
                    form.patternPoints = [];
                    form.pinPattern = "";
                }}>Reset</Button
            >
            <Button
                class="flex-1 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white border-0"
                onclick={handleSavePattern}>Simpan</Button
            >
        </DialogFooter>
    </DialogContent>
</Dialog>
