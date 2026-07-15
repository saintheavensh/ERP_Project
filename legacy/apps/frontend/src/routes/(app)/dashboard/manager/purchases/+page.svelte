<script lang="ts">
    import { onMount } from "svelte";
    import { Button } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/shared/components/ui/table";
    import { Badge } from "$lib/shared/components/ui/badge";
    import {
        Plus,
        Search,
        ShoppingCart,
        Filter,
        Download,
        TrendingDown,
        AlertTriangle,
        ArrowRight,
    } from "lucide-svelte";
    import { PurchaseListController } from "$lib/features/sales/components/purchases/purchase-list.controller.svelte";
    import { fade } from "svelte/transition";
    import { cn } from "$lib/shared/lib/utils";

    const controller = new PurchaseListController();

    onMount(() => {
        controller.load();
    });
</script>

<div class="space-y-6 pb-20">
    <!-- Header -->
    <div
        class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
    >
        <div>
            <h1
                class="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2"
            >
                <ShoppingCart class="h-8 w-8 text-violet-600" />
                Manajemen Pembelian
            </h1>
            <p class="text-muted-foreground">
                Kelola procurement, stok masuk, dan hutang supplier.
            </p>
        </div>
        <div class="flex items-center gap-2">
            <Button
                href="/manager/purchases/new"
                class="bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-900/20"
            >
                <Plus class="mr-2 h-4 w-4" /> Order Baru
            </Button>
        </div>
    </div>

    <!-- Smart Replenishment Summary (New Feature) -->
    <div class="grid gap-4 md:grid-cols-3">
        <Card
            class="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 dark:from-orange-950/30 dark:to-amber-950/30 dark:border-orange-900/50"
        >
            <CardHeader class="pb-2">
                <CardTitle
                    class="text-sm font-medium text-orange-800 dark:text-orange-400 flex items-center gap-2"
                >
                    <AlertTriangle class="h-4 w-4" /> Low Stock Items
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div
                    class="text-2xl font-bold text-orange-700 dark:text-orange-500"
                >
                    12 Item
                </div>
                <p class="text-xs text-orange-600/80 mt-1">
                    Stok di bawah batas minimum
                </p>
                <Button
                    variant="link"
                    class="px-0 text-orange-700 h-auto mt-2 text-xs font-bold flex items-center gap-1 group"
                >
                    Buat Replenishment Order <ArrowRight
                        class="h-3 w-3 group-hover:translate-x-1 transition-transform"
                    />
                </Button>
            </CardContent>
        </Card>
        <Card>
            <CardHeader class="pb-2">
                <CardTitle class="text-sm font-medium text-muted-foreground"
                    >Total Pengeluaran (Bulan Ini)</CardTitle
                >
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">Rp 45.250.000</div>
                <div class="flex items-center text-xs text-green-600 mt-1">
                    <TrendingDown class="mr-1 h-3 w-3" /> -12% dari bulan lalu
                </div>
            </CardContent>
        </Card>
    </div>

    <!-- Filters & Search -->
    <div
        class="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border shadow-sm"
    >
        <div class="relative w-full md:w-96">
            <Search
                class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            />
            <Input
                placeholder="Cari No. PO, Supplier, atau Note..."
                class="pl-9 bg-background"
                bind:value={controller.search}
                oninput={() => controller.handleSearch()}
            />
        </div>
        <div class="flex items-center gap-2 w-full md:w-auto">
            <div class="flex gap-1 bg-muted/50 p-1 rounded-lg">
                {#each ["ALL", "DRAFT", "ORDERED", "RECEIVED", "VERIFIED"] as status}
                    <button
                        class={cn(
                            "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                            controller.statusFilter ===
                                (status === "ALL" ? "" : status)
                                ? "bg-white shadow text-foreground"
                                : "text-muted-foreground hover:bg-white/50",
                        )}
                        onclick={() =>
                            (controller.statusFilter =
                                status === "ALL" ? "" : status)}
                    >
                        {status}
                    </button>
                {/each}
            </div>
        </div>
    </div>

    <!-- Purchase Table -->
    <div class="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
            <TableHeader class="bg-muted/40">
                <TableRow>
                    <TableHead class="w-[180px]">No. Invoice</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead class="text-right">Total Nominal</TableHead>
                    <TableHead class="text-right">Aksi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {#if controller.loading}
                    {#each Array(5) as _}
                        <TableRow>
                            <TableCell colspan={6} class="h-16">
                                <div
                                    class="w-full h-4 bg-muted/20 animate-pulse rounded"
                                ></div>
                            </TableCell>
                        </TableRow>
                    {/each}
                {:else if controller.purchases.length === 0}
                    <TableRow>
                        <TableCell
                            colspan={6}
                            class="h-32 text-center text-muted-foreground"
                        >
                            Belum ada data pembelian.
                        </TableCell>
                    </TableRow>
                {:else}
                    {#each controller.purchases as po (po.id)}
                        <TableRow class="hover:bg-muted/50 transition-colors">
                            <TableCell class="font-medium font-mono">
                                <div class="flex flex-col">
                                    <span class="text-foreground"
                                        >{po.notes || "-"}</span
                                    >
                                    <span
                                        class="text-[10px] text-muted-foreground"
                                        >{po.id}</span
                                    >
                                </div>
                            </TableCell>
                            <TableCell>
                                <div class="flex items-center gap-2">
                                    <div
                                        class="h-6 w-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold"
                                    >
                                        {(po.supplier?.name || "U")[0]}
                                    </div>
                                    <span class="font-medium"
                                        >{po.supplier?.name || "Unknown"}</span
                                    >
                                </div>
                            </TableCell>
                            <TableCell class="text-muted-foreground">
                                {controller.formatDate(po.date)}
                            </TableCell>
                            <TableCell>
                                <Badge
                                    class="{controller.getStatusColor(
                                        po.status,
                                    )} border-0 shadow-sm"
                                >
                                    {po.status}
                                </Badge>
                            </TableCell>
                            <TableCell class="text-right font-mono font-bold">
                                {controller.formatRp(po.totalAmount)}
                            </TableCell>
                            <TableCell class="text-right">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    href="/manager/purchases/{po.id}"
                                >
                                    Detail
                                </Button>
                            </TableCell>
                        </TableRow>
                    {/each}
                {/if}
            </TableBody>
        </Table>
    </div>
</div>
