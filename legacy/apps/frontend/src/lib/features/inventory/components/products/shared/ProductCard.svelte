<script lang="ts">
    import { Card, CardContent } from "$lib/shared/components/ui/card";
    import { Button } from "$lib/shared/components/ui/button";
    import { Badge } from "$lib/shared/components/ui/badge";
    import ProductImage from "./ProductImage.svelte";
    import type { Product } from "$lib/features/inventory/types/products.types";
    import { ShoppingCart, Check } from "lucide-svelte";

    let {
        product,
        showAction = true,
        actionLabel = "Add to Cart",
        onAction,
    }: {
        product: Product;
        showAction?: boolean;
        actionLabel?: string;
        onAction?: (p: Product) => void;
    } = $props();

    function formatCurrency(amount: number) {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    }
</script>

<Card class="overflow-hidden group hover:shadow-md transition-shadow">
    <CardContent class="p-0">
        <div class="p-4 flex gap-4">
            <ProductImage
                src={product.image}
                alt={product.name}
                className="h-20 w-20 shrink-0"
            />

            <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start gap-2">
                    <h3
                        class="font-semibold text-slate-900 dark:text-white truncate"
                        title={product.name}
                    >
                        {product.name}
                    </h3>
                    <Badge
                        variant={product.stock > 0 ? "default" : "destructive"}
                        class="shrink-0"
                    >
                        {product.stock} pcs
                    </Badge>
                </div>

                <p class="text-xs text-slate-500 font-mono mt-0.5">
                    {product.sku}
                </p>

                <div class="mt-2 flex items-center justify-between">
                    <span
                        class="text-lg font-bold text-blue-600 dark:text-blue-400"
                    >
                        {formatCurrency(product.price)}
                    </span>

                    {#if showAction}
                        <Button
                            size="sm"
                            variant={product.stock > 0 ? "default" : "outline"}
                            disabled={product.stock <= 0}
                            onclick={() => onAction?.(product)}
                            class="h-8 group"
                        >
                            {#if actionLabel === "Add to Cart"}
                                <ShoppingCart class="h-4 w-4 mr-2" />
                            {/if}
                            {actionLabel}
                        </Button>
                    {/if}
                </div>
            </div>
        </div>

        {#if product.category || product.location}
            <div
                class="bg-slate-50 dark:bg-slate-900/50 px-4 py-2 flex gap-3 border-t border-slate-100 dark:border-slate-800"
            >
                {#if product.category}
                    <span class="text-[10px] uppercase font-bold text-slate-400"
                        >{product.category}</span
                    >
                {/if}
                {#if product.location}
                    <span
                        class="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1"
                    >
                        <Check class="h-3 w-3" />
                        {product.location}
                    </span>
                {/if}
            </div>
        {/if}
    </CardContent>
</Card>
