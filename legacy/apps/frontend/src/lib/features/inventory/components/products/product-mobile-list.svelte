<script lang="ts">
    import { ProductListController } from "$lib/features/inventory/products/controllers/product-list.controller.svelte";
    import { Skeleton } from "$lib/shared/components/ui/skeleton";
    import { Badge } from "$lib/shared/components/ui/badge";
    import { Button, buttonVariants } from "$lib/shared/components/ui/button";
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuSeparator,
        DropdownMenuTrigger,
    } from "$lib/shared/components/ui/dropdown-menu";
    import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-svelte";

    interface Props {
        controller: ProductListController;
    }

    let { controller }: Props = $props();
</script>

<div class="grid gap-4 md:hidden">
    {#if controller.loading}
        {#each Array(3) as _}
            <div
                class="border rounded-xl p-4 space-y-3 bg-white dark:bg-slate-900 shadow-sm"
            >
                <Skeleton class="h-4 w-1/3" />
                <Skeleton class="h-4 w-2/3" />
                <Skeleton class="h-8 w-full" />
            </div>
        {/each}
    {:else if controller.filteredProducts.length === 0}
        <div
            class="text-center py-12 text-muted-foreground border border-dashed rounded-xl bg-slate-50/50"
        >
            No products found matching your criteria.
        </div>
    {:else}
        {#each controller.filteredProducts as product}
            <div
                class="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3"
            >
                <div class="flex justify-between items-start">
                    <div>
                        <div
                            class="text-[10px] font-mono text-slate-500 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md inline-block mb-1"
                        >
                            {product.code || "-"}
                        </div>
                        <h3
                            class="font-semibold text-base leading-tight text-slate-900 dark:text-white"
                        >
                            {product.name}
                        </h3>
                    </div>
                    <div class="flex-shrink-0">
                        {#if product.status === "Normal"}
                            <Badge
                                variant="outline"
                                class="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30 font-medium"
                                >In Stock</Badge
                            >
                        {:else if product.status === "Critical"}
                            <Badge
                                variant="outline"
                                class="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30 font-medium"
                                >Low Stock</Badge
                            >
                        {:else}
                            <Badge
                                variant="destructive"
                                class="font-medium shadow-sm"
                                >Out of Stock</Badge
                            >
                        {/if}
                    </div>
                </div>

                <div
                    class="flex items-center justify-between text-sm pt-2 border-t border-slate-50 dark:border-slate-800"
                >
                    <Badge
                        variant="secondary"
                        class="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-normal"
                    >
                        {product.categoryName}
                    </Badge>
                    <div class="text-right">
                        <div
                            class="text-[10px] uppercase text-slate-400 font-semibold"
                        >
                            Total Stock
                        </div>
                        <div
                            class="font-mono font-bold text-slate-900 dark:text-slate-100"
                            class:text-red-500={product.stock === 0}
                            class:text-yellow-600={product.status ===
                                "Critical"}
                        >
                            {product.stock}
                        </div>
                    </div>
                </div>

                <div class="pt-3 flex justify-end gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        class="h-8 text-xs flex-1 border-slate-200 dark:border-slate-800"
                        onclick={() => controller.handleDetail(product)}
                    >
                        <Eye class="mr-1.5 h-3.5 w-3.5" /> Details
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            class={buttonVariants({
                                variant: "ghost",
                                size: "icon",
                                className:
                                    "h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800",
                            })}
                        >
                            <MoreHorizontal class="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onclick={() => controller.handleEdit(product)}
                            >
                                <Pencil class="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                class="text-red-600 focus:text-red-700 focus:bg-red-50"
                                onclick={() =>
                                    controller.confirmDelete(product.id)}
                            >
                                <Trash2 class="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        {/each}
    {/if}
</div>
