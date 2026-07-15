<script lang="ts">
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import { Textarea } from "$lib/shared/components/ui/textarea";
    import { Button } from "$lib/shared/components/ui/button";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/shared/components/ui/select";
    import { Separator } from "$lib/shared/components/ui/separator";
    import { Badge } from "$lib/shared/components/ui/badge";
    import {
        Wrench,
        Package,
        Search,
        Trash2,
        AlertCircle,
        X,
        CheckCircle,
        Plus,
        ShoppingBag,
        Hammer,
    } from "lucide-svelte";
    import { Switch } from "$lib/shared/components/ui/switch";
    import { createQuery } from "@tanstack/svelte-query";
    import { ProductsService as InventoryService } from "$lib/features/inventory/products/products.service";
    import { SPAREPART_SOURCES } from "@repo/shared";
    import { cn } from "$lib/shared/lib/utils";

    import CurrencyInput from "$lib/shared/components/custom/currency-input.svelte";
    import type { TicketFormController } from "../../ticket-form.controller.svelte";
    import { toast } from "svelte-sonner";

    let {
        form,
        technicians = [],
    }: {
        form: TicketFormController;
        technicians: any[];
        inventoryItems: any[];
        services: any[];
    } = $props();

    // Local UI State
    let showInventoryModal = $state(false);
    let searchTerm = $state("");
    let filterCompatible = $state(false);

    $effect(() => {
        if (showInventoryModal && form.selectedDeviceId) {
            filterCompatible = true;
        }
    });

    const inventorySearchQuery = createQuery(() => ({
        queryKey: [
            "inventory-search",
            searchTerm,
            filterCompatible ? form.selectedDeviceId : null,
        ],
        queryFn: async () => {
            const res = await InventoryService.getAll(
                filterCompatible && form.selectedDeviceId
                    ? form.selectedDeviceId
                    : undefined,
            );
            return res;
        },
        enabled: showInventoryModal,
    }));

    let filteredInventory = $derived(
        (inventorySearchQuery.data || []).filter(
            (item: any) =>
                searchTerm === "" ||
                item.name?.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
    );

    function handleAddPart(item: any) {
        form.addInventoryPart(item);
        showInventoryModal = false;
        toast.success("Sparepart ditambahkan");
    }
</script>

<div class="grid gap-8 animate-in fly-in-from-bottom-4 duration-500">
    <!-- Header -->
    <div class="space-y-2">
        <div
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100/50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2"
        >
            <Wrench class="h-3.5 w-3.5" />
            Langkah 4
        </div>
        <h2 class="text-3xl font-bold tracking-tight text-foreground">
            Detail Pengerjaan
        </h2>
        <p class="text-muted-foreground text-lg">
            {form.isWalkin
                ? "Estimasi biaya dan sparepart untuk service ditunggu."
                : "Keluhan kerusakan dan jenis layanan."}
        </p>
    </div>

    <div class="space-y-6">
        <!-- 1. Complaint / Issue Card -->
        <div
            class="relative group rounded-[2rem] border border-white/50 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md shadow-xl overflow-hidden p-6 sm:p-8"
        >
            <div class="grid md:grid-cols-[1fr_2px_1fr] gap-8">
                <!-- A. Left Column: Complaint -->
                <div class="space-y-4">
                    <div class="flex items-center gap-2 mb-2">
                        <div class="p-2 rounded-lg bg-red-50 text-red-600">
                            <AlertCircle class="h-5 w-5" />
                        </div>
                        <Label class="text-base font-bold text-foreground">
                            {form.isWalkin
                                ? "Kerusakan Utama"
                                : "Keluhan Pelanggan"}
                            <span class="text-red-500">*</span>
                        </Label>
                    </div>
                    <div class="relative group/input">
                        <Textarea
                            bind:value={form.complaint}
                            placeholder={form.isWalkin
                                ? "Contoh: Ganti LCD, Ganti Baterai..."
                                : "Contoh: HP restart saat panas, layar blank..."}
                            rows={4}
                            class="min-h-[140px] rounded-2xl bg-white/50 border-slate-200 focus:bg-white text-base leading-relaxed p-4 resize-none shadow-sm"
                        />
                    </div>
                </div>

                <!-- Divider (visible on md+) -->
                <div
                    class="hidden md:block bg-gradient-to-b from-transparent via-slate-200 to-transparent"
                ></div>
                <Separator class="md:hidden" />

                <!-- B. Right Column: Technician & Settings -->
                <div class="space-y-6">
                    {#if form.isWalkin}
                        <div class="space-y-4">
                            <Label
                                class="text-sm font-bold flex items-center justify-between"
                            >
                                <span
                                    >Teknisi Penanggung Jawab <span
                                        class="text-red-500">*</span
                                    ></span
                                >
                                <Badge variant="outline" class="text-[10px] h-5"
                                    >Wajib</Badge
                                >
                            </Label>

                            <div class="grid grid-cols-1 gap-2">
                                <Select
                                    type="single"
                                    bind:value={form.technician}
                                >
                                    <SelectTrigger
                                        class="h-12 rounded-xl bg-white/50 border-slate-200"
                                    >
                                        <div class="flex items-center gap-2">
                                            <div
                                                class="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs"
                                            >
                                                {technicians
                                                    .find(
                                                        (t) =>
                                                            t.id ===
                                                            form.technician,
                                                    )
                                                    ?.name?.charAt(0) || "?"}
                                            </div>
                                            {technicians.find(
                                                (t) => t.id === form.technician,
                                            )?.name || "Pilih Teknisi..."}
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {#each technicians as tech}
                                            <SelectItem
                                                value={tech.id}
                                                class="cursor-pointer font-medium"
                                                >{tech.name}</SelectItem
                                            >
                                        {/each}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    {:else}
                        <div
                            class="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60"
                        >
                            <div class="p-3 bg-slate-100 rounded-full">
                                <Hammer class="h-6 w-6 text-slate-400" />
                            </div>
                            <div>
                                <h4 class="font-bold text-sm">Mode Reguler</h4>
                                <p class="text-xs text-muted-foreground">
                                    Teknisi akan ditugaskan oleh admin setelah
                                    unit diterima.
                                </p>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
        </div>

        <!-- 2. Cost & Parts (Walk-in Only) -->
        {#if form.isWalkin}
            <div class="animate-in slide-in-from-bottom-8 duration-700">
                <div
                    class="relative group rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-50/50 to-white backdrop-blur-md shadow-xl overflow-hidden p-6 sm:p-8"
                >
                    <!-- Header Section -->
                    <div
                        class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
                    >
                        <div class="flex items-center gap-3">
                            <div
                                class="p-3 rounded-2xl bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                            >
                                <ShoppingBag class="h-6 w-6" />
                            </div>
                            <div>
                                <h3 class="text-xl font-bold text-blue-950">
                                    Estimasi Biaya
                                </h3>
                                <p class="text-sm text-blue-700/60">
                                    Hitung total biaya service & sparepart.
                                </p>
                            </div>
                        </div>

                        <!-- Source Selector Tiles -->
                        <div
                            class="flex bg-white/60 p-1.5 rounded-xl border border-blue-100/50 backdrop-blur-sm self-stretch sm:self-auto"
                        >
                            {#each SPAREPART_SOURCES as src}
                                <button
                                    class={cn(
                                        "flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all",
                                        form.sparepartSource === src.v
                                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                            : "text-blue-900/40 hover:bg-blue-50",
                                    )}
                                    onclick={() => {
                                        form.sparepartSource = src.v;
                                        if (src.v === "customer") {
                                            form.warranty = "none";
                                            toast.info(
                                                "Mode 'Bawa Sendiri' aktif. Garansi otomatis non-aktif.",
                                            );
                                        }
                                    }}
                                >
                                    {src.l}
                                </button>
                            {/each}
                        </div>
                    </div>

                    <div class="grid md:grid-cols-[1.5fr_1fr] gap-8">
                        <!-- Left: Inputs -->
                        <div class="space-y-6">
                            <!-- Service Fee -->
                            <div class="space-y-2">
                                <Label
                                    class="text-sm font-bold text-blue-900/80 uppercase tracking-wide"
                                    >Jasa Service (Labor)</Label
                                >
                                <CurrencyInput
                                    bind:value={form.serviceFee}
                                    placeholder="0"
                                    class="h-14 rounded-2xl border-blue-100 bg-white shadow-sm text-xl font-bold text-blue-900"
                                />
                            </div>

                            <!-- Dynamic Content based on Source -->
                            {#if form.sparepartSource === "inventory"}
                                <div class="space-y-3 pt-2">
                                    <div
                                        class="flex items-center justify-between"
                                    >
                                        <Label
                                            class="text-sm font-bold text-blue-900/80 uppercase tracking-wide"
                                            >Sparepart (Inventory)</Label
                                        >
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onclick={() =>
                                                (showInventoryModal = true)}
                                            class="h-8 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"
                                        >
                                            <Plus class="h-3.5 w-3.5 mr-1" /> Tambah
                                        </Button>
                                    </div>

                                    {#if form.selectedParts.length === 0}
                                        <button
                                            onclick={() =>
                                                (showInventoryModal = true)}
                                            class="w-full py-8 border-2 border-dashed border-blue-200 rounded-2xl flex flex-col items-center justify-center text-blue-300 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all gap-2"
                                        >
                                            <Search class="h-6 w-6" />
                                            <span class="font-bold text-sm"
                                                >Pilih dari Database</span
                                            >
                                        </button>
                                    {:else}
                                        <div class="space-y-2">
                                            {#each form.selectedParts as part, i}
                                                <div
                                                    class="flex items-center justify-between p-3 bg-white rounded-xl border border-blue-100 shadow-sm animate-in zoom-in-50"
                                                >
                                                    <div>
                                                        <p
                                                            class="font-bold text-sm text-blue-950"
                                                        >
                                                            {part.name}
                                                        </p>
                                                        <p
                                                            class="text-xs text-blue-400"
                                                        >
                                                            Stok: {part.stock} |
                                                            @ Rp {Number(
                                                                part.sellPrice,
                                                            ).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div
                                                        class="flex items-center gap-3"
                                                    >
                                                        <span
                                                            class="font-bold text-blue-700"
                                                            >Rp {Number(
                                                                part.sellPrice,
                                                            ).toLocaleString()}</span
                                                        >
                                                        <button
                                                            onclick={() =>
                                                                form.removePart(
                                                                    i,
                                                                )}
                                                            class="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                                                        >
                                                            <Trash2
                                                                class="h-4 w-4"
                                                            />
                                                        </button>
                                                    </div>
                                                </div>
                                            {/each}
                                        </div>
                                    {/if}
                                </div>
                            {:else if form.sparepartSource === "external"}
                                <div
                                    class="p-4 bg-orange-50/50 border border-orange-100 rounded-2xl space-y-4"
                                >
                                    <div class="space-y-2">
                                        <Label
                                            class="text-xs font-bold uppercase text-orange-800/60"
                                            >Nama Barang</Label
                                        >
                                        <Input
                                            bind:value={form.extPartName}
                                            placeholder="Detail sparepart..."
                                            class="h-11 bg-white border-orange-200"
                                        />
                                    </div>
                                    <div class="space-y-2">
                                        <Label
                                            class="text-xs font-bold uppercase text-orange-800/60"
                                            >Harga Beli (Modal)</Label
                                        >
                                        <CurrencyInput
                                            bind:value={form.extPartBuyPrice}
                                            class="h-11 bg-white border-orange-200"
                                        />
                                    </div>
                                </div>
                            {:else if form.sparepartSource === "customer"}
                                <div
                                    class="p-4 bg-yellow-50/50 border border-yellow-200 border-dashed rounded-2xl flex items-start gap-4"
                                >
                                    <div
                                        class="p-2 bg-yellow-100 text-yellow-700 rounded-lg"
                                    >
                                        <AlertCircle class="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h5
                                            class="font-bold text-yellow-800 text-sm"
                                        >
                                            Sparepart Bawaan Customer
                                        </h5>
                                        <p class="text-xs text-yellow-700 mt-1">
                                            Hanya dikenakan biaya jasa. Tidak
                                            ada garansi untuk part ini.
                                        </p>
                                    </div>
                                </div>
                            {/if}
                        </div>

                        <!-- Right: Summary Panel -->
                        <div
                            class="bg-indigo-900 text-white p-6 rounded-[1.5rem] shadow-xl shadow-indigo-900/20 flex flex-col justify-between h-full relative overflow-hidden"
                        >
                            <!-- Bg Decoration -->
                            <div
                                class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"
                            ></div>

                            <div class="space-y-6 relative z-10">
                                <h4
                                    class="font-bold text-indigo-200 tracking-wider text-xs uppercase"
                                >
                                    Rincian Pembayaran
                                </h4>

                                <div class="space-y-3">
                                    <div class="flex justify-between text-sm">
                                        <span class="text-indigo-300"
                                            >Biaya Jasa</span
                                        >
                                        <span class="font-bold"
                                            >Rp {form.walkinServiceFee.toLocaleString(
                                                "id-ID",
                                            )}</span
                                        >
                                    </div>
                                    <div class="flex justify-between text-sm">
                                        <span class="text-indigo-300"
                                            >Total Part</span
                                        >
                                        <span class="font-bold"
                                            >Rp {form.totalPartPrice.toLocaleString(
                                                "id-ID",
                                            )}</span
                                        >
                                    </div>
                                    <Separator class="bg-white/10" />
                                    <div
                                        class="flex justify-between items-center pt-2"
                                    >
                                        <span
                                            class="text-lg font-bold text-indigo-100"
                                            >Total</span
                                        >
                                        <span
                                            class="text-2xl font-black tracking-tight text-white"
                                        >
                                            Rp {form.grandTotal.toLocaleString(
                                                "id-ID",
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div class="space-y-4 pt-8 relative z-10">
                                <div class="space-y-2">
                                    <Label
                                        class="text-xs font-bold text-indigo-300 uppercase"
                                        >Opsi Garansi</Label
                                    >
                                    <Select
                                        type="single"
                                        bind:value={form.warranty}
                                        disabled={form.sparepartSource ===
                                            "customer"}
                                        onValueChange={(v) => {
                                            if (
                                                form.sparepartSource ===
                                                "customer"
                                            ) {
                                                form.warranty = "none";
                                            }
                                        }}
                                    >
                                        <SelectTrigger
                                            class="h-10 bg-white/10 border-transparent text-white focus:ring-0 focus:ring-offset-0"
                                        >
                                            {form.warranty === "none"
                                                ? "Tanpa Garansi"
                                                : form.warranty ||
                                                  "Pilih Garansi"}
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none"
                                                >Tanpa Garansi</SelectItem
                                            >
                                            <SelectItem value="1 Minggu"
                                                >1 Minggu</SelectItem
                                            >
                                            <SelectItem value="1 Bulan"
                                                >1 Bulan</SelectItem
                                            >
                                            <SelectItem value="3 Bulan"
                                                >3 Bulan</SelectItem
                                            >
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>

<!-- Simplified Inventory Search Modal -->
{#if showInventoryModal}
    <div
        class="fixed inset-0 bg-slate-900/60 flex items-start sm:items-center justify-center z-[100] p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
        <div
            class="bg-white dark:bg-slate-950 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] mt-10 sm:mt-0"
        >
            <div class="p-6 pb-2">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-bold text-xl">Pilih Sparepart</h3>
                    <Button
                        variant="ghost"
                        size="icon"
                        class="rounded-full"
                        onclick={() => (showInventoryModal = false)}
                    >
                        <X class="h-5 w-5" />
                    </Button>
                </div>

                <div class="relative">
                    <Search
                        class="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground"
                    />
                    <Input
                        bind:value={searchTerm}
                        placeholder="Cari nama barang..."
                        class="pl-11 h-12 rounded-xl bg-slate-50 border-slate-200 shadow-sm"
                    />
                </div>

                {#if form.selectedDeviceId}
                    <div class="mt-3 flex items-center gap-2">
                        <Switch id="filter" bind:checked={filterCompatible} />
                        <Label
                            for="filter"
                            class="text-xs font-medium cursor-pointer text-muted-foreground"
                        >
                            Hanya kompatibel dengan <span
                                class="font-bold text-foreground"
                                >{form.phoneBrand} {form.phoneModel}</span
                            >
                        </Label>
                    </div>
                {/if}
            </div>

            <div class="flex-1 overflow-y-auto p-4 pt-2 space-y-2">
                {#if inventorySearchQuery.isLoading}
                    <div class="py-12 flex justify-center">
                        <div
                            class="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full"
                        ></div>
                    </div>
                {:else if filteredInventory.length === 0}
                    <div
                        class="flex flex-col items-center justify-center py-12 text-center opacity-50 space-y-2"
                    >
                        <Package class="h-10 w-10 text-slate-300" />
                        <p class="text-sm font-medium">
                            Tidak ada barang ditemukan
                        </p>
                    </div>
                {:else}
                    {#each filteredInventory as item}
                        <button
                            class="w-full flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50 hover:border-indigo-100 border border-transparent transition-all group text-left"
                            onclick={() => handleAddPart(item)}
                        >
                            <div>
                                <h4
                                    class="font-bold text-sm group-hover:text-indigo-700"
                                >
                                    {item.name}
                                </h4>
                                <div class="flex gap-2 mt-1">
                                    <Badge
                                        variant="secondary"
                                        class="h-5 text-[10px]"
                                        >Stok: {item.stock}</Badge
                                    >
                                </div>
                            </div>
                            <div class="text-right">
                                <p class="font-bold text-indigo-600">
                                    Rp {(
                                        item.batches?.[0]?.sellPrice || 0
                                    ).toLocaleString()}
                                </p>
                                <span class="text-[10px] text-muted-foreground"
                                    >per unit</span
                                >
                            </div>
                        </button>
                    {/each}
                {/if}
            </div>
        </div>
    </div>
{/if}
