<script lang="ts">
    import CurrencyInput from "$lib/shared/components/custom/currency-input.svelte";
    import { Button } from "$lib/shared/components/ui/button";
    import {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogDescription,
        DialogFooter,
    } from "$lib/shared/components/ui/dialog";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import { Textarea } from "$lib/shared/components/ui/textarea";
    import { Badge } from "$lib/shared/components/ui/badge";
    import { Separator } from "$lib/shared/components/ui/separator";
    import {
        Command,
        CommandInput,
        CommandList,
        CommandEmpty,
        CommandGroup,
        CommandItem,
    } from "$lib/shared/components/ui/command";
    import {
        Popover,
        PopoverContent,
        PopoverTrigger,
    } from "$lib/shared/components/ui/popover";
    import {
        CheckCircle,
        XCircle,
        Package,
        ShoppingBag,
        Wrench,
        ChevronRight,
        ChevronLeft,
        Search,
        Loader2,
        Smartphone,
        User,
    } from "lucide-svelte";
    import { ProductsService as InventoryService } from "$lib/features/inventory/products/products.service";
    import { api } from "$lib/shared/lib/api-client";
    import { toast } from "svelte-sonner";
    import type { Product, ProductBatch } from "@repo/shared";

    interface Props {
        open: boolean;
        serviceId: number;
        serviceNo: string;
        customer?: { name: string; phone: string; address?: string } | null;
        device?: {
            brand: string;
            model: string;
            imei?: string;
            equipment?: string;
        } | null;
        complaint?: string;
        diagnosis?: string | null;
        initialQC?: Record<string, boolean> | null;
        costEstimate?: number;
        onComplete: () => void;
        onClose: () => void;
    }

    let {
        open = $bindable(false),
        serviceId,
        serviceNo,
        customer = null,
        device = null,
        complaint = "",
        diagnosis = null,
        initialQC = null,
        costEstimate = 0,
        onComplete,
        onClose,
    }: Props = $props();

    // Wizard state
    let currentStep = $state(1);
    const TOTAL_STEPS = 4;

    // Step 1: Spare Parts
    type SparePartMode = "inventory" | "external" | "none";
    let sparePartMode = $state<SparePartMode>("none");

    // Extended Product type with batches for inventory selection
    type ProductWithBatches = Product & { batches?: ProductBatch[] };

    // Inventory mode
    let inventorySearch = $state("");
    let inventoryPopoverOpen = $state(false);
    let products = $state<ProductWithBatches[]>([]);
    let loadingProducts = $state(false);
    let selectedParts = $state<
        Array<{
            productId?: string;
            batchId?: string;
            name: string;
            variant?: string;
            qty: number;
            price: number;
            source: "inventory" | "external" | "service";
        }>
    >([]);

    // Current part being added
    let selectedProduct = $state<ProductWithBatches | null>(null);
    let selectedBatch = $state<any>(null);
    let partQty = $state(1);

    // External mode
    let externalPart = $state({
        name: "",
        description: "",
        purchasePrice: 0,
    });

    // No parts mode (service only)
    let serviceDescription = $state("");

    // Step 2: QC Comparison
    const QC_ITEMS = [
        { key: "touchscreen", label: "Touchscreen" },
        { key: "lcd", label: "LCD Display" },
        { key: "speaker", label: "Speaker" },
        { key: "mic", label: "Microphone" },
        { key: "earpiece", label: "Earpiece" },
        { key: "frontCamera", label: "Front Camera" },
        { key: "backCamera", label: "Back Camera" },
        { key: "wifi", label: "WiFi" },
        { key: "bluetooth", label: "Bluetooth" },
        { key: "simCard", label: "SIM Card" },
        { key: "charging", label: "Charging" },
        { key: "battery", label: "Battery" },
        { key: "fingerprint", label: "Fingerprint" },
        { key: "faceId", label: "Face ID" },
        { key: "buttons", label: "Buttons" },
        { key: "vibration", label: "Vibration" },
    ];

    let finalQC = $state<Record<string, boolean>>({});

    // Step 3: Final Details
    let actualCost = $state(0);
    let completionNotes = $state("");
    let isSubmitting = $state(false);

    // Initialize
    $effect(() => {
        if (open) {
            // Reset wizard state when opening
            currentStep = 1;
            sparePartMode = "none";
            selectedParts = [];
            selectedProduct = null;
            selectedBatch = null;
            partQty = 1;
            externalPart = { name: "", description: "", purchasePrice: 0 };
            serviceDescription = "";
            actualCost = costEstimate || 0;
            completionNotes = "";
            // Initialize final QC with initial QC values if available
            finalQC = initialQC ? { ...initialQC } : {};
            loadProducts();
        }
    });

    async function loadProducts() {
        loadingProducts = true;
        try {
            products = await InventoryService.getAll();
        } catch (e) {
            console.error("Failed to load products", e);
        } finally {
            loadingProducts = false;
        }
    }

    let filteredProducts = $derived(
        products
            .filter((p) => {
                const term = inventorySearch.toLowerCase();
                return (
                    p.name.toLowerCase().includes(term) ||
                    (p.code?.toLowerCase().includes(term) ?? false)
                );
            })
            .slice(0, 10),
    );

    function selectProduct(product: ProductWithBatches) {
        selectedProduct = product;
        // Auto-select first batch with stock if available
        if (product.batches && product.batches.length > 0) {
            const batchWithStock = product.batches.find(
                (b: ProductBatch) => b.currentStock > 0,
            );
            selectedBatch = batchWithStock || product.batches[0];
        }
        inventoryPopoverOpen = false;
        inventorySearch = "";
    }

    function addInventoryPart() {
        if (!selectedProduct || !selectedBatch) {
            toast.error("Pilih produk dan batch terlebih dahulu");
            return;
        }
        if (partQty <= 0 || partQty > selectedBatch.currentStock) {
            toast.error("Jumlah tidak valid");
            return;
        }

        selectedParts = [
            ...selectedParts,
            {
                productId: selectedProduct.id,
                batchId: selectedBatch.id,
                name: selectedProduct.name,
                variant: selectedBatch.variant || undefined,
                qty: partQty,
                price: selectedBatch.sellPrice,
                source: "inventory",
            },
        ];

        // Reset selection
        selectedProduct = null;
        selectedBatch = null;
        partQty = 1;
    }

    function addExternalPart() {
        if (!externalPart.name) {
            toast.error("Nama sparepart harus diisi");
            return;
        }

        selectedParts = [
            ...selectedParts,
            {
                name: externalPart.name,
                qty: 1,
                price: externalPart.purchasePrice,
                source: "external",
            },
        ];

        externalPart = { name: "", description: "", purchasePrice: 0 };
    }

    function removePart(index: number) {
        selectedParts = selectedParts.filter((_, i) => i !== index);
    }

    let totalPartsValue = $derived(
        selectedParts.reduce((sum, p) => sum + p.qty * p.price, 0),
    );

    function toggleQCItem(key: string) {
        finalQC = { ...finalQC, [key]: !finalQC[key] };
    }

    function getQCStatus(key: string): "pass" | "fail" | "unknown" {
        if (finalQC[key] === true) return "pass";
        if (finalQC[key] === false) return "fail";
        return "unknown";
    }

    function getInitialQCStatus(key: string): "pass" | "fail" | "unknown" {
        if (!initialQC) return "unknown";
        if (initialQC[key] === true) return "pass";
        if (initialQC[key] === false) return "fail";
        return "unknown";
    }

    function nextStep() {
        if (currentStep < TOTAL_STEPS) {
            // Validation for step 1
            if (currentStep === 1) {
                if (sparePartMode === "none" && !serviceDescription) {
                    toast.error("Masukkan deskripsi pekerjaan");
                    return;
                }
            }
            // Validation for step 3
            // if (currentStep === 3) {
            //    if (actualCost < 0) {
            //        toast.error("Biaya tidak boleh negatif");
            //        return;
            //    }
            // }
            currentStep++;
        }
    }

    function prevStep() {
        if (currentStep > 1) {
            currentStep--;
        }
    }

    async function handleSubmit() {
        isSubmitting = true;
        try {
            const userId =
                JSON.parse(localStorage.getItem("user") || "{}").id ||
                "USR-ADMIN";

            // Build parts array
            const partsToSave =
                sparePartMode === "none"
                    ? [
                          {
                              name: serviceDescription,
                              source: "service",
                              qty: 1,
                              price: 0,
                              subtotal: 0,
                          },
                      ]
                    : selectedParts.map((p) => ({
                          ...p,
                          subtotal: p.qty * p.price,
                      }));

            // Update service with parts and QC
            await api.patch(`/service/${serviceId}`, {
                parts: partsToSave,
                qc: {
                    before: initialQC,
                    after: finalQC,
                    passed: Object.values(finalQC).every((v) => v === true),
                },
            });

            // Update status to selesai
            await api.put(`/service/${serviceId}/status`, {
                status: "selesai",
                actualCost: actualCost,
                notes: completionNotes,
                userId,
            });

            toast.success("Service berhasil diselesaikan!");
            onComplete();
            open = false;
        } catch (e) {
            console.error(e);
            toast.error("Gagal menyelesaikan service");
        } finally {
            isSubmitting = false;
        }
    }

    function handleClose() {
        open = false;
        onClose();
    }
