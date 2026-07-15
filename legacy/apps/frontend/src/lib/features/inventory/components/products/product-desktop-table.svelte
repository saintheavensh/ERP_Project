<script lang="ts">
    import { ProductListController } from "$lib/features/inventory/products/controllers/product-list.controller.svelte";
    import { Skeleton } from "$lib/shared/components/ui/skeleton";
    import { Badge } from "$lib/shared/components/ui/badge";
    import { Button, buttonVariants } from "$lib/shared/components/ui/button";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/shared/components/ui/table";
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuSeparator,
        DropdownMenuTrigger,
    } from "$lib/shared/components/ui/dropdown-menu";
    import {
        ArrowUpDown,
        ChevronRight,
        ChevronDown,
        MoreHorizontal,
        Pencil,
        Trash2,
        Boxes,
    } from "lucide-svelte";

    interface Props {
        controller: ProductListController;
    }

    let { controller }: Props = $props();
</script>

<div
    class="hidden md:block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm"
>
    <Table>
        <TableHeader class="bg-slate-50/50 dark:bg-slate-900/50">
            <TableRow
                class="hover:bg-transparent border-slate-100 dark:border-slate-800"
            >
                <TableHead class="w-[50px]"></TableHead>
                <TableHead class="w-[120px]">
                    <Button
                        variant="ghost"
                        onclick={() => controller.toggleSort("code")}
                        class="h-8 -ml-3 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                    >
                        Code <ArrowUpDown class="ml-2 h-3 w-3" />
                    </Button>
                </TableHead>
                <TableHead>
                    <Button
                        variant="ghost"
                        onclick={() => controller.toggleSort("name")}
                        class="h-8 -ml-3 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                    >
                        Product Name <ArrowUpDown class="ml-2 h-3 w-3" />
                    </Button>
                </TableHead>
                <TableHead>
                    <Button
                        variant="ghost"
                        onclick={() => controller.toggleSort("categoryName")}
                        class="h-8 -ml-3 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                    >
                        Category <ArrowUpDown class="ml-2 h-3 w-3" />
                    </Button>
                </TableHead>
                <TableHead class="text-right">
                    <Button
                        variant="ghost"
                        onclick={() => controller.toggleSort("stock")}
                        class="h-8 px-0 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                    >
                        Total Stock <ArrowUpDown class="ml-2 h-3 w-3" />
                    </Button>
                </TableHead>
                <TableHead class="text-center">
                    <Button
                        variant="ghost"
                        onclick={() => controller.toggleSort("status")}
                        class="h-8 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                    >
                        Status <ArrowUpDown class="ml-2 h-3 w-3" />
                    </Button>
                </TableHead>
                <TableHead
                    class="text-right text-xs font-bold uppercase tracking-wider text-slate-500"
                    >Actions</TableHead
                >
            </TableRow>
        </TableHeader>
        <TableBody>
            {#if controller.loading}
                {#each Array(5) as _}
                    <TableRow class="border-slate-50 dark:border-slate-800">
                        <TableCell
                            ><Skeleton class="h-8 w-8 rounded-md" /></TableCell
                        >
                        <TableCell><Skeleton class="h-4 w-[80px]" /></TableCell>
                        <TableCell><Skeleton class="h-4 w-[200px]" /></TableCell
                        >
                        <TableCell><Skeleton class="h-4 w-[100px]" /></TableCell
                        >
                        <TableCell class="text-right"
                            ><Skeleton
                                class="h-4 w-[40px] ml-auto"
                            /></TableCell
                        >
                        <TableCell class="text-center"
                            ><Skeleton
                                class="h-6 w-[80px] rounded-full mx-auto"
                            /></TableCell
                        >
                        <TableCell class="text-right"
                            ><Skeleton class="h-8 w-8 ml-auto" /></TableCell
                        >
                    </TableRow>
                {/each}
            {:else if controller.filteredProducts.length === 0}
                <TableRow>
                    <TableCell
                        colspan={7}
                        class="h-32 text-center text-slate-500"
                    >
                        No products found matching your search.
                    </TableCell>
                </TableRow>
            {:else}
                {#each controller.filteredProducts as product}
                    <TableRow
                        class="border-slate-50 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors {controller.expandedProductId ===
                        product.id
                            ? 'bg-slate-50/80 dark:bg-slate-800/50'
                            : ''}"
                    >
                        <TableCell>
                            <Button
                                variant="ghost"
                                size="icon"
                                class="h-8 w-8 text-slate-400 hover:text-blue-600"
                                onclick={() =>
                                    controller.toggleExpanded(product.id)}
                            >
                                {#if controller.expandedProductId === product.id}
                                    <ChevronDown class="h-4 w-4" />
                                {:else}
                                    <ChevronRight class="h-4 w-4" />
                                {/if}
                            </Button>
                        </TableCell>
                        <TableCell class="font-mono text-xs text-slate-500">
                            {product.code || "-"}
                        </TableCell>
                        <TableCell>
                            <div
                                class="font-medium text-slate-700 dark:text-slate-200"
                            >
                                {product.name}
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge
                                variant="secondary"
                                class="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-normal hover:bg-slate-200"
                            >
                                {product.categoryName}
                            </Badge>
                        </TableCell>
                        <TableCell class="text-right font-bold w-[120px]">
                            <span
                                class:text-red-500={product.stock === 0}
                                class:text-yellow-600={product.status ===
                                    "Critical"}
                                class:text-slate-700={product.stock >
                                    (product.minStock || 5)}
                            >
                                {product.stock}
                            </span>
                        </TableCell>
                        <TableCell class="text-center w-[120px]">
                            {#if product.status === "Normal"}
                                <Badge
                                    variant="outline"
                                    class="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30"
                                    >In Stock</Badge
                                >
                            {:else if product.status === "Critical"}
                                <Badge
                                    variant="outline"
                                    class="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30"
                                    >Low Stock</Badge
                                >
                            {:else}
                                <Badge variant="destructive">Out of Stock</Badge
                                >
                            {/if}
                        </TableCell>
                        <TableCell class="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    class={buttonVariants({
                                        variant: "ghost",
                                        size: "icon",
                                        className:
                                            "h-8 w-8 text-slate-400 hover:text-slate-900 dark:hover:text-white",
                                    })}
                                >
                                    <MoreHorizontal class="h-4 w-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onclick={() =>
                                            controller.handleEdit(product)}
                                    >
                                        <Pencil class="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        class="text-red-600 focus:text-red-700 focus:bg-red-50"
                                        onclick={() =>
                                            controller.confirmDelete(
                                                product.id,
                                            )}
                                    >
                                        <Trash2 class="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    <!-- Expanded Row for Batches -->
                    {#if controller.expandedProductId === product.id}
                        <TableRow
                            class="bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50/50"
                        >
                            <TableCell
                                colspan={7}
                                class="p-4 pt-0 border-b border-slate-100 dark:border-slate-800"
                            >
                                <div
                                    class="ml-10 mt-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm animate-in fade-in zoom-in-95 duration-200"
                                >
                                    <div
                                        class="flex items-center justify-between mb-3"
                                    >
                                        <h4
                                            class="font-semibold text-sm flex items-center gap-2 text-slate-700 dark:text-slate-300"
                                        >
                                            <Boxes class="h-4 w-4" /> Stock Batches
                                        </h4>
                                    </div>

                                    {#if !product.batches || product.batches.length === 0}
                                        <div
                                            class="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg"
                                        >
                                            No stock batches found.
                                        </div>
                                    {:else}
                                        {@const batchesBySup =
                                            controller.groupBatchesBySupplier(
                                                product.batches || [],
                                            )}

                                        <div class="grid gap-4">
                                            {#each Object.entries(batchesBySup) as [supplier, batches]}
                                                <div class="space-y-2">
                                                    <div
                                                        class="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"
                                                    >
                                                        <div
                                                            class="w-1.5 h-1.5 bg-blue-500 rounded-full"
                                                        ></div>
                                                        {supplier}
                                                    </div>
                                                    <div
                                                        class="rounded-lg border border-slate-100 dark:border-slate-800 overflow-hidden"
                                                    >
                                                        <Table>
                                                            <TableHeader
                                                                class="bg-slate-50/50 dark:bg-slate-900/50"
                                                            >
                                                                <TableRow
                                                                    class="h-7 hover:bg-transparent border-none"
                                                                >
                                                                    <TableHead
                                                                        class="h-7 text-[10px] font-semibold text-slate-500"
                                                                        >BATCH
                                                                        ID</TableHead
                                                                    >
                                                                    <TableHead
                                                                        class="h-7 text-[10px] font-semibold text-slate-500"
                                                                        >VARIANT</TableHead
                                                                    >
                                                                    <TableHead
                                                                        class="h-7 text-[10px] font-semibold text-slate-500 text-right"
                                                                        >BUY
                                                                        PRICE</TableHead
                                                                    >
                                                                    <TableHead
                                                                        class="h-7 text-[10px] font-semibold text-slate-500 text-right"
                                                                        >SELL
                                                                        PRICE</TableHead
                                                                    >
                                                                    <TableHead
                                                                        class="h-7 text-[10px] font-semibold text-slate-500 text-right"
                                                                        >REMAINING</TableHead
                                                                    >
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {#each batches as any as batch}
                                                                    <TableRow
                                                                        class="h-8 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-slate-50 dark:border-slate-800"
                                                                    >
                                                                        <TableCell
                                                                            class="py-1 font-mono text-[10px] text-slate-400"
                                                                            >{batch.id.substring(
                                                                                0,
                                                                                8,
                                                                            )}</TableCell
                                                                        >
                                                                        <TableCell
                                                                            class="py-1 text-[10px]"
                                                                        >
                                                                            {#if batch.variant && batch.variant !== "Default"}
                                                                                <Badge
                                                                                    variant="secondary"
                                                                                    class="text-[9px] px-1.5 h-4"
                                                                                >
                                                                                    {batch.variant}
                                                                                </Badge>
                                                                            {:else}
                                                                                <span
                                                                                    class="text-slate-400 italic"
                                                                                    >-</span
                                                                                >
                                                                            {/if}
                                                                        </TableCell>
                                                                        <TableCell
                                                                            class="py-1 text-right font-mono text-[10px]"
                                                                        >
                                                                            {new Intl.NumberFormat(
                                                                                "id-ID",
                                                                                {
                                                                                    style: "currency",
                                                                                    currency:
                                                                                        "IDR",
                                                                                    maximumFractionDigits: 0,
                                                                                },
                                                                            ).format(
                                                                                batch.buyPrice,
                                                                            )}
                                                                        </TableCell>
                                                                        <TableCell
                                                                            class="py-1 text-right font-mono text-[10px]"
                                                                        >
                                                                            {new Intl.NumberFormat(
                                                                                "id-ID",
                                                                                {
                                                                                    style: "currency",
                                                                                    currency:
                                                                                        "IDR",
                                                                                    maximumFractionDigits: 0,
                                                                                },
                                                                            ).format(
                                                                                batch.sellPrice,
                                                                            )}
                                                                        </TableCell>
                                                                        <TableCell
                                                                            class="py-1 text-right font-bold text-[10px] {batch.currentStock >
                                                                            0
                                                                                ? 'text-green-600'
                                                                                : 'text-slate-400'}"
                                                                        >
                                                                            {batch.currentStock}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                {/each}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                </div>
                                            {/each}
                                        </div>
                                    {/if}
                                </div>
                            </TableCell>
                        </TableRow>
                    {/if}
                {/each}
            {/if}
        </TableBody>
    </Table>
</div>
