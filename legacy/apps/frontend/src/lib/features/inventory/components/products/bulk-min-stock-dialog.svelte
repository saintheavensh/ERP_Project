<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
    } from "$lib/shared/components/ui/dialog";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/shared/components/ui/select";
    import { AlertTriangle, Loader2, Package, Settings2 } from "lucide-svelte";
    import { BulkStockController } from "$lib/features/inventory/products/controllers/bulk-stock.controller.svelte";

    // Props
    let { open = $bindable(false) } = $props();

    const controller = new BulkStockController();

    // Effects
    $effect(() => {
        controller.fetchProductCount();
    });

    function handleClose() {
        open = false;
        controller.reset();
    }

    function handleSubmit() {
        controller.handleSubmit(() => {
            handleClose();
        });
    }
</script>

<Dialog bind:open onOpenChange={(v) => !v && handleClose()}>
    <DialogContent class="sm:max-w-[480px]">
        <DialogHeader>
            <DialogTitle class="flex items-center gap-2">
                <Settings2 class="h-5 w-5 text-primary" />
                Ubah Minimum Stok per Kategori
            </DialogTitle>
            <DialogDescription>
                Ubah batas minimum stok untuk semua produk dalam satu kategori
                sekaligus.
            </DialogDescription>
        </DialogHeader>

        <div class="space-y-6 py-4">
            <!-- Category Selection -->
            <div class="space-y-2">
                <Label>Pilih Kategori</Label>
                <Select
                    type="single"
                    value={controller.selectedCategoryId}
                    onValueChange={(v) => (controller.selectedCategoryId = v)}
                >
                    <SelectTrigger class="w-full">
                        <span
                            class={controller.selectedCategoryId
                                ? ""
                                : "text-muted-foreground"}
                        >
                            {controller.selectedCategoryName ||
                                "Pilih kategori..."}
                        </span>
                    </SelectTrigger>
                    <SelectContent>
                        {#each controller.leafCategories as cat}
                            <SelectItem value={cat.id}>{cat.name}</SelectItem>
                        {/each}
                    </SelectContent>
                </Select>
            </div>

            <!-- Product Count Preview -->
            {#if controller.selectedCategoryId}
                <div
                    class="rounded-lg border-2 border-primary/20 bg-primary/5 p-4"
                >
                    <div class="flex items-center gap-3">
                        <div
                            class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"
                        >
                            <Package class="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <div class="text-sm text-muted-foreground">
                                Produk yang akan diubah
                            </div>
                            <div class="text-2xl font-bold text-primary">
                                {#if controller.isLoadingCount}
                                    <Loader2 class="h-5 w-5 animate-spin" />
                                {:else}
                                    {controller.productCount} produk
                                {/if}
                            </div>
                        </div>
                    </div>
                </div>
            {/if}

            <!-- Min Stock Input -->
            <div class="space-y-2">
                <Label for="minStock">Minimum Stok Baru</Label>
                <Input
                    id="minStock"
                    type="number"
                    bind:value={controller.minStock}
                    min="0"
                    class="text-lg font-semibold"
                    placeholder="Masukkan angka"
                />
                <p class="text-xs text-muted-foreground">
                    Produk dengan stok di bawah nilai ini akan ditandai sebagai
                    "Menipis"
                </p>
            </div>

            <!-- Warning -->
            {#if controller.productCount > 0 && controller.selectedCategoryId}
                <div
                    class="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3"
                >
                    <AlertTriangle
                        class="h-5 w-5 text-yellow-600 shrink-0 mt-0.5"
                    />
                    <div class="text-sm text-yellow-800">
                        <strong>Perhatian:</strong> Tindakan ini akan mengubah
                        minimum stok untuk
                        <strong>{controller.productCount}</strong> produk dalam
                        kategori
                        <strong>{controller.selectedCategoryName}</strong>.
                    </div>
                </div>
            {/if}
        </div>

        <DialogFooter>
            <Button
                variant="outline"
                onclick={handleClose}
                disabled={controller.isSubmitting}
            >
                Batal
            </Button>
            <Button
                onclick={handleSubmit}
                disabled={controller.isSubmitting ||
                    !controller.selectedCategoryId ||
                    controller.productCount === 0}
                class="min-w-[140px]"
            >
                {#if controller.isSubmitting}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                {:else}
                    Simpan Perubahan
                {/if}
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
