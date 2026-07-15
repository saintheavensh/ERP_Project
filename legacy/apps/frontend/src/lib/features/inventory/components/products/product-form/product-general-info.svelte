<script lang="ts">
    import { Input } from "$lib/shared/components/ui/input";
    import { Button } from "$lib/shared/components/ui/button";
    import { Label } from "$lib/shared/components/ui/label";
    import { Smartphone, Filter } from "lucide-svelte";
    import { ProductFormController } from "$lib/features/inventory/products/controllers/product-form.controller.svelte";

    let { controller } = $props<{ controller: ProductFormController }>();
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="space-y-2">
        <Label class="text-sm font-medium"
            >Kategori Produk <span class="text-destructive">*</span></Label
        >
        <div class="relative">
            {#if controller.categoriesQuery.isLoading}
                <div
                    class="h-10 w-full animate-pulse rounded-md bg-secondary"
                ></div>
            {:else}
                <select
                    bind:value={controller.categoryId}
                    class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <option value="">-- Pilih Kategori --</option>
                    {#each controller.hierarchicalCategories as cat}
                        <option value={cat.id}>
                            {@html "&nbsp;".repeat(cat.level * 4)}
                            {cat.level > 0 ? "↳ " : ""}{cat.name}
                        </option>
                    {/each}
                </select>
            {/if}
        </div>
    </div>

    <div class="space-y-2">
        <Label class="text-sm font-medium">Kode SKU / Barcode</Label>
        <div class="flex gap-2">
            <div class="relative flex-1">
                <Input
                    bind:value={controller.code}
                    placeholder="Scan atau Auto-generate"
                    class="pl-9 font-mono"
                />
                <Smartphone
                    class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"
                />
            </div>
            <Button
                variant="outline"
                size="icon"
                onclick={() => controller.generateCode()}
                title="Generate Otomatis"
                disabled={!controller.categoryId}
            >
                <Filter class="h-4 w-4" />
            </Button>
        </div>
        <p class="text-[10px] text-muted-foreground">Otomatis / Scan</p>
    </div>
</div>