</script>

<Dialog bind:open>
    <DialogContent
        class="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col"
    >
        <DialogHeader>
            <DialogTitle class="flex items-center gap-2">
                <CheckCircle class="h-5 w-5 text-green-600" />
                Selesaikan Service {serviceNo}
            </DialogTitle>
            <DialogDescription>
                Langkah {currentStep} dari {TOTAL_STEPS}
            </DialogDescription>
        </DialogHeader>

        <!-- Progress Steps -->
        <div
            class="flex items-center justify-between px-2 py-3 overflow-x-auto"
        >
            {#each [1, 2, 3, 4] as step}
                <div class="flex items-center gap-2 min-w-fit">
                    <div
                        class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors {currentStep >=
                        step
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'}"
                    >
                        {step}
                    </div>
                    <span
                        class="text-sm hidden sm:inline {currentStep === step
                            ? 'font-medium'
                            : 'text-muted-foreground'}"
                    >
                        {step === 1
                            ? "Sparepart"
                            : step === 2
                              ? "QC Akhir"
                              : step === 3
                                ? "Detail Biaya"
                                : "Konfirmasi"}
                    </span>
                </div>
                {#if step < 4}
                    <div
                        class="flex-1 h-0.5 mx-2 min-w-[20px] {currentStep >
                        step
                            ? 'bg-primary'
                            : 'bg-muted'}"
                    ></div>
                {/if}
            {/each}
        </div>

        <Separator />

        <!-- Step Content -->
        <div class="flex-1 overflow-y-auto py-4 px-1">
            {#if currentStep === 1}
                <!-- Step 1: Spare Parts -->
                <div class="space-y-4">
                    <div class="space-y-3">
                        <Label class="text-base font-medium"
                            >Pemakaian Sparepart</Label
                        >
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <button
                                onclick={() => (sparePartMode = "inventory")}
                                class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all {sparePartMode ===
                                'inventory'
                                    ? 'border-primary bg-primary/5'
                                    : 'border-muted hover:border-muted-foreground/30'}"
                            >
                                <Package
                                    class="h-8 w-8 {sparePartMode ===
                                    'inventory'
                                        ? 'text-primary'
                                        : 'text-muted-foreground'}"
                                />
                                <span class="text-sm font-medium"
                                    >Dari Inventori</span
                                >
                                <span
                                    class="text-xs text-muted-foreground text-center"
                                    >Pilih dari stok</span
                                >
                            </button>
                            <button
                                onclick={() => (sparePartMode = "external")}
                                class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all {sparePartMode ===
                                'external'
                                    ? 'border-primary bg-primary/5'
                                    : 'border-muted hover:border-muted-foreground/30'}"
                            >
                                <ShoppingBag
                                    class="h-8 w-8 {sparePartMode === 'external'
                                        ? 'text-primary'
                                        : 'text-muted-foreground'}"
                                />
                                <span class="text-sm font-medium"
                                    >Dari Luar</span
                                >
                                <span
                                    class="text-xs text-muted-foreground text-center"
                                    >Beli sparepart</span
                                >
                            </button>
                            <button
                                onclick={() => (sparePartMode = "none")}
                                class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all {sparePartMode ===
                                'none'
                                    ? 'border-primary bg-primary/5'
                                    : 'border-muted hover:border-muted-foreground/30'}"
                            >
                                <Wrench
                                    class="h-8 w-8 {sparePartMode === 'none'
                                        ? 'text-primary'
                                        : 'text-muted-foreground'}"
                                />
                                <span class="text-sm font-medium"
                                    >Tanpa Sparepart</span
                                >
                                <span
                                    class="text-xs text-muted-foreground text-center"
                                    >Jumper, software</span
                                >
                            </button>
                        </div>
                    </div>

                    <Separator />

                    {#if sparePartMode === "inventory"}
                        <!-- Inventory Parts Selection -->
                        <div class="space-y-4">
                            <div class="space-y-2">
                                <Label>Cari Produk (nama atau kode)</Label>
                                <Popover bind:open={inventoryPopoverOpen}>
                                    <PopoverTrigger class="w-full">
                                        <div
                                            class="flex items-center gap-2 w-full px-3 py-2 border rounded-md text-left text-sm"
                                        >
                                            <Search
                                                class="h-4 w-4 text-muted-foreground"
                                            />
                                            {#if selectedProduct}
                                                <span
                                                    >{selectedProduct.name}</span
                                                >
                                            {:else}
                                                <span
                                                    class="text-muted-foreground"
                                                    >Ketik untuk mencari...</span
                                                >
                                            {/if}
                                        </div>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        class="w-[400px] p-0"
                                        align="start"
                                    >
                                        <Command>
                                            <CommandInput
                                                placeholder="Cari produk..."
                                                bind:value={inventorySearch}
                                            />
                                            <CommandList>
                                                <CommandEmpty>
                                                    {loadingProducts
                                                        ? "Loading..."
                                                        : "Produk tidak ditemukan"}
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    {#each filteredProducts as product}
                                                        <CommandItem
                                                            onSelect={() =>
                                                                selectProduct(
                                                                    product,
                                                                )}
                                                            class="cursor-pointer"
                                                        >
                                                            <div
                                                                class="flex flex-col gap-1"
                                                            >
                                                                <span
                                                                    class="font-medium"
                                                                    >{product.name}</span
                                                                >
                                                                <div
                                                                    class="flex items-center gap-2 text-xs text-muted-foreground"
                                                                >
                                                                    {#if product.code}
                                                                        <Badge
                                                                            variant="outline"
                                                                            class="text-xs"
                                                                            >{product.code}</Badge
                                                                        >
                                                                    {/if}
                                                                    <span
                                                                        >Stok: {product.stock}</span
                                                                    >
                                                                </div>
                                                            </div>
                                                        </CommandItem>
                                                    {/each}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {#if selectedProduct}
                                <div
                                    class="p-4 border rounded-lg bg-muted/30 space-y-3"
                                >
                                    <div
                                        class="flex justify-between items-start"
                                    >
                                        <div>
                                            <p class="font-medium">
                                                {selectedProduct.name}
                                            </p>
                                            {#if selectedProduct.code}
                                                <p
                                                    class="text-xs text-muted-foreground"
                                                >
                                                    {selectedProduct.code}
                                                </p>
                                            {/if}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onclick={() =>
                                                (selectedProduct = null)}
                                        >
                                            <XCircle class="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {#if selectedProduct.batches && selectedProduct.batches.length > 0}
                                        <div class="space-y-2">
                                            <Label class="text-xs"
                                                >Pilih Batch/Varian</Label
                                            >
                                            <div class="grid gap-2">
                                                {#each selectedProduct.batches.filter((b) => b.currentStock > 0) as batch}
                                                    <button
                                                        onclick={() =>
                                                            (selectedBatch =
                                                                batch)}
                                                        class="flex justify-between items-center p-2 rounded border text-sm text-left {selectedBatch?.id ===
                                                        batch.id
                                                            ? 'border-primary bg-primary/5'
                                                            : 'hover:bg-muted'}"
                                                    >
                                                        <div>
                                                            <span
                                                                class="font-medium"
                                                                >{batch.variant ||
                                                                    "Default"}</span
                                                            >
                                                            <span
                                                                class="text-muted-foreground ml-2"
                                                                >Stok: {batch.currentStock}</span
                                                            >
                                                        </div>
                                                        <span
                                                            class="font-medium"
                                                            >Rp {batch.sellPrice.toLocaleString(
                                                                "id-ID",
                                                            )}</span
                                                        >
                                                    </button>
                                                {/each}
                                            </div>
                                        </div>

                                        {#if selectedBatch}
                                            <div class="flex items-end gap-3">
                                                <div class="flex-1 space-y-1">
                                                    <Label class="text-xs"
                                                        >Jumlah</Label
                                                    >
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        max={selectedBatch.currentStock}
                                                        bind:value={partQty}
                                                    />
                                                </div>
                                                <Button
                                                    onclick={addInventoryPart}
                                                    class="bg-blue-600 hover:bg-blue-700"
                                                >
                                                    Tambah
                                                </Button>
                                            </div>
                                        {/if}
                                    {:else}
                                        <p
                                            class="text-sm text-muted-foreground italic"
                                        >
                                            Tidak ada stok tersedia
                                        </p>
                                    {/if}
                                </div>
                            {/if}
                        </div>
                    {:else if sparePartMode === "external"}
                        <!-- External Parts -->
                        <div class="space-y-4">
                            <div class="space-y-2">
                                <Label for="extPartName"
                                    >Nama/Deskripsi Sparepart</Label
                                >
                                <Input
                                    id="extPartName"
                                    placeholder="Contoh: LCD iPhone 12 Pro Original"
                                    bind:value={externalPart.name}
                                />
                            </div>
                            <div class="space-y-2">
                                <Label for="extPartPrice">Harga Beli (Rp)</Label
                                >
                                <CurrencyInput
                                    bind:value={externalPart.purchasePrice}
                                    class="w-full"
                                />
                            </div>
                            <Button onclick={addExternalPart} class="w-full">
                                Tambah Sparepart
                            </Button>
                        </div>
                    {:else}
                        <!-- No Parts - Service Only -->
                        <div class="space-y-2">
                            <Label for="serviceDesc">Deskripsi Pekerjaan</Label>
                            <Textarea
                                id="serviceDesc"
                                placeholder="Contoh: Jumper tombol power, Flash ulang firmware, dll..."
                                rows={3}
                                bind:value={serviceDescription}
                            />
                        </div>
                    {/if}

                    <!-- Selected Parts List -->
                    {#if selectedParts.length > 0}
                        <div class="space-y-2 mt-4">
                            <Label class="text-base"
                                >Sparepart Ditambahkan</Label
                            >
                            <div class="border rounded-lg divide-y">
                                {#each selectedParts as part, i}
                                    <div
                                        class="flex justify-between items-center p-3"
                                    >
                                        <div>
                                            <p class="font-medium text-sm">
                                                {part.name}
                                            </p>
                                            <p
                                                class="text-xs text-muted-foreground"
                                            >
                                                {part.source === "inventory"
                                                    ? "Dari Stok"
                                                    : "Beli Luar"} • Qty: {part.qty}
                                            </p>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <span class="font-medium text-sm"
                                                >Rp {(
                                                    part.qty * part.price
                                                ).toLocaleString("id-ID")}</span
                                            >
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onclick={() => removePart(i)}
                                            >
                                                <XCircle
                                                    class="h-4 w-4 text-red-500"
                                                />
                                            </Button>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                            <div
                                class="flex justify-between items-center px-3 py-2 bg-muted rounded-lg"
                            >
                                <span class="font-medium">Total Sparepart</span>
                                <span class="font-bold text-primary"
                                    >Rp {totalPartsValue.toLocaleString(
                                        "id-ID",
                                    )}</span
                                >
                            </div>
                        </div>
                    {/if}
                </div>
            {:else if currentStep === 2}
                <!-- Step 2: QC Comparison -->
                <div class="space-y-4">
                    <p class="text-sm text-muted-foreground">
                        Bandingkan kondisi perangkat sebelum dan sesudah
                        perbaikan.
                    </p>

                    <div
                        class="grid grid-cols-[1fr_80px_80px] gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider px-2"
                    >
                        <span>Item</span>
                        <span class="text-center">Sebelum</span>
                        <span class="text-center">Sesudah</span>
                    </div>

                    <div
                        class="border rounded-lg divide-y max-h-[400px] overflow-y-auto"
                    >
                        {#each QC_ITEMS as item}
                            {@const beforeStatus = getInitialQCStatus(item.key)}
                            {@const afterStatus = getQCStatus(item.key)}
                            <div
                                class="grid grid-cols-[1fr_80px_80px] gap-2 items-center p-3"
                            >
                                <span class="text-sm font-medium"
                                    >{item.label}</span
                                >

                                <!-- Before (Initial QC) - Read Only -->
                                <div class="flex justify-center">
                                    {#if beforeStatus === "pass"}
                                        <CheckCircle
                                            class="h-5 w-5 text-green-500"
                                        />
                                    {:else if beforeStatus === "fail"}
                                        <XCircle class="h-5 w-5 text-red-500" />
                                    {:else}
                                        <span class="text-muted-foreground"
                                            >-</span
                                        >
                                    {/if}
                                </div>

                                <!-- After (Final QC) - Editable -->
                                <div class="flex justify-center">
                                    <button
                                        onclick={() => toggleQCItem(item.key)}
                                        class="p-1 rounded-md hover:bg-muted transition-colors"
                                    >
                                        {#if afterStatus === "pass"}
                                            <CheckCircle
                                                class="h-5 w-5 text-green-500"
                                            />
                                        {:else if afterStatus === "fail"}
                                            <XCircle
                                                class="h-5 w-5 text-red-500"
                                            />
                                        {:else}
                                            <div
                                                class="h-5 w-5 rounded-full border-2 border-dashed border-muted-foreground"
                                            ></div>
                                        {/if}
                                    </button>
                                </div>
                            </div>
                        {/each}
                    </div>

                    <div class="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onclick={() => {
                                QC_ITEMS.forEach((item) => {
                                    finalQC = { ...finalQC, [item.key]: true };
                                });
                            }}
                        >
                            Semua OK
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onclick={() => {
                                if (initialQC) {
                                    finalQC = { ...initialQC };
                                }
                            }}
                        >
                            Salin dari QC Awal
                        </Button>
                    </div>
                </div>
            {:else if currentStep === 3}
                <!-- Step 3: Final Details -->
                <div class="space-y-4">
                    <div class="p-4 bg-muted/50 rounded-lg space-y-3">
                        <h4 class="font-medium">Ringkasan</h4>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span class="text-muted-foreground"
                                    >Sparepart</span
                                >
                                <span>
                                    {selectedParts.length > 0
                                        ? `${selectedParts.length} item`
                                        : sparePartMode === "none"
                                          ? serviceDescription || "-"
                                          : "-"}
                                </span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-muted-foreground"
                                    >Total Sparepart</span
                                >
                                <span
                                    >Rp {totalPartsValue.toLocaleString(
                                        "id-ID",
                                    )}</span
                                >
                            </div>
                            <div class="flex justify-between">
                                <span class="text-muted-foreground"
                                    >QC Akhir</span
                                >
                                <span>
                                    {Object.values(finalQC).filter(Boolean)
                                        .length} / {QC_ITEMS.length} OK
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-2">
                        <Label>Total Biaya Akhir (Sesuai Kesepakatan)</Label>
                        <div class="p-3 bg-muted rounded-md text-lg font-bold">
                            Rp {actualCost.toLocaleString("id-ID")}
                        </div>
                        <p class="text-xs text-muted-foreground">
                            Biaya ini diambil dari estimasi yang telah
                            disepakati sebelumnya.
                        </p>
                    </div>

                    <div class="space-y-2">
                        <Label for="completionNotes"
                            >Catatan Penyelesaian (Opsional)</Label
                        >
                        <Textarea
                            id="completionNotes"
                            placeholder="Catatan tambahan..."
                            rows={3}
                            bind:value={completionNotes}
                        />
                    </div>
                </div>
            {:else}
                <!-- Step 4: Review & Confirmation -->
                <div class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Customer & Device Info -->
                        <div class="space-y-4">
                            <div class="bg-muted/30 p-3 rounded-lg space-y-2">
                                <h4 class="font-medium flex items-center gap-2">
                                    <User class="h-4 w-4" /> Customer
                                </h4>
                                <div class="text-sm space-y-1">
                                    <p
                                        class="font-bold text-slate-800 leading-none"
                                    >
                                        {customer?.name || "Customer"}
                                    </p>
                                    <p class="text-muted-foreground text-xs">
                                        {customer?.phone || "-"}
                                    </p>
                                </div>
                            </div>

                            <div class="bg-muted/30 p-3 rounded-lg space-y-2">
                                <h4 class="font-medium flex items-center gap-2">
                                    <Smartphone class="h-4 w-4" /> Device
                                </h4>
                                <div class="text-sm space-y-1">
                                    <p class="font-medium">
                                        {device?.brand}
                                        {device?.model}
                                    </p>
                                    <p class="text-muted-foreground text-xs">
                                        {device?.imei || "-"}
                                    </p>
                                    {#if complaint}
                                        <div class="mt-2 pt-2 border-t text-xs">
                                            <span class="font-medium"
                                                >Keluhan:</span
                                            >
                                            {complaint}
                                        </div>
                                    {/if}
                                    {#if diagnosis}
                                        <div class="mt-1 text-xs">
                                            <span class="font-medium"
                                                >Diagnosa:</span
                                            >
                                            {#if typeof diagnosis === "string" && diagnosis.startsWith("{")}
                                                {@const diag =
                                                    JSON.parse(diagnosis)}
                                                <div
                                                    class="pl-2 border-l-2 border-muted mt-1 space-y-1"
                                                >
                                                    {#if diag.initial}
                                                        <p>
                                                            <span
                                                                class="text-muted-foreground"
                                                                >Awal:</span
                                                            >
                                                            {diag.initial}
                                                        </p>
                                                    {/if}
                                                    {#if diag.possibleCauses}
                                                        <p>
                                                            <span
                                                                class="text-muted-foreground"
                                                                >Penyebab:</span
                                                            >
                                                            {diag.possibleCauses}
                                                        </p>
                                                    {/if}
                                                </div>
                                            {:else}
                                                {diagnosis}
                                            {/if}
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        </div>

                        <!-- Service Summary -->
                        <div class="space-y-4">
                            <div
                                class="bg-green-50/50 p-3 rounded-lg space-y-2 border border-green-100"
                            >
                                <h4 class="font-medium text-green-800">
                                    Ringkasan Biaya
                                </h4>
                                <div class="space-y-2 text-sm">
                                    <div class="flex justify-between">
                                        <span class="text-muted-foreground"
                                            >Sparepart ({selectedParts.length} item)</span
                                        >
                                        <span
                                            >Rp {totalPartsValue.toLocaleString(
                                                "id-ID",
                                            )}</span
                                        >
                                    </div>
                                    <div
                                        class="flex justify-between items-center pt-2 border-t border-green-200 font-bold text-lg text-green-700"
                                    >
                                        <span>Total Biaya</span>
                                        <span
                                            >Rp {actualCost.toLocaleString(
                                                "id-ID",
                                            )}</span
                                        >
                                    </div>
                                    {#if completionNotes}
                                        <div
                                            class="mt-2 pt-2 border-t border-green-200"
                                        >
                                            <span
                                                class="text-xs font-medium text-muted-foreground"
                                                >Catatan:</span
                                            >
                                            <p
                                                class="text-xs italic text-muted-foreground"
                                            >
                                                "{completionNotes}"
                                            </p>
                                        </div>
                                    {/if}
                                </div>
                            </div>

                            <div class="bg-muted/30 p-3 rounded-lg space-y-2">
                                <h4 class="font-medium flex items-center gap-2">
                                    <CheckCircle class="h-4 w-4" /> QC Summary
                                </h4>
                                <div class="text-sm">
                                    <p>
                                        {Object.values(finalQC).filter(Boolean)
                                            .length} dari {QC_ITEMS.length} item
                                        <span class="text-green-600 font-medium"
                                            >Passed</span
                                        >
                                    </p>
                                    {#if Object.values(finalQC).some((v) => !v)}
                                        <p class="text-xs text-red-500 mt-1">
                                            Warning: Ada item yang belum passed
                                            QC
                                        </p>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            {/if}
        </div>

        <Separator />

        <DialogFooter class="flex-row justify-between sm:justify-between">
            <div>
                {#if currentStep > 1}
                    <Button variant="outline" onclick={prevStep}>
                        <ChevronLeft class="h-4 w-4 mr-1" /> Kembali
                    </Button>
                {:else}
                    <Button variant="outline" onclick={handleClose}
                        >Batal</Button
                    >
                {/if}
            </div>
            <div>
                {#if currentStep < TOTAL_STEPS}
                    <Button onclick={nextStep} class="bg-primary">
                        Lanjut <ChevronRight class="h-4 w-4 ml-1" />
                    </Button>
                {:else}
                    <Button
                        onclick={handleSubmit}
                        disabled={isSubmitting}
                        class="bg-green-600 hover:bg-green-700"
                    >
                        {#if isSubmitting}
                            <Loader2 class="h-4 w-4 mr-2 animate-spin" />
                        {:else}
                            <CheckCircle class="h-4 w-4 mr-2" />
                        {/if}
                        Selesaikan Service
                    </Button>
                {/if}
            </div>
        </DialogFooter>
    </DialogContent>
</Dialog>
