<script lang="ts">
    import { createQuery } from "@tanstack/svelte-query";
    import { api } from "$lib/shared/lib/api-client";
    import { Button } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/shared/components/ui/select";
    import {
        Loader2,
        ArrowLeft,
        PackagePlus,
        AlertTriangle,
        Boxes,
        Warehouse,
        FileWarning,
    } from "lucide-svelte";
    import { goto } from "$app/navigation";
    import { toast } from "svelte-sonner";
    import Combobox from "$lib/shared/components/ui/combobox.svelte";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
        CardDescription,
    } from "$lib/shared/components/ui/card";
    import { fade, fly } from "svelte/transition";
    import { Badge } from "$lib/shared/components/ui/badge";

    // Form State
    let selectedProductId = $state("");
    let selectedBatchId = $state("");
    let qty = $state(0);
    let reason = $state("");
    let isSubmitting = $state(false);

    // Queries
    const productsQuery = createQuery<any[]>(() => ({
        queryKey: ["products"],
        queryFn: async () => (await api.get("/inventory")).data.data,
    }));

    const batchesQuery = createQuery<any[]>(() => ({
        queryKey: ["batches", selectedProductId],
        queryFn: async () => {
            if (!selectedProductId) return [];
            const res = await api.get(`/inventory/${selectedProductId}`);
            return res.data.data.batches;
        },
        enabled: !!selectedProductId,
    }));

    // Derived Logic
    let selectedBatch = $derived(
        batchesQuery.data?.find((b: any) => b.id === selectedBatchId),
    );

    // Filter products for Combobox
    let productOptions = $derived(
        productsQuery.data?.map((p) => ({
            value: p.id,
            label: p.category?.name ? `${p.category.name} - ${p.name}` : p.name,
            product: p,
        })) || [],
    );

    async function handleSubmit() {
        if (!selectedProductId || !selectedBatchId || qty <= 0 || !reason) {
            toast.error("Mohon lengkapi semua field");
            return;
        }

        if (selectedBatch && qty > selectedBatch.currentStock) {
            toast.error("Stok tidak mencukupi");
            return;
        }

        isSubmitting = true;
        try {
            await api.post("/defective-items", {
                productId: selectedProductId,
                batchId: selectedBatchId,
                qty,
                reason,
            });
            toast.success("Barang rusak berhasil dicatat");
            goto("/purchase-returns");
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Gagal menyimpan");
        } finally {
            isSubmitting = false;
        }
    }
</script>

