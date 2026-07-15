<script lang="ts">
    import { createProductStore } from "$lib/features/inventory/stores/products-store.svelte";
    import {
        Table,
        TableHeader,
        TableRow,
        TableHead,
        TableBody,
        TableCell,
    } from "$lib/shared/components/ui/table";
    import { Button } from "$lib/shared/components/ui/button";
    import { Badge } from "$lib/shared/components/ui/badge";
    import { Checkbox } from "$lib/shared/components/ui/checkbox";
    import ProductSearch from "../shared/ProductSearch.svelte";
    import ProductImage from "../shared/ProductImage.svelte";
    import {
        Pencil,
        Trash2,
        Copy,
        ArrowUpDown,
        Download,
        Upload,
        Plus,
        MoreHorizontal,
    } from "lucide-svelte";
    import * as DropdownMenu from "$lib/shared/components/ui/dropdown-menu";

    const store = createProductStore();

    let viewData = $state<any>(null);

    // Initial load
    $effect(() => {
        store.getRoleSpecificView().then((data) => {
            viewData = data;
        });
    });

    function formatCurrency(amount: number) {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    }

    function handleSort(column: string) {
        const currentSort = store.filters.sort || "name:asc";
        const [col, dir] = currentSort.split(":");
        const newDir = col === column && dir === "asc" ? "desc" : "asc";
        store.setFilter({ sort: `${column}:${newDir}` });
    }
</script>

