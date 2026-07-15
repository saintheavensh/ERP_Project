<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import { Badge } from "$lib/shared/components/ui/badge";
    import { Package, Plus } from "lucide-svelte";
    import * as Popover from "$lib/shared/components/ui/popover";
    import { formatCurrency } from "$lib/shared/lib/utils";
    import type { SalesController } from "./sales.controller.svelte";

    let { controller, product }: { controller: SalesController; product: any } =
        $props();
</script>

<div
    class="group relative flex flex-col bg-card border rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30"
>
    <!-- Image Thumbnail -->
    <div
        class="aspect-[4/3] bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center relative overflow-hidden"
    >
        {#if product.image}
            <img
                src={product.image}
                alt={product.name}
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
        {:else}
            <Package class="h-10 w-10 text-muted-foreground/20" />
        {/if}

        <!-- Code Badge -->
        {#if product.code}
            <div class="absolute top-2 left-2">
                <Badge
                    variant="secondary"
                    class="bg-background/80 backdrop-blur text-[10px] font-mono shadow-sm px-1.5 h-5 border-0"
                >
                    {product.code}
                </Badge>
            </div>
        {/if}
    </div>

    <div class="p-3 flex flex-col flex-1 gap-1.5">
        <h3
            class="font-semibold text-sm line-clamp-2 leading-tight min-h-[2.5em] group-hover:text-blue-600 transition-colors"
        >
            {product.name}
        </h3>

        <div class="mt-auto pt-2 space-y-2">
            {#if !product.variants || product.variants.length === 0}
                <Button
                    variant="secondary"
                    size="sm"
                    disabled
                    class="w-full h-8 text-xs bg-red-50 text-red-600 dark:bg-red-900/20"
                >
                    Stok Habis
                </Button>
            {:else}
                <div class="space-y-1.5">
                    {#each product.variants.slice(0, 2) as v}
                        <button
                            class="w-full flex items-center justify-between p-2 rounded-lg border border-transparent bg-secondary/30 hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20 dark:hover:border-blue-800 transition-all group/btn text-left"
                            onclick={() => controller.addToCart(product, v)}
                        >
                            <div class="flex flex-col min-w-0">
                                {#if v.name}
                                    <span class="text-xs font-medium truncate"
                                        >{v.name}</span
                                    >
                                {/if}
                                <span class="text-[10px] text-muted-foreground"
                                    >Stok: {v.stock}</span
                                >
                            </div>
                            <div class="flex flex-col items-end pl-2">
                                <span
                                    class="text-xs font-bold text-blue-700 dark:text-blue-400"
                                    >{formatCurrency(v.price)}</span
                                >
                                <Plus
                                    class="h-3 w-3 opacity-0 group-hover/btn:opacity-100 transition-opacity text-blue-500"
                                />
                            </div>
                        </button>
                    {/each}

                    {#if product.variants.length > 2}
                        <Popover.Root>
                            <Popover.Trigger class="w-full">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    class="w-full h-7 text-[10px] text-muted-foreground"
                                >
                                    +{product.variants.length - 2} Varian Lainnya
                                </Button>
                            </Popover.Trigger>
                            <Popover.Content class="w-56 p-2">
                                <div class="space-y-1">
                                    <p
                                        class="text-xs font-semibold px-2 mb-2 text-muted-foreground"
                                    >
                                        Pilih Varian {product.name}
                                    </p>
                                    {#each product.variants.slice(2) as v}
                                        <button
                                            class="w-full flex items-center justify-between p-2 rounded-md hover:bg-accent text-left text-xs"
                                            onclick={() =>
                                                controller.addToCart(
                                                    product,
                                                    v,
                                                )}
                                        >
                                            <span
                                                >{v.name}
                                                ({v.stock})</span
                                            >
                                            <span class="font-bold"
                                                >{formatCurrency(v.price)}</span
                                            >
                                        </button>
                                    {/each}
                                </div>
                            </Popover.Content>
                        </Popover.Root>
                    {/if}
                </div>
            {/if}
        </div>
    </div>
</div>
