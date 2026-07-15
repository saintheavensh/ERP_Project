<script lang="ts">
    import ImageUpload from "$lib/shared/components/custom/image-upload.svelte";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import { ProductFormController } from "$lib/features/inventory/products/controllers/product-form.controller.svelte";

    let { controller } = $props<{ controller: ProductFormController }>();
</script>

<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- Image Upload - Left Column -->
    <div class="space-y-2">
        <Label class="text-sm font-medium">Gambar Produk</Label>
        <div class="h-36 rounded-xl border-2 border-muted bg-muted/5 p-2">
            <ImageUpload bind:value={controller.image} compact={true} />
        </div>
    </div>

    <!-- Min Stock - Middle Column -->
    <div class="space-y-2">
        <Label class="text-sm font-medium">Minimum Stok</Label>
        <Input
            type="number"
            bind:value={controller.minStock}
            min="0"
            class="h-11"
        />
        <p class="text-xs text-muted-foreground">
            Peringatan saat stok di bawah jumlah ini.
        </p>
    </div>

    <!-- Empty space or additional info - Right Column -->
    <div class="space-y-2">
        <Label class="text-sm font-medium text-muted-foreground">Info</Label>
        <div
            class="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900"
        >
            <p class="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                💡 Stok awal produk baru adalah <strong>0</strong>. Tambah stok
                melalui menu <strong>Pembelian</strong>.
            </p>
        </div>
    </div>
</div>
