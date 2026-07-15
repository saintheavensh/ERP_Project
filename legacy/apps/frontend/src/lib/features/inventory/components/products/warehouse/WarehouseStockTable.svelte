<script lang="ts">
    import { onMount } from "svelte";
    import { productsService } from "$lib/features/inventory/services/products.service";
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
    import { Input } from "$lib/shared/components/ui/input";
    import {
        Printer,
        Scan,
        Package,
        AlertTriangle,
        Search,
    } from "lucide-svelte";

    import { createProductStore } from "$lib/features/inventory/stores/products-store.svelte";

    const store = createProductStore();

    let items = $state<any[]>([]);
    let locationFilter = $state("");
    let searchQuery = $state("");

    async function loadStock() {
        try {
            const data = await store.getRoleSpecificView();
            if (data && Array.isArray(data)) {
                items = data as any[];
            }
        } catch (e) {
            console.error(e);
        }
    }

    onMount(loadStock);

    let filteredItems = $derived(
        items.filter(
            (item) =>
                (!locationFilter ||
                    item.location
                        ?.toLowerCase()
                        .includes(locationFilter.toLowerCase())) &&
                (!searchQuery ||
                    item.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                    item.sku.toLowerCase().includes(searchQuery.toLowerCase())),
        ),
    );

    function getExpiryStatus(expiryDate: string) {
        if (!expiryDate) return null;
        const daysLeft = Math.ceil(
            (new Date(expiryDate).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24),
        );
        if (daysLeft < 0) return { label: "Expired", variant: "destructive" };
        if (daysLeft < 30)
            return { label: "Expiring Soon", variant: "warning" };
        return { label: "Good", variant: "success" };
    }
</script>

<div class="space-y-4">
    <div class="flex flex-col md:flex-row justify-between gap-4">
        <div class="flex gap-2 flex-1 max-w-2xl">
            <div class="relative flex-1">
                <Search
                    class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                />
                <Input
                    placeholder="Cari SKU atau nama..."
                    class="pl-10"
                    bind:value={searchQuery}
                />
            </div>
            <Input
                placeholder="Filter Lokasi..."
                class="w-48"
                bind:value={locationFilter}
            />
        </div>

        <div class="flex gap-2">
            <Button variant="outline" size="sm">
                <Scan class="h-4 w-4 mr-2" />
                Scan Barcode
            </Button>
            <Button size="sm" class="bg-blue-600 hover:bg-blue-700">
                <Package class="h-4 w-4 mr-2" />
                Stock Opname
            </Button>
        </div>
    </div>

    <div
        class="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden"
    >
        <Table>
            <TableHeader class="bg-slate-50 dark:bg-slate-900/50">
                <TableRow>
                    <TableHead>Lokasi</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead class="text-center">Stok</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead class="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {#if store.loading}
                    <TableRow>
                        <TableCell
                            colspan={7}
                            class="h-32 text-center text-slate-500"
                            >Loading stock data...</TableCell
                        >
                    </TableRow>
                {:else if filteredItems.length === 0}
                    <TableRow>
                        <TableCell
                            colspan={7}
                            class="h-32 text-center text-slate-500"
                            >No stock items found.</TableCell
                        >
                    </TableRow>
                {:else}
                    {#each filteredItems as item}
                        <TableRow>
                            <TableCell>
                                <Badge
                                    variant="secondary"
                                    class="font-mono bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                >
                                    {item.location || "UNSET"}
                                </Badge>
                            </TableCell>
                            <TableCell class="font-medium"
                                >{item.name}</TableCell
                            >
                            <TableCell class="font-mono text-xs text-slate-500"
                                >{item.sku}</TableCell
                            >
                            <TableCell class="text-sm"
                                >{item.batchNumber || "-"}</TableCell
                            >
                            <TableCell class="text-center font-bold">
                                {item.stock}
                            </TableCell>
                            <TableCell>
                                {#if item.expiryDate}
                                    {@const status = getExpiryStatus(
                                        item.expiryDate,
                                    )}
                                    {#if status}
                                        <Badge variant={status.variant as any}>
                                            {new Date(
                                                item.expiryDate,
                                            ).toLocaleDateString()}
                                        </Badge>
                                    {/if}
                                {:else}
                                    <span class="text-slate-400">-</span>
                                {/if}
                            </TableCell>
                            <TableCell class="text-right">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onclick={() =>
                                        productsService.printLabel(item.id)}
                                >
                                    <Printer class="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    {/each}
                {/if}
            </TableBody>
        </Table>
    </div>
</div>
