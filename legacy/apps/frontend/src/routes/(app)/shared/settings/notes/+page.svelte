<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import { Separator } from "$lib/shared/components/ui/separator";
    import { Switch } from "$lib/shared/components/ui/switch";
    import { Textarea } from "$lib/shared/components/ui/textarea";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/shared/components/ui/select";
    import { toast } from "svelte-sonner";
    import {
        Loader2,
        Save,
        Receipt,
        Printer,
        AlignLeft,
        FileText,
        Info,
        CheckCircle2,
    } from "lucide-svelte";
    import { onMount } from "svelte";
    import {
        SettingsService,
        type ReceiptSettings,
        type StoreInfo,
        PRINTER_TYPES,
        PAPER_SIZES,
    } from "$lib/features/settings/settings.service";
    import { settingsStore } from "$lib/features/settings/settings-store.svelte";
    import { cn } from "$lib/shared/lib/utils";

    let settings = $state<ReceiptSettings>({
        showLogo: true,
        headerText: "",
        footerText: "",
        termsConditions: "",
        showCustomerPhone: true,
        showCustomerAddress: false,
        showImei: true,
        showSparepartDetails: false,
        showTechnicianName: true,
        showWarrantyInfo: true,
        showBarcode: true,
        printerType: "thermal",
        paperSize: "58mm",
        printCopies: 1,
    });

    let storeInfo = $state<StoreInfo>({
        name: "Store Name",
        address: "Store Address",
        phone: "000-000",
        logo: "",
        email: "",
        socialMedia: "",
    });

    let loading = $state(true);
    let saving = $state(false);

    let availablePaperSizes = $derived(
        PAPER_SIZES[settings.printerType as keyof typeof PAPER_SIZES] ||
            PAPER_SIZES.thermal,
    );
    // Track previous printer type to detect changes
    let previousPrinterType = $state<"thermal" | "inkjet" | "dotmatrix">(
        "thermal",
    );

    $effect(() => {
        if (settings.printerType !== previousPrinterType) {
            previousPrinterType = settings.printerType;
            const sizes =
                PAPER_SIZES[settings.printerType as keyof typeof PAPER_SIZES] ||
                PAPER_SIZES.thermal;
            if (sizes.length > 0) {
                settings.paperSize = sizes[0].id; // Reset to first available size
            }
        }
    });

    onMount(async () => {
        try {
            const [receiptData, storeData] = await Promise.all([
                SettingsService.getReceiptSettings(),
                SettingsService.getStoreInfo(),
            ]);
            if (receiptData) settings = { ...settings, ...receiptData };
            if (storeData) storeInfo = storeData;
        } catch (e) {
            console.error(e);
            toast.error("Gagal memuat pengaturan");
        } finally {
            loading = false;
        }
    });

    async function save() {
        saving = true;
        try {
            await SettingsService.setReceiptSettings(settings);
            await settingsStore.refresh();
            toast.success("Pengaturan nota disimpan!");
        } catch (e) {
            toast.error("Gagal menyimpan pengaturan");
        } finally {
            saving = false;
        }
    }
</script>

