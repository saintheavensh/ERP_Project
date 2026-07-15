<script lang="ts">
    import { page } from "$app/stores";
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
    import { Separator } from "$lib/shared/components/ui/separator";
    import {
        ArrowLeft,
        Calendar,
        FileText,
        MapPin,
        Phone,
        Package,
        Printer,
        TrendingUp,
        AlertCircle,
        Truck,
        Trash2,
        CheckCircle,
    } from "lucide-svelte";
    import { fade } from "svelte/transition";
    import { PurchaseDetailController } from "$lib/features/sales/components/purchases/purchase-detail.controller.svelte";

    // Initialize Controller
    const controller = new PurchaseDetailController($page.params.id as string);

    onMount(() => {
        controller.load();
    });
</script>

<div class="min-h-screen space-y-8 p-6 pb-20">
    <!-- Header with GradientManager Style -->
    <div
        class="relative bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-8 text-white overflow-hidden shadow-2xl print:hidden"
    >
        <div
            class="absolute inset-0 bg-white/10 opacity-20 pattern-dots pointer-events-none"
        ></div>
        <div
            class="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        >
            <div>
                <Button
                    href="/manager/purchases"
                    variant="ghost"
                    size="sm"
                    class="text-white/80 hover:text-white hover:bg-white/10 p-0 h-auto mb-2 font-normal"
                >
                    <ArrowLeft class="mr-1 h-4 w-4" /> Kembali ke Manajemen
                </Button>
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <FileText class="h-6 w-6 text-white" />
                    </div>
                    <h1
                        class="text-3xl font-bold tracking-tight text-white flex items-center gap-3"
                    >
                        Purchase Order
                        <Badge
                            class="{controller.getStatusColor(
                                controller.purchase?.status,
                            )} text-white border-0 shadow-sm px-4 py-1 text-sm bg-opacity-90 backdrop-blur-sm"
                        >
                            {controller.purchase?.status || "ORDERED"}
                        </Badge>
                        <span
                            class="text-base font-normal bg-white/20 px-3 py-1 rounded-full font-mono"
                        >
                            #{controller.purchase?.notes || controller.id}
                        </span>
                    </h1>
                </div>
            </div>

            <div class="flex gap-3">
                <!-- Manager Actions -->
                {#if controller.purchase?.status === "RECEIVED"}
                    <Button
                        size="sm"
                        href="/manager/purchases/{controller.id}/verify"
                        class="bg-white text-violet-600 hover:bg-violet-50 border-0 shadow-lg font-bold transition-transform active:scale-95"
                    >
                        <TrendingUp class="mr-2 h-4 w-4" /> Verifikasi & Input Harga
                    </Button>
                {/if}

                {#if controller.purchase?.status === "VERIFIED"}
                    <Button
                        size="sm"
                        class="bg-green-500 hover:bg-green-600 text-white border-0 shadow-lg font-bold cursor-default"
                    >
                        <CheckCircle class="mr-2 h-4 w-4" /> Order Selesai
                    </Button>
                {/if}

                <Button
                    variant="secondary"
                    size="sm"
                    onclick={() => window.print()}
                    class="bg-white/20 text-white hover:bg-white/30 border-0 shadow-sm backdrop-blur-sm"
                >
                    <Printer class="mr-2 h-4 w-4" /> Cetak
                </Button>

                {#if controller.purchase?.status === "ORDERED" || controller.purchase?.status === "DRAFT"}
                    <Button
                        variant="destructive"
                        size="sm"
                        onclick={() => controller.handleCancel()}
                        disabled={controller.isCancelling}
                        class="shadow-sm border-0 bg-red-500 hover:bg-red-600 text-white"
                    >
                        <Trash2 class="mr-2 h-4 w-4" />
                        {controller.isCancelling
                            ? "Processing..."
                            : "Batalkan Order"}
                    </Button>
                {/if}
            </div>
        </div>
    </div>

    <!-- Print Header Only -->
    <div class="hidden print:block mb-8">
        <h1 class="text-2xl font-bold">Detail Pembelian</h1>
        <p class="text-muted-foreground">
            ID: {controller.purchase?.notes || controller.id}
        </p>
    </div>

    {#if controller.loading}
        <div class="grid gap-6 md:grid-cols-3">
            <div class="md:col-span-2 space-y-6">
                <div
                    class="h-[400px] w-full bg-card/50 animate-pulse rounded-xl"
                ></div>
            </div>
            <div
                class="h-[300px] w-full bg-card/50 animate-pulse rounded-xl"
            ></div>
        </div>
    {:else if controller.error || !controller.purchase}
        <div
            class="flex flex-col items-center justify-center p-12 text-center bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20"
        >
            <AlertCircle class="h-10 w-10 text-red-500 mb-4" />
            <h3 class="text-lg font-bold text-red-700 dark:text-red-400">
                Data Tidak Ditemukan
            </h3>
            <p class="text-red-600/80 dark:text-red-400/80">
                Transaksi mungkin telah dihapus.
            </p>
            <Button variant="outline" href="/manager/purchases" class="mt-4"
                >Kembali</Button
            >
        </div>
    {:else}
        <div in:fade={{ duration: 400 }} class="grid gap-6 md:grid-cols-3">
            <!-- Left Column: Details -->
            <div class="md:col-span-2 space-y-6">
                <!-- Items Table -->
                <Card
                    class="bg-card/80 backdrop-blur-sm border-t-4 border-t-violet-500 shadow-md"
                >
                    <CardHeader
                        class="flex flex-row items-center justify-between bg-muted/20 pb-4"
                    >
                        <div class="flex items-center gap-2">
                            <Package class="h-5 w-5 text-violet-600" />
                            <CardTitle class="text-lg"
                                >Daftar Barang Masuk</CardTitle
                            >
                        </div>
                        <Badge variant="outline" class="font-normal"
                            >{controller.purchase.items.length} Items</Badge
                        >
                    </CardHeader>
                    <CardContent class="p-0">
                        <Table>
                            <TableHeader class="bg-muted/30">
                                <TableRow class="hover:bg-transparent">
                                    <TableHead class="pl-6 w-[35%]"
                                        >Produk</TableHead
                                    >
                                    <TableHead class="text-center w-[15%]"
                                        >Varian</TableHead
                                    >
                                    <TableHead class="text-right w-[10%]"
                                        >Qty</TableHead
                                    >
                                    <TableHead class="text-right w-[20%]"
                                        >Harga Beli</TableHead
                                    >
                                    <TableHead class="text-right pr-6 w-[20%]"
                                        >Subtotal</TableHead
                                    >
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {#each controller.purchase.items as item, idx}
                                    <TableRow
                                        class="hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition-colors"
                                    >
                                        <TableCell class="pl-6">
                                            <div
                                                class="font-medium text-foreground"
                                            >
                                                {item.product?.name ||
                                                    "Unknown"}
                                            </div>
                                            {#if item.product?.code}
                                                <div
                                                    class="text-[10px] text-muted-foreground font-mono"
                                                >
                                                    SKU: {item.product.code}
                                                </div>
                                            {/if}
                                        </TableCell>
                                        <TableCell class="text-center">
                                            {#if item.variant}
                                                <Badge
                                                    variant="secondary"
                                                    class="font-normal text-xs"
                                                    >{item.variant}</Badge
                                                >
                                            {:else}
                                                <span
                                                    class="text-muted-foreground text-sm"
                                                    >-</span
                                                >
                                            {/if}
                                        </TableCell>
                                        <TableCell
                                            class="text-right font-mono font-medium"
                                        >
                                            <div
                                                class="flex flex-col items-end"
                                            >
                                                <span
                                                    class="text-xs text-muted-foreground"
                                                    >Order: {item.qtyOrdered}</span
                                                >
                                                <span
                                                    class={item.qtyReceived !==
                                                        item.qtyOrdered &&
                                                    controller.purchase
                                                        .status !== "ORDERED"
                                                        ? "text-red-500 font-bold"
                                                        : ""}
                                                >
                                                    Rcv: {item.qtyReceived}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell class="text-right font-mono">
                                            <div
                                                class="flex flex-col items-end"
                                            >
                                                {#if item.buyPrice > 0}
                                                    <span
                                                        >{controller.formatRp(
                                                            item.buyPrice,
                                                        )}</span
                                                    >
                                                {:else}
                                                    <span
                                                        class="text-muted-foreground italic"
                                                        >Est: {controller.formatRp(
                                                            item.estimatedBuyPrice,
                                                        )}</span
                                                    >
                                                {/if}
                                            </div>
                                        </TableCell>
                                        <TableCell
                                            class="text-right pr-6 font-mono"
                                        >
                                            <div
                                                class="flex flex-col items-end gap-1"
                                            >
                                                <span class="font-bold">
                                                    {controller.formatRp(
                                                        item.sellPrice ||
                                                            item.targetSellPrice,
                                                    )}
                                                </span>
                                                {#if controller.purchase.status === "RECEIVED" || controller.purchase.status === "VERIFIED"}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        class="h-6 text-[10px]"
                                                        onclick={() =>
                                                            controller.printLabel(
                                                                item,
                                                            )}
                                                    >
                                                        <Printer
                                                            class="w-3 h-3 mr-1"
                                                        /> Label
                                                    </Button>
                                                {:else}
                                                    <span
                                                        class="text-xs text-muted-foreground italic"
                                                        >Target Jual</span
                                                    >
                                                {/if}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                {/each}
                            </TableBody>
                        </Table>

                        <!-- Summary Section -->
                        <div
                            class="p-6 bg-muted/10 border-t flex flex-col items-end gap-3"
                        >
                            <div
                                class="w-full md:w-1/2 flex justify-between items-center text-sm text-muted-foreground"
                            >
                                <span>Total Item</span>
                                <span
                                    >{controller.purchase.items.reduce(
                                        (a: number, b: any) =>
                                            a + (b.qtyReceived || b.qtyOrdered),
                                        0,
                                    )} Pcs</span
                                >
                            </div>
                            <Separator class="w-full md:w-1/2" />
                            <div
                                class="w-full md:w-1/2 flex justify-between items-center"
                            >
                                <span class="font-semibold text-lg"
                                    >{controller.purchase.status === "VERIFIED"
                                        ? "Total Pembelian"
                                        : "Estimasi Total"}</span
                                >
                                <span
                                    class="font-bold text-xl text-violet-600 font-mono"
                                    >{controller.formatRp(
                                        controller.purchase.totalAmount,
                                    )}</span
                                >
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <!-- Right Column: Info Cards -->
            <div class="space-y-6">
                <!-- Status Card -->
                {#if controller.purchase.status === "ORDERED"}
                    <Card class="bg-blue-50 border-blue-100">
                        <CardHeader class="pb-2">
                            <CardTitle
                                class="text-blue-700 text-sm flex items-center gap-2"
                            >
                                <Truck class="h-4 w-4" /> Menunggu Barang
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p class="text-sm text-blue-600 mb-2">
                                Pesanan sedang dikirim oleh supplier. Tim Gudang
                                akan melakukan penerimaan barang.
                            </p>
                        </CardContent>
                    </Card>
                {/if}

                <!-- Info Card -->
                <Card
                    class="bg-card/80 backdrop-blur-sm border-violet-100 dark:border-violet-900/30"
                >
                    <CardHeader
                        class="pb-3 bg-violet-50/50 dark:bg-violet-900/10"
                    >
                        <CardTitle
                            class="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider text-violet-700 dark:text-violet-400"
                        >
                            <FileText class="h-4 w-4" /> Informasi Transaksi
                        </CardTitle>
                    </CardHeader>
                    <CardContent class="grid gap-4 p-5">
                        <div class="grid grid-cols-2 gap-y-4 text-sm">
                            <div class="space-y-1">
                                <span
                                    class="text-xs text-muted-foreground block"
                                    >No. Invoice</span
                                >
                                <span
                                    class="font-medium font-mono bg-muted/50 px-2 py-1 rounded"
                                    >{controller.purchase.notes || "-"}</span
                                >
                            </div>

                            <div class="space-y-1">
                                <span
                                    class="text-xs text-muted-foreground block"
                                    >Input Oleh</span
                                >
                                <div class="flex items-center gap-1.5">
                                    <div
                                        class="h-5 w-5 rounded-full bg-violet-100 flex items-center justify-center text-[10px] text-violet-600 font-bold"
                                    >
                                        {(controller.purchase.user?.name ||
                                            "U")[0]}
                                    </div>
                                    <span class="font-medium"
                                        >{controller.purchase.user?.name ||
                                            controller.purchase.user
                                                ?.username ||
                                            "-"}</span
                                    >
                                </div>
                            </div>

                            <div class="col-span-2 space-y-1">
                                <span
                                    class="text-xs text-muted-foreground block"
                                    >Waktu Transaksi</span
                                >
                                <div
                                    class="flex items-center gap-2 font-medium"
                                >
                                    <Calendar
                                        class="h-4 w-4 text-muted-foreground"
                                    />
                                    <span
                                        >{controller.formatDate(
                                            controller.purchase.date,
                                        )}</span
                                    >
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <!-- Supplier Card -->
                <Card
                    class="bg-card/80 backdrop-blur-sm border-fuchsia-100 dark:border-fuchsia-900/30"
                >
                    <CardHeader
                        class="pb-3 bg-fuchsia-50/50 dark:bg-fuchsia-900/10"
                    >
                        <CardTitle
                            class="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider text-fuchsia-700 dark:text-fuchsia-400"
                        >
                            <Truck class="h-4 w-4" /> Supplier
                        </CardTitle>
                    </CardHeader>
                    <CardContent class="p-5">
                        <div class="flex items-center gap-4 mb-4">
                            <div
                                class="h-12 w-12 rounded-full bg-fuchsia-100 flex items-center justify-center text-fuchsia-600 font-bold text-lg shadow-sm"
                            >
                                {(controller.purchase.supplier?.name || "S")[0]}
                            </div>
                            <div>
                                <div class="font-bold text-lg">
                                    {controller.purchase.supplier?.name ||
                                        "Unknown"}
                                </div>
                                <div
                                    class="text-xs text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded inline-block"
                                >
                                    {controller.purchase.supplier?.code || "-"}
                                </div>
                            </div>
                        </div>

                        <div class="space-y-3 text-sm border-t pt-4">
                            <div class="flex items-start gap-3">
                                <Phone
                                    class="h-4 w-4 text-muted-foreground mt-0.5"
                                />
                                <span class="text-foreground/80"
                                    >{controller.purchase.supplier?.contact ||
                                        controller.purchase.supplier?.phone ||
                                        "-"}</span
                                >
                            </div>
                            <div class="flex items-start gap-3">
                                <MapPin
                                    class="h-4 w-4 text-muted-foreground mt-0.5"
                                />
                                <span class="text-foreground/80 leading-relaxed"
                                    >{controller.purchase.supplier?.address ||
                                        "-"}</span
                                >
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    {/if}
</div>

<style>
    @media print {
        :global(body) {
            background: white !important;
            color: black !important;
        }
        :global(header),
        :global(nav),
        :global(aside) {
            display: none !important;
        }
        .print\:hidden {
            display: none !important;
        }
    }
</style>
