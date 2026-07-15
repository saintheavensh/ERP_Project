<script lang="ts">
    import { PurchaseReturnsController } from "$lib/features/inventory/purchase-returns/purchase-returns.controller.svelte";
    import { Button } from "$lib/shared/components/ui/button";
    import {
        Search,
        Eye,
        FileText,
        Calendar,
        Box,
        ChevronRight,
    } from "lucide-svelte";
    import { Input } from "$lib/shared/components/ui/input";
    import { Badge } from "$lib/shared/components/ui/badge";
    import { fade } from "svelte/transition";

    const controller = new PurchaseReturnsController();
</script>

<div class="space-y-6 p-6">
    <div
        class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
        <div class="space-y-1">
            <h3
                class="text-xl font-bold tracking-tight flex items-center gap-2 text-fuchsia-700 dark:text-fuchsia-400"
            >
                <FileText class="h-5 w-5" /> Riwayat Retur
            </h3>
            <p class="text-sm text-muted-foreground">
                Arsip dokumen pengembalian barang yang telah diproses.
            </p>
        </div>
        <div class="flex items-center w-full md:w-auto">
            <div class="relative w-full md:w-[300px]">
                <Search
                    class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                />
                <Input
                    placeholder="Cari ID atau Supplier..."
                    bind:value={controller.searchQuery}
                    class="pl-9 bg-background/50 border-fuchsia-100 focus:border-fuchsia-500 transition-all rounded-lg"
                />
            </div>
        </div>
    </div>

    <div class="rounded-xl border bg-background shadow-sm overflow-hidden">
        <div class="relative w-full overflow-auto">
            <table class="w-full caption-bottom text-sm">
                <thead class="bg-muted/40">
                    <tr class="border-b">
                        <th
                            class="h-12 px-4 text-left align-middle font-semibold text-muted-foreground"
                            >ID Retur</th
                        >
                        <th
                            class="h-12 px-4 text-left align-middle font-semibold text-muted-foreground"
                            >Tanggal</th
                        >
                        <th
                            class="h-12 px-4 text-left align-middle font-semibold text-muted-foreground"
                            >Supplier</th
                        >
                        <th
                            class="h-12 px-4 text-left align-middle font-semibold text-muted-foreground"
                            >Items</th
                        >
                        <th
                            class="h-12 px-4 text-left align-middle font-semibold text-muted-foreground"
                            >Catatan</th
                        >
                        <th
                            class="h-12 px-4 text-right align-middle font-semibold text-muted-foreground w-[50px]"
                            >Action</th
                        >
                    </tr>
                </thead>
                <tbody class="divide-y">
                    {#if controller.isLoading}
                        <tr
                            ><td
                                colspan="6"
                                class="p-12 text-center text-muted-foreground animate-pulse"
                                >Memuat data retur...</td
                            ></tr
                        >
                    {:else if controller.filteredReturns.length === 0}
                        <tr>
                            <td
                                colspan="6"
                                class="p-16 text-center text-muted-foreground"
                            >
                                <div
                                    class="flex flex-col items-center gap-2 opacity-60"
                                >
                                    <FileText class="h-10 w-10" />
                                    <p>Tidak ada data retur ditemukan.</p>
                                </div>
                            </td>
                        </tr>
                    {:else}
                        {#each controller.filteredReturns as ret}
                            <tr
                                class="group hover:bg-fuchsia-50/30 dark:hover:bg-fuchsia-900/10 transition-colors"
                            >
                                <td class="p-4 font-medium">
                                    <a
                                        href="/purchase-returns/{ret.id}"
                                        class="hover:underline hover:text-fuchsia-600 font-bold font-mono text-foreground"
                                    >
                                        {ret.id}
                                    </a>
                                </td>
                                <td
                                    class="p-4 whitespace-nowrap text-muted-foreground"
                                >
                                    <div class="flex items-center gap-2">
                                        <Calendar class="h-3.5 w-3.5" />
                                        {controller.formatDate(ret.date)}
                                    </div>
                                </td>
                                <td class="p-4">
                                    <div class="font-medium">
                                        {ret.supplier.name}
                                    </div>
                                </td>
                                <td class="p-4">
                                    <div class="flex flex-col gap-1">
                                        {#each ret.items.slice(0, 2) as item}
                                            <div
                                                class="flex items-center gap-2 text-xs"
                                            >
                                                <Box
                                                    class="h-3 w-3 text-muted-foreground"
                                                />
                                                <span class="font-medium"
                                                    >{item.product.name}</span
                                                >
                                                <Badge
                                                    variant="outline"
                                                    class="h-4 px-1 text-[10px] font-normal"
                                                    >{item.qty}</Badge
                                                >
                                            </div>
                                        {/each}
                                        {#if ret.items.length > 2}
                                            <span
                                                class="text-[10px] text-muted-foreground pl-5"
                                                >+ {ret.items.length - 2} items lainnya</span
                                            >
                                        {/if}
                                    </div>
                                </td>
                                <td
                                    class="p-4 text-muted-foreground italic text-xs max-w-[200px] truncate"
                                >
                                    {ret.notes || "-"}
                                </td>
                                <td class="p-4 text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        href="/purchase-returns/{ret.id}"
                                        title="Lihat Detail"
                                        class="text-muted-foreground hover:text-fuchsia-600 hover:bg-fuchsia-50"
                                    >
                                        <ChevronRight class="h-5 w-5" />
                                    </Button>
                                </td>
                            </tr>
                        {/each}
                    {/if}
                </tbody>
            </table>
        </div>
    </div>
</div>
