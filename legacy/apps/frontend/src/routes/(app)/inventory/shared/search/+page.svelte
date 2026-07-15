<script lang="ts">
    import { onMount } from "svelte";
    import { ProductsService as InventoryService } from "$lib/features/inventory/products/products.service";
    import SearchInput from "$lib/shared/components/custom/search-input.svelte";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/shared/components/ui/table";
    import { Badge } from "$lib/shared/components/ui/badge";
    import { Skeleton } from "$lib/shared/components/ui/skeleton";
    import {
        Package,
        Search,
        Tag,
        Boxes,
        AlertCircle,
        Info,
    } from "lucide-svelte";
    import { createQuery } from "@tanstack/svelte-query";
    import { cn } from "$lib/shared/lib/utils";

    let searchTerm = $state("");
    let debouncedSearch = $state("");
    let searchTimeout: any;

    $effect(() => {
        if (searchTimeout) clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            debouncedSearch = searchTerm;
        }, 300);
    });

    const searchProductQuery = createQuery(() => ({
        queryKey: ["globalProductSearch", debouncedSearch],
        queryFn: () => InventoryService.search(debouncedSearch),
    }));

    let products = $derived(searchProductQuery.data || []);
    let loading = $derived(searchProductQuery.isLoading);

    function formatCurrency(value: number) {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(value);
    }
</script>

<div class="space-y-6 animate-in fade-in duration-500 pb-10">
    <!-- Search Header -->
    <div
        class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-hidden relative"
    >
        <div
            class="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl"
        ></div>
        <div
            class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
            <div class="space-y-1">
                <div
                    class="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-widest"
                >
                    <Package class="h-4 w-4" />
                    <span>Global Stock Check</span>
                </div>
                <h2 class="text-2xl font-bold text-slate-900 dark:text-white">
                    Product & Stock Lookup
                </h2>
                <p class="text-slate-500 dark:text-slate-400 text-sm">
                    Quickly search for product variants, pricing, and
                    availability across all departments.
                </p>
            </div>
            <div class="relative w-full md:w-[400px]">
                <SearchInput
                    bind:value={searchTerm}
                    placeholder="Search name, code, or SKU..."
                    class="w-full bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-inner"
                />
            </div>
        </div>
    </div>

    <!-- Results Table -->
    <div
        class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden"
    >
        <Table>
            <TableHeader class="bg-slate-50/50 dark:bg-slate-900/50">
                <TableRow
                    class="hover:bg-transparent border-slate-100 dark:border-slate-800"
                >
                    <TableHead
                        class="w-[150px] font-bold text-xs uppercase tracking-wider"
                        >Universal Code</TableHead
                    >
                    <TableHead
                        class="font-bold text-xs uppercase tracking-wider"
                        >Product Name (Variant)</TableHead
                    >
                    <TableHead
                        class="font-bold text-xs uppercase tracking-wider"
                        >Category</TableHead
                    >
                    <TableHead
                        class="font-bold text-xs uppercase tracking-wider text-right"
                        >Price</TableHead
                    >
                    <TableHead
                        class="font-bold text-xs uppercase tracking-wider text-right"
                        >Stock</TableHead
                    >
                </TableRow>
            </TableHeader>
            <TableBody>
                {#if loading}
                    {#each Array(8) as _}
                        <TableRow class="border-slate-50 dark:border-slate-800">
                            <TableCell><Skeleton class="h-4 w-20" /></TableCell>
                            <TableCell><Skeleton class="h-4 w-48" /></TableCell>
                            <TableCell><Skeleton class="h-4 w-24" /></TableCell>
                            <TableCell class="text-right"
                                ><Skeleton
                                    class="h-4 w-20 ml-auto"
                                /></TableCell
                            >
                            <TableCell class="text-right"
                                ><Skeleton
                                    class="h-4 w-12 ml-auto"
                                /></TableCell
                            >
                        </TableRow>
                    {/each}
                {:else if products.length === 0}
                    <TableRow>
                        <TableCell colspan={5} class="h-[400px] text-center">
                            <div
                                class="flex flex-col items-center justify-center space-y-3 text-slate-400"
                            >
                                <Search class="h-12 w-12 opacity-20" />
                                <p class="text-lg font-medium opacity-50">
                                    No products found
                                </p>
                                <p class="text-sm opacity-50">
                                    Try searching for a product name, code, or
                                    SKU
                                </p>
                            </div>
                        </TableCell>
                    </TableRow>
                {:else}
                    {#each products as product}
                        <TableRow
                            class="border-slate-50 dark:border-slate-800 group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
                        >
                            <TableCell
                                class="font-mono text-xs text-slate-500 font-medium"
                            >
                                {product.universalCode || product.sku || "-"}
                            </TableCell>
                            <TableCell>
                                <div class="flex flex-col">
                                    <span
                                        class="font-semibold text-slate-700 dark:text-slate-200 capitalize"
                                    >
                                        {product.productName}
                                    </span>
                                    {#if product.variantName && product.variantName !== "Default"}
                                        <span
                                            class="text-[10px] text-slate-400 font-medium uppercase tracking-tight"
                                        >
                                            {product.variantName}
                                        </span>
                                    {/if}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant="secondary"
                                    class="font-normal border-slate-200/50 bg-slate-100/50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 capitalize"
                                >
                                    {product.categoryName || "Uncategorized"}
                                </Badge>
                            </TableCell>
                            <TableCell
                                class="text-right font-bold text-slate-900 dark:text-slate-100"
                            >
                                {formatCurrency(product.price)}
                            </TableCell>
                            <TableCell class="text-right">
                                <div
                                    class="flex items-center justify-end gap-2"
                                >
                                    <span
                                        class={cn(
                                            "font-black text-lg",
                                            product.stock <= 0
                                                ? "text-red-500"
                                                : product.stock <= 5
                                                  ? "text-amber-500"
                                                  : "text-green-600 dark:text-green-400",
                                        )}
                                    >
                                        {product.stock}
                                    </span>
                                    {#if product.stock <= 0}
                                        <AlertCircle
                                            class="h-4 w-4 text-red-500"
                                        />
                                    {/if}
                                </div>
                            </TableCell>
                        </TableRow>
                    {/each}
                {/if}
            </TableBody>
        </Table>
    </div>

    <!-- Quick Tips -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
            class="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 flex gap-3"
        >
            <Info class="h-5 w-5 text-blue-600 shrink-0" />
            <div class="space-y-1">
                <p
                    class="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider"
                >
                    Real-time Data
                </p>
                <p
                    class="text-xs text-blue-600/80 dark:text-blue-400/60 leading-relaxed"
                >
                    Stock levels are updated instantly from all warehouse
                    transactions.
                </p>
            </div>
        </div>
        <div
            class="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex gap-3"
        >
            <Tag class="h-5 w-5 text-slate-600 shrink-0" />
            <div class="space-y-1">
                <p
                    class="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider"
                >
                    Universal Search
                </p>
                <p
                    class="text-xs text-slate-600/80 dark:text-slate-400/60 leading-relaxed"
                >
                    Search by product name, internal codes, or manufacturer SKU
                    tags.
                </p>
            </div>
        </div>
        <div
            class="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex gap-3"
        >
            <Boxes class="h-5 w-5 text-slate-600 shrink-0" />
            <div class="space-y-1">
                <p
                    class="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider"
                >
                    Multi-Variant
                </p>
                <p
                    class="text-xs text-slate-600/80 dark:text-slate-400/60 leading-relaxed"
                >
                    View availability for specific sizes, colors, or capacity
                    variants.
                </p>
            </div>
        </div>
    </div>
</div>