<div class="min-h-screen space-y-8 p-6 pb-20">
    <!-- Header with Gradient -->
    <div
        class="relative bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-3xl p-8 text-white overflow-hidden shadow-2xl"
    >
        <div
            class="absolute inset-0 bg-white/10 opacity-20 pattern-dots pointer-events-none"
        ></div>
        <div
            class="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        >
            <div>
                <Button
                    href="/purchase-returns"
                    variant="ghost"
                    size="sm"
                    class="text-white/80 hover:text-white hover:bg-white/10 p-0 h-auto mb-2 font-normal"
                >
                    <ArrowLeft class="mr-1 h-4 w-4" /> Kembali ke Gudang Retur
                </Button>
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <PackagePlus class="h-6 w-6 text-white" />
                    </div>
                    <h1 class="text-3xl font-bold tracking-tight text-white">
                        Catat Barang Rusak
                    </h1>
                </div>
                <p class="text-white/80 max-w-xl mt-1">
                    Input manual barang rusak yang ditemukan di gudang (tanpa
                    lewat POS).
                </p>
            </div>
        </div>
    </div>

    <div in:fade class="grid md:grid-cols-3 gap-6">
        <!-- Main Form -->
        <div class="md:col-span-2 space-y-6">
            <Card
                class="bg-card/80 backdrop-blur-sm border-t-4 border-t-violet-500 shadow-md"
            >
                <CardHeader>
                    <CardTitle>Form Input</CardTitle>
                    <CardDescription
                        >Pilih produk dan batch untuk memindahkan stok ke gudang
                        retur.</CardDescription
                    >
                </CardHeader>
                <CardContent class="space-y-6">
                    <!-- Product Selection -->
                    <div class="space-y-2">
                        <Label>Produk</Label>
                        <Combobox
                            items={productOptions}
                            placeholder="Cari Produk..."
                            bind:value={selectedProductId}
                            class="w-full"
                        />
                    </div>

                    <!-- Batch Selection -->
                    <div class="space-y-2">
                        <Label>Pilih Batch / Varian Stok</Label>
                        <Select
                            type="single"
                            bind:value={selectedBatchId}
                            disabled={!selectedProductId}
                        >
                            <SelectTrigger class="w-full">
                                {#if selectedBatchId && batchesQuery.data}
                                    {@const b = batchesQuery.data.find(
                                        (b: any) => b.id === selectedBatchId,
                                    )}
                                    {b
                                        ? `${b.variant || "Original"} (Stok: ${b.currentStock}) - ${b.supplierName || "Unknown"}`
                                        : "Pilih Batch"}
                                {:else}
                                    Pilih Batch
                                {/if}
                            </SelectTrigger>
                            <SelectContent class="max-h-[300px]">
                                {#if batchesQuery.isLoading}
                                    <div
                                        class="p-2 text-center text-sm text-muted-foreground"
                                    >
                                        Memuat batch...
                                    </div>
                                {:else if batchesQuery.data}
                                    {#each batchesQuery.data as batch}
                                        <SelectItem
                                            value={batch.id}
                                            disabled={batch.currentStock <= 0}
                                        >
                                            <div
                                                class="flex flex-col gap-1 py-1"
                                            >
                                                <div
                                                    class="flex items-center gap-2 font-medium"
                                                >
                                                    <span
                                                        >{batch.variant ||
                                                            "Original"}</span
                                                    >
                                                    {#if batch.currentStock <= 0}
                                                        <Badge
                                                            variant="destructive"
                                                            class="h-4 px-1 text-[10px]"
                                                            >Habis</Badge
                                                        >
                                                    {:else}
                                                        <Badge
                                                            variant="secondary"
                                                            class="h-4 px-1 text-[10px] bg-green-100 text-green-700 hover:bg-green-100"
                                                            >Stok: {batch.currentStock}</Badge
                                                        >
                                                    {/if}
                                                </div>
                                                <div
                                                    class="text-xs text-muted-foreground flex items-center gap-1"
                                                >
                                                    <Warehouse
                                                        class="h-3 w-3"
                                                    />
                                                    {batch.supplierName ||
                                                        "No Supplier info"}
                                                </div>
                                            </div>
                                        </SelectItem>
                                    {/each}
                                    {#if batchesQuery.data.length === 0}
                                        <div
                                            class="p-4 text-center text-sm text-muted-foreground"
                                        >
                                            Tidak ada stok tersedia
                                        </div>
                                    {/if}
                                {/if}
                            </SelectContent>
                        </Select>
                    </div>

                    <div class="grid grid-cols-2 gap-6">
                        <!-- Qty Input -->
                        <div class="space-y-2">
                            <Label>Jumlah Rusak</Label>
                            <Input
                                type="number"
                                min="1"
                                max={selectedBatch?.currentStock || 9999}
                                bind:value={qty}
                                class="text-lg font-bold"
                                disabled={!selectedBatchId}
                            />
                            {#if selectedBatch}
                                <p
                                    class="text-[10px] text-muted-foreground text-right"
                                >
                                    Maks: {selectedBatch.currentStock}
                                </p>
                            {/if}
                        </div>

                        <!-- Reason Input -->
                        <div class="space-y-2">
                            <Label>Keterangan</Label>
                            <Select type="single" bind:value={reason}>
                                <SelectTrigger>
                                    {reason || "Pilih Alasan"}
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Rusak/Cacat Fisik"
                                        >Rusak/Cacat Fisik</SelectItem
                                    >
                                    <SelectItem value="Expired/Kadaluarsa"
                                        >Expired/Kadaluarsa</SelectItem
                                    >
                                    <SelectItem value="Salah Kirim/Order"
                                        >Salah Kirim/Order</SelectItem
                                    >
                                    <SelectItem value="Lost/Hilang"
                                        >Lost/Hilang</SelectItem
                                    >
                                    <SelectItem value="Lainnya"
                                        >Lainnya</SelectItem
                                    >
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {#if reason === "Lainnya"}
                        <div in:fly={{ y: 5 }} class="space-y-2">
                            <Label>Detail Alasan</Label>
                            <Input
                                placeholder="Jelaskan detail kerusakan..."
                                oninput={(e) =>
                                    (reason = e.currentTarget.value)}
                            />
                        </div>
                    {/if}

                    <div class="pt-6">
                        <Button
                            class="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold h-11"
                            onclick={handleSubmit}
                            disabled={isSubmitting ||
                                !selectedBatchId ||
                                qty <= 0}
                        >
                            {#if isSubmitting}
                                <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                                Menyimpan...
                            {:else}
                                <AlertTriangle class="mr-2 h-4 w-4" />
                                Simpan ke Gudang Retur
                            {/if}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>

        <!-- Right Column: Info -->
        <div class="space-y-6">
            <Card
                class="bg-violet-50/50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-800"
            >
                <CardHeader>
                    <CardTitle
                        class="text-base text-violet-700 dark:text-violet-400 flex items-center gap-2"
                    >
                        <Boxes class="h-4 w-4" /> Informasi Stok
                    </CardTitle>
                </CardHeader>
                <CardContent class="space-y-4 text-sm">
                    {#if selectedBatch}
                        <div in:fly={{ y: 10 }} class="space-y-3">
                            <div
                                class="flex justify-between border-b pb-2 border-dashed border-violet-200"
                            >
                                <span class="text-muted-foreground">Varian</span
                                >
                                <span class="font-bold"
                                    >{selectedBatch.variant || "Original"}</span
                                >
                            </div>
                            <div
                                class="flex justify-between border-b pb-2 border-dashed border-violet-200"
                            >
                                <span class="text-muted-foreground"
                                    >Supplier</span
                                >
                                <span
                                    class="font-medium text-right max-w-[150px] truncate"
                                    >{selectedBatch.supplierName}</span
                                >
                            </div>
                            <div class="flex justify-between items-center pt-1">
                                <span class="text-muted-foreground"
                                    >Stok Aktif</span
                                >
                                <Badge
                                    variant="outline"
                                    class="bg-background text-lg font-mono px-3 py-1 border-violet-300"
                                >
                                    {selectedBatch.currentStock}
                                </Badge>
                            </div>
                        </div>
                    {:else}
                        <div
                            class="text-center py-6 text-muted-foreground italic opacity-70"
                        >
                            Pilih produk dan batch untuk melihat detail stok.
                        </div>
                    {/if}
                </CardContent>
            </Card>

            <div
                class="p-4 rounded-xl bg-orange-50 border border-orange-100 text-orange-800 text-xs space-y-2"
            >
                <div class="flex items-center gap-2 font-bold mb-1">
                    <FileWarning class="h-4 w-4" />
                    Penting
                </div>
                <p>
                    Barang yang dicatat di sini akan <strong
                        >mengurangi stok aktif</strong
                    >
                    dan dipindahkan ke
                    <strong>Virtual Gudang Retur (Staging)</strong>.
                </p>
                <p>
                    Barang di staging area belum diretur ke supplier. Anda harus
                    membuat dokumen retur dari halaman utama.
                </p>
            </div>
        </div>
    </div>
</div>
