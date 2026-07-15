<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
    } from "$lib/shared/components/ui/dialog";
    import { Loader2 } from "lucide-svelte";
    import { ProductFormController } from "$lib/features/inventory/products/controllers/product-form.controller.svelte";

    // Sub-components
    import ProductGeneralInfo from "./product-form/product-general-info.svelte";
    import ProductCompatibilityInput from "./product-form/product-compatibility-input.svelte";
    import ProductDetails from "./product-form/product-details.svelte";

    let {
        open = $bindable(false),
        editData = null,
        onClose,
    } = $props<{
        open: boolean;
        editData?: any;
        onClose?: () => void;
    }>();

    const controller = new ProductFormController();

    // Effect to populate form on open/editData change
    $effect(() => {
        if (open) {
            controller.init(editData, onClose);
        }
    });

    function handleOpenChange(isOpen: boolean) {
        open = isOpen;
        if (!isOpen) {
            controller.reset();
        }
    }
</script>

<Dialog bind:open onOpenChange={handleOpenChange}>
    <DialogContent
        class="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0"
    >
        <DialogHeader
            class="px-6 py-4 border-b sticky top-0 z-10 bg-background/95 backdrop-blur-sm"
        >
            <DialogTitle class="text-xl font-bold tracking-tight text-primary">
                {editData ? "Edit Master Produk" : "Buat Master Produk Baru"}
            </DialogTitle>
            <DialogDescription>
                Buat template produk. Stok masuk dilakukan melalui menu <b
                    >Pembelian</b
                >.
            </DialogDescription>
        </DialogHeader>

        <div class="flex-1 overflow-y-auto p-6">
            <div class="space-y-6 mt-0">
                <!-- Kategori & Code Row -->
                <ProductGeneralInfo {controller} />

                <!-- Name with Autocomplete Device Suggestions -->
                <ProductCompatibilityInput {controller} />

                <!-- Image & Details Row -->
                <ProductDetails {controller} />
            </div>
        </div>

        <DialogFooter
            class="px-6 py-4 border-t flex items-center justify-between sm:justify-end gap-3 sticky bottom-0 z-10 bg-background/95 backdrop-blur-sm"
        >
            <Button variant="outline" onclick={() => (open = false)}
                >Batal</Button
            >
            <Button
                onclick={() => controller.handleSubmit()}
                disabled={controller.isSubmitting}
                class="min-w-[120px]"
            >
                {#if controller.isSubmitting}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                    {editData ? "Menyimpan" : "Simpan"}
                {:else}
                    {editData ? "Simpan Perubahan" : "Simpan Produk"}
                {/if}
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