<div class="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
    <!-- Header -->
    <div
        class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-sm"
    >
        <div class="flex items-center gap-4">
            <div
                class="p-3 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-2xl text-white shadow-lg shadow-violet-500/20"
            >
                <Receipt class="h-8 w-8" />
            </div>
            <div>
                <h1
                    class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400"
                >
                    Desain Nota
                </h1>
                <p class="text-muted-foreground text-sm font-medium">
                    Atur tampilan struk dan layout cetak.
                </p>
            </div>
        </div>
        <div class="flex gap-3">
            <Button
                onclick={save}
                disabled={saving || loading}
                size="lg"
                class="rounded-xl shadow-lg shadow-violet-500/20 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 transition-all hover:scale-[1.02]"
            >
                {#if saving}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                {:else}
                    <Save class="mr-2 h-4 w-4" />
                    Simpan Layout
                {/if}
            </Button>
        </div>
    </div>

    {#if loading}
        <div class="flex justify-center py-20">
            <Loader2 class="h-10 w-10 animate-spin text-violet-500" />
        </div>
    {:else}
        <div class="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-start">
            <!-- Left: Settings Form -->
            <div class="space-y-6">
                <!-- 1. Header & Branding -->
                <div
                    class="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/20 shadow-sm p-6 space-y-6"
                >
                    <div class="flex items-center gap-3 mb-2">
                        <div
                            class="p-2 bg-violet-50 text-violet-600 rounded-lg"
                        >
                            <AlignLeft class="h-5 w-5" />
                        </div>
                        <h3 class="font-bold text-lg">Header Nota</h3>
                    </div>

                    <div class="grid gap-4">
                        <div
                            class="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-slate-100"
                        >
                            <div>
                                <Label class="text-base font-semibold"
                                    >Tampilkan Logo Toko</Label
                                >
                                <p class="text-xs text-muted-foreground">
                                    Logo diambil dari Pengaturan Toko.
                                </p>
                            </div>
                            <Switch bind:checked={settings.showLogo} />
                        </div>

                        <div class="space-y-2">
                            <Label>Teks Tambahan Header</Label>
                            <Textarea
                                bind:value={settings.headerText}
                                placeholder="Contoh: Pusat Service HP Terpercaya"
                                class="bg-white/50"
                                rows={2}
                            />
                            <p class="text-[10px] text-muted-foreground">
                                Opsi: Slogan atau info cabang.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- 2. Konten Transaksi -->
                <div
                    class="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/20 shadow-sm p-6 space-y-6"
                >
                    <div class="flex items-center gap-3 mb-2">
                        <div class="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <FileText class="h-5 w-5" />
                        </div>
                        <h3 class="font-bold text-lg">Detail Transaksi</h3>
                    </div>

                    <div class="grid gap-3">
                        <Label
                            class="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2"
                            >Informasi Customer</Label
                        >
                        <div class="grid sm:grid-cols-2 gap-3">
                            <div
                                class="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-slate-100"
                            >
                                <Label class="cursor-pointer" for="sw-phone"
                                    >No. HP</Label
                                >
                                <Switch
                                    id="sw-phone"
                                    bind:checked={settings.showCustomerPhone}
                                />
                            </div>
                            <div
                                class="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-slate-100"
                            >
                                <Label class="cursor-pointer" for="sw-address"
                                    >Alamat</Label
                                >
                                <Switch
                                    id="sw-address"
                                    bind:checked={settings.showCustomerAddress}
                                />
                            </div>
                        </div>

                        <Label
                            class="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-4 mb-2"
                            >Detail Unit & Service</Label
                        >
                        <div class="grid sm:grid-cols-2 gap-3">
                            <div
                                class="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-slate-100"
                            >
                                <Label class="cursor-pointer" for="sw-imei"
                                    >Info IMEI/Serial</Label
                                >
                                <Switch
                                    id="sw-imei"
                                    bind:checked={settings.showImei}
                                />
                            </div>
                            <div
                                class="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-slate-100"
                            >
                                <Label class="cursor-pointer" for="sw-tech"
                                    >Nama Teknisi</Label
                                >
                                <Switch
                                    id="sw-tech"
                                    bind:checked={settings.showTechnicianName}
                                />
                            </div>
                            <div
                                class="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-slate-100 sm:col-span-2"
                            >
                                <div>
                                    <Label class="cursor-pointer" for="sw-parts"
                                        >Rincian Harga Sparepart</Label
                                    >
                                    <p class="text-[10px] text-slate-500">
                                        Aktifkan untuk menampilkan harga
                                        per-item. Jika mati, hanya total yang
                                        muncul.
                                    </p>
                                </div>
                                <Switch
                                    id="sw-parts"
                                    bind:checked={settings.showSparepartDetails}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 3. Footer & Legal -->
                <div
                    class="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/20 shadow-sm p-6 space-y-6"
                >
                    <div class="flex items-center gap-3 mb-2">
                        <div
                            class="p-2 bg-emerald-50 text-emerald-600 rounded-lg"
                        >
                            <Info class="h-5 w-5" />
                        </div>
                        <h3 class="font-bold text-lg">Footer & Legal</h3>
                    </div>

                    <div class="space-y-4">
                        <div
                            class="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-slate-100"
                        >
                            <div>
                                <Label class="font-semibold">Info Garansi</Label
                                >
                                <p class="text-xs text-muted-foreground">
                                    Box garansi standard di bawah total.
                                </p>
                            </div>
                            <Switch bind:checked={settings.showWarrantyInfo} />
                        </div>

                        <div class="space-y-2">
                            <Label>Ucapan Penutup (Footer)</Label>
                            <Textarea
                                bind:value={settings.footerText}
                                placeholder="Terima kasih atas kunjungan Anda"
                                class="bg-white/50"
                                rows={2}
                            />
                        </div>

                        <div class="space-y-2">
                            <Label>Syarat & Ketentuan (Kecil)</Label>
                            <Textarea
                                bind:value={settings.termsConditions}
                                placeholder="Barang yang dibeli tidak dapat ditukar..."
                                class="bg-white/50 text-xs"
                                rows={3}
                            />
                            <p class="text-[10px] text-muted-foreground">
                                Teks kecil di bagian paling bawah nota.
                            </p>
                        </div>

                        <Separator />

                        <div
                            class="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-slate-100"
                        >
                            <div>
                                <Label class="font-semibold">QR Barcode</Label>
                                <p class="text-xs text-muted-foreground">
                                    Barcode No. Service untuk scan cepat.
                                </p>
                            </div>
                            <Switch bind:checked={settings.showBarcode} />
                        </div>
                    </div>
                </div>

                <!-- 4. Hardware Config -->
                <div
                    class="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md rounded-3xl border border-slate-200/50 shadow-inner p-6 space-y-6"
                >
                    <div class="flex items-center gap-3 mb-2">
                        <div class="p-2 bg-slate-200 text-slate-700 rounded-lg">
                            <Printer class="h-5 w-5" />
                        </div>
                        <h3 class="font-bold text-lg">Konfigurasi Printer</h3>
                    </div>

                    <div class="grid sm:grid-cols-3 gap-4">
                        <div class="space-y-2">
                            <Label>Tipe Printer</Label>
                            <Select
                                type="single"
                                bind:value={settings.printerType}
                            >
                                <SelectTrigger class="bg-white">
                                    {PRINTER_TYPES.find(
                                        (p) => p.id === settings.printerType,
                                    )?.label || "Pilih"}
                                </SelectTrigger>
                                <SelectContent>
                                    {#each PRINTER_TYPES as pt}
                                        <SelectItem value={pt.id}
                                            >{pt.label}</SelectItem
                                        >
                                    {/each}
                                </SelectContent>
                            </Select>
                        </div>
                        <div class="space-y-2">
                            <Label>Ukuran Kertas</Label>
                            <Select
                                type="single"
                                bind:value={settings.paperSize}
                            >
                                <SelectTrigger class="bg-white">
                                    {availablePaperSizes.find(
                                        (p) => p.id === settings.paperSize,
                                    )?.label || settings.paperSize}
                                </SelectTrigger>
                                <SelectContent>
                                    {#each availablePaperSizes as ps}
                                        <SelectItem value={ps.id}
                                            >{ps.label}</SelectItem
                                        >
                                    {/each}
                                </SelectContent>
                            </Select>
                        </div>
                        <div class="space-y-2">
                            <Label>Copies</Label>
                            <Input
                                type="number"
                                bind:value={settings.printCopies}
                                min={1}
                                max={3}
                                class="bg-white"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Live Preview -->
            <div class="lg:sticky lg:top-8 space-y-4">
                <div class="flex items-center justify-between px-2">
                    <h3 class="font-bold text-lg flex items-center gap-2">
                        <CheckCircle2 class="h-5 w-5 text-green-500" /> Live Preview
                    </h3>
                    <span
                        class="text-xs text-muted-foreground font-mono bg-slate-100 px-2 py-1 rounded"
                        >Scale: 100%</span
                    >
                </div>

                <div
                    class="bg-slate-200/50 dark:bg-slate-800/50 p-8 rounded-[2rem] border-4 border-dashed border-slate-300 flex justify-center overflow-x-auto"
                >
                    <div
                        class="bg-white text-slate-900 shadow-2xl transition-all duration-300 ease-in-out font-mono text-[10px] leading-tight flex-shrink-0 relative group print-preview"
                        style="width: {settings.paperSize === '80mm'
                            ? '290px'
                            : settings.paperSize === '58mm'
                              ? '200px'
                              : '360px'}; min-height: 400px; padding: 16px;"
                    >
                        <!-- Fold effect decoration -->
                        <div
                            class="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-slate-100 to-transparent pointer-events-none"
                        ></div>

                        <!-- HEADER -->
                        <div class="text-center space-y-1 mb-3">
                            {#if settings.showLogo}
                                <div class="flex justify-center mb-2">
                                    {#if storeInfo.logo}
                                        <img
                                            src={storeInfo.logo}
                                            alt="Logo"
                                            class="max-h-12 max-w-[80%] object-contain grayscale opacity-90"
                                        />
                                    {:else}
                                        <div
                                            class="h-10 w-10 bg-slate-800 text-white rounded-full flex items-center justify-center font-bold text-xs"
                                        >
                                            LOGO
                                        </div>
                                    {/if}
                                </div>
                            {/if}
                            <div
                                class="font-black text-sm uppercase tracking-wide"
                            >
                                {storeInfo.name}
                            </div>
                            <div class="text-[9px] text-slate-600 px-2">
                                {storeInfo.address}
                            </div>
                            <div class="text-[9px] text-slate-600">
                                {storeInfo.phone}
                            </div>
                            {#if settings.headerText}
                                <div
                                    class="mt-1 pt-1 border-t border-slate-300 border-dashed text-slate-500 italic"
                                >
                                    {settings.headerText}
                                </div>
                            {/if}
                        </div>

                        <div
                            class="border-b border-black border-dashed my-2 opacity-30"
                        ></div>

                        <!-- INFO -->
                        <div class="space-y-1 mb-2">
                            <div class="flex justify-between">
                                <span>No:</span>
                                <span class="font-bold">SRV-EXAMPLE</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Tgl:</span>
                                <span>{new Date().toLocaleString("id-ID")}</span
                                >
                            </div>
                            {#if settings.showCustomerPhone}
                                <div class="flex justify-between">
                                    <span>Cust:</span>
                                    <span>0812-XXXX-XXXX</span>
                                </div>
                            {/if}
                            {#if settings.showCustomerAddress}
                                <div
                                    class="text-[9px] text-slate-500 pl-2 opacity-80 truncate"
                                >
                                    Jl. Demo Preview No. 1
                                </div>
                            {/if}
                            {#if settings.showTechnicianName}
                                <div class="flex justify-between">
                                    <span>Teknisi:</span> <span>Agus Tech</span>
                                </div>
                            {/if}
                            {#if settings.showImei}
                                <div class="flex justify-between">
                                    <span>IMEI:</span>
                                    <span class="font-mono text-[9px]"
                                        >123456789012345</span
                                    >
                                </div>
                            {/if}
                        </div>

                        <div
                            class="border-b border-black border-dashed my-2 opacity-30"
                        ></div>

                        <!-- ITEMS -->
                        <div class="space-y-2 mb-2">
                            <div>
                                <div class="font-bold">
                                    Ganti LCD iPhone 12 Pro
                                </div>
                                <div class="pl-2 text-slate-500">
                                    {#if settings.showSparepartDetails}
                                        <div class="flex justify-between">
                                            <span>1x LCD OLED</span>
                                            <span>1.200.000</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span>Jasa Pasang</span>
                                            <span>150.000</span>
                                        </div>
                                    {:else}
                                        <div class="opacity-70">
                                            Detail disembunyikan...
                                        </div>
                                    {/if}
                                </div>
                                <div
                                    class="flex justify-between font-bold mt-1"
                                >
                                    <span>Subtotal</span> <span>1.350.000</span>
                                </div>
                            </div>
                        </div>

                        <div class="border-b px-2 my-2 opacity-30"></div>

                        <div
                            class="flex justify-between font-black text-sm mb-4"
                        >
                            <span>TOTAL</span>
                            <span>Rp 1.350.000</span>
                        </div>

                        <!-- FOOTER -->
                        <div class="text-center space-y-3">
                            {#if settings.showWarrantyInfo}
                                <div
                                    class="border border-slate-800 rounded p-1 font-bold text-[9px]"
                                >
                                    GARANSI 7 HARI
                                </div>
                            {/if}

                            <div
                                class="text-slate-600 whitespace-pre-line px-2"
                            >
                                {settings.footerText || "Terima Kasih"}
                            </div>

                            {#if settings.showBarcode}
                                <div
                                    class="py-2 flex justify-center opacity-80 grayscale"
                                >
                                    <!-- Fake Barcode -->
                                    <div class="flex gap-0.5 h-6">
                                        {#each Array(20) as _}
                                            <div
                                                class="w-0.5 bg-black h-full"
                                            ></div>
                                            <div
                                                class="w-0.5 bg-transparent h-full"
                                            ></div>
                                            <div
                                                class="w-1 bg-black h-full"
                                            ></div>
                                        {/each}
                                    </div>
                                </div>
                            {/if}

                            {#if settings.termsConditions}
                                <div
                                    class="text-[8px] text-slate-400 text-justify leading-tight"
                                >
                                    * {settings.termsConditions}
                                </div>
                            {/if}

                            <div class="text-[8px] text-slate-300 mt-4">
                                Powered by CekServer
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    class="bg-blue-50 text-blue-700 text-xs p-3 rounded-xl border border-blue-100 flex gap-2"
                >
                    <Info class="h-4 w-4 shrink-0" />
                    <p>
                        Preview ini adalah simulasi. Hasil cetak aktual mungkin
                        sedikit berbeda tergantung densitas printer & driver OS.
                    </p>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    /* Paper shadow effect */
    .print-preview {
        box-shadow:
            0 1px 1px rgba(0, 0, 0, 0.1),
            0 2px 2px rgba(0, 0, 0, 0.1),
            0 4px 4px rgba(0, 0, 0, 0.1),
            0 8px 8px rgba(0, 0, 0, 0.1),
            0 16px 16px rgba(0, 0, 0, 0.1);
    }
</style>