<div class="space-y-4">
    <!-- Action Bar -->
    <div class="flex flex-col md:flex-row justify-between gap-4">
        <div class="flex-1 max-w-md">
            <ProductSearch
                value={store.filters.search}
                onSearch={(val) => store.setFilter({ search: val })}
            />
        </div>
        <div class="flex gap-2">
            <Button variant="outline" size="sm">
                <Download class="h-4 w-4 mr-2" />
                Export
            </Button>
            <Button variant="outline" size="sm">
                <Upload class="h-4 w-4 mr-2" />
                Import
            </Button>
            <Button size="sm" class="bg-blue-600 hover:bg-blue-700">
                <Plus class="h-4 w-4 mr-2" />
                Tambah Produk
            </Button>
        </div>
    </div>

    <!-- Analytics Dashboard -->
    {#if viewData}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4">
            <div
                class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm"
            >
                <h3 class="text-sm font-medium text-slate-500 mb-1">
                    Total Nilai Inventaris
                </h3>
                <p
                    class="text-2xl font-bold font-mono text-slate-900 dark:text-white"
                >
                    {formatCurrency(viewData.totalValue)}
                </p>
            </div>
            <div
                class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm"
            >
                <h3 class="text-sm font-medium text-slate-500 mb-1">
                    Item Stok Rendah
                </h3>
                <p
                    class="text-2xl font-bold font-mono text-red-600 dark:text-red-400"
                >
                    {viewData.lowStockItems.length}
                </p>
            </div>
            <div
                class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm"
            >
                <h3 class="text-sm font-medium text-slate-500 mb-1">
                    Rata-rata Margin
                </h3>
                <p
                    class="text-2xl font-bold font-mono text-green-600 dark:text-green-400"
                >
                    {viewData.profitMargin.length
                        ? (
                              viewData.profitMargin.reduce(
                                  (a: number, b: any) => a + b.margin,
                                  0,
                              ) / viewData.profitMargin.length
                          ).toFixed(1)
                        : "0"}%
                </p>
            </div>
        </div>
    {/if}

    <!-- Bulk Actions -->
    {#if store.selectedIds.length > 0}
        <div
            class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex justify-between items-center border border-blue-100 dark:border-blue-800"
        >
            <span class="text-sm font-medium text-blue-700 dark:text-blue-300">
                {store.selectedIds.length} produk dipilih
            </span>
            <div class="flex gap-2">
                <Button
                    size="sm"
                    variant="outline"
                    onclick={() => store.bulkUpdatePrices(5)}
                >
                    Naikkan Harga 5%
                </Button>
                <Button
                    size="sm"
                    variant="destructive"
                    onclick={() => {
                        /* Handle bulk delete */
                    }}
                >
                    Hapus Terpilih
                </Button>
            </div>
        </div>
    {/if}

    <!-- Table Container -->
    <div
        class="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden"
    >
        <Table>
            <TableHeader class="bg-slate-50 dark:bg-slate-900/50">
                <TableRow>
                    <TableHead class="w-12">
                        <Checkbox
                            checked={store.selectedIds.length ===
                                store.products.length &&
                                store.products.length > 0}
                            onCheckedChange={() => store.selectAll()}
                        />
                    </TableHead>
                    <TableHead
                        class="cursor-pointer hover:text-slate-900 transition-colors"
                        onclick={() => handleSort("sku")}
                    >
                        <div class="flex items-center gap-1">
                            SKU <ArrowUpDown class="h-3 w-3" />
                        </div>
                    </TableHead>
                    <TableHead
                        class="cursor-pointer hover:text-slate-900 transition-colors"
                        onclick={() => handleSort("name")}
                    >
                        <div class="flex items-center gap-1">
                            Nama <ArrowUpDown class="h-3 w-3" />
                        </div>
                    </TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead
                        class="text-right cursor-pointer hover:text-slate-900"
                        onclick={() => handleSort("price")}
                    >
                        <div class="flex items-center justify-end gap-1">
                            Harga <ArrowUpDown class="h-3 w-3" />
                        </div>
                    </TableHead>
                    <TableHead class="text-center">Stok</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead class="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {#if store.loading}
                    <TableRow>
                        <TableCell
                            colspan={8}
                            class="h-32 text-center text-slate-500"
                        >
                            <div
                                class="flex flex-col items-center justify-center"
                            >
                                <span
                                    class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"
                                ></span>
                                Loading products...
                            </div>
                        </TableCell>
                    </TableRow>
                {:else if store.products.length === 0}
                    <TableRow>
                        <TableCell
                            colspan={8}
                            class="h-32 text-center text-slate-500"
                        >
                            No products found matching your search.
                        </TableCell>
                    </TableRow>
                {:else}
                    {#each store.products as product (product.id)}
                        <TableRow class="group">
                            <TableCell>
                                <Checkbox
                                    checked={store.selectedIds.includes(
                                        product.id,
                                    )}
                                    onCheckedChange={() =>
                                        store.toggleSelect(product.id)}
                                />
                            </TableCell>
                            <TableCell class="font-mono text-xs text-slate-500"
                                >{product.sku}</TableCell
                            >
                            <TableCell>
                                <div class="flex items-center gap-3">
                                    <ProductImage
                                        src={product.image}
                                        alt={product.name}
                                        className="h-8 w-8 rounded shrink-0"
                                    />
                                    <span
                                        class="font-medium truncate max-w-[200px]"
                                        title={product.name}
                                        >{product.name}</span
                                    >
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="secondary" class="font-normal"
                                    >{product.category}</Badge
                                >
                            </TableCell>
                            <TableCell class="text-right font-bold">
                                {formatCurrency(product.price)}
                            </TableCell>
                            <TableCell class="text-center">
                                <Badge
                                    variant={product.stock <
                                    (product.minStock || 10)
                                        ? "destructive"
                                        : "default"}
                                    class="shadow-none"
                                >
                                    {product.stock}
                                </Badge>
                            </TableCell>
                            <TableCell class="text-slate-500 text-sm"
                                >{product.supplier || "-"}</TableCell
                            >
                            <TableCell class="text-right">
                                <DropdownMenu.Root>
                                    <DropdownMenu.Trigger>
                                        {#snippet child({ props })}
                                            <Button
                                                {...props}
                                                variant="ghost"
                                                size="icon"
                                            >
                                                <MoreHorizontal
                                                    class="h-4 w-4"
                                                />
                                            </Button>
                                        {/snippet}
                                    </DropdownMenu.Trigger>
                                    <DropdownMenu.Content align="end">
                                        <DropdownMenu.Item>
                                            <Pencil class="h-4 w-4 mr-2" /> Edit
                                        </DropdownMenu.Item>
                                        <DropdownMenu.Item>
                                            <Copy class="h-4 w-4 mr-2" /> Duplicate
                                        </DropdownMenu.Item>
                                        <DropdownMenu.Separator />
                                        <DropdownMenu.Item
                                            class="text-red-600"
                                            onclick={() =>
                                                store.deleteProduct(product.id)}
                                        >
                                            <Trash2 class="h-4 w-4 mr-2" /> Delete
                                        </DropdownMenu.Item>
                                    </DropdownMenu.Content>
                                </DropdownMenu.Root>
                            </TableCell>
                        </TableRow>
                    {/each}
                {/if}
            </TableBody>
        </Table>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-between px-2">
        <p class="text-sm text-slate-500">
            Showing {store.products.length} of {store.total} products
        </p>
        <div class="flex gap-2">
            <Button
                variant="outline"
                size="sm"
                disabled={store.page === 1}
                onclick={() => store.setPage(store.page - 1)}
            >
                Previous
            </Button>
            <div class="flex items-center px-4 text-sm font-medium">
                Page {store.page}
            </div>
            <Button
                variant="outline"
                size="sm"
                disabled={store.page * store.limit >= store.total}
                onclick={() => store.setPage(store.page + 1)}
            >
                Next
            </Button>
        </div>
    </div>
</div>
