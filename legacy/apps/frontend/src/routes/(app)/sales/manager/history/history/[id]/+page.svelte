<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { SalesService } from "$lib/features/sales/components/sales.service";
    import { formatCurrency } from "$lib/shared/lib/utils";
    import { Button } from "$lib/shared/components/ui/button";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { Separator } from "$lib/shared/components/ui/separator";
    import { Badge } from "$lib/shared/components/ui/badge";
    import {
        ArrowLeft,
        Printer,
        Download,
        Share2,
        FileText,
        CreditCard,
        User,
        Calendar,
        MapPin,
        Phone,
        CheckCircle2,
        Clock,
        AlertCircle,
    } from "lucide-svelte";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/shared/components/ui/table";
    import { fade, fly } from "svelte/transition";

    let sale: any = null;
    let loading = true;
    let error = "";

    onMount(async () => {
        const id = $page.params.id;
        if (!id) return;

        try {
            sale = await SalesService.getOne(id);
        } catch (e: any) {
            error = "Gagal memuat data penjualan.";
            console.error(e);
        } finally {
            loading = false;
        }
    });

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function getStatusColor(status: string) {
        switch (status) {
            case "paid":
                return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200";
            case "partial":
                return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200";
            case "unpaid":
                return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200";
            default:
                return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
        }
    }
</script>

<div class="min-h-screen space-y-8 p-6 pb-20">
    <!-- Header with Actions -->
    <div
        class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
    >
        <div class="flex items-center gap-4">
            <Button
                variant="outline"
                size="icon"
                href="/sales/history"
                class="rounded-full bg-background/50 backdrop-blur-sm border-muted-foreground/20 hover:bg-background/80"
            >
                <ArrowLeft class="h-4 w-4" />
            </Button>
            <div>
                <h2
                    class="text-2xl font-bold tracking-tight flex items-center gap-2"
                >
                    Detail Invoice
                    <span
                        class="text-sm font-normal text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md font-mono"
                    >
                        #{sale?.id || "..."}
                    </span>
                </h2>
                <div
                    class="flex items-center gap-2 text-muted-foreground text-sm mt-1"
                >
                    <Calendar class="h-3.5 w-3.5" />
                    {#if sale}
                        {formatDate(sale.createdAt)}
                    {:else}
                        <div
                            class="h-4 w-24 bg-muted/20 animate-pulse rounded"
                        ></div>
                    {/if}
                </div>
            </div>
        </div>

        <div class="flex gap-2 print:hidden">
            <Button variant="outline" size="sm" class="gap-2 shadow-sm">
                <Share2 class="h-4 w-4" />
                <span class="hidden sm:inline">Bagikan</span>
            </Button>
            <Button
                variant="default"
                size="sm"
                onclick={() => window.print()}
                class="gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
            >
                <Printer class="h-4 w-4" />
                Cetak Invoice
            </Button>
        </div>
    </div>

    {#if loading}
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
    {:else if error}
        <div
            class="flex flex-col items-center justify-center p-12 text-center bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20"
        >
            <AlertCircle class="h-10 w-10 text-red-500 mb-4" />
            <h3 class="text-lg font-bold text-red-700 dark:text-red-400">
                Terjadi Kesalahan
            </h3>
            <p class="text-red-600/80 dark:text-red-400/80">{error}</p>
            <Button
                variant="outline"
                onclick={() => location.reload()}
                class="mt-4">Coba Lagi</Button
            >
        </div>
    {:else if sale}
        <div
            in:fade={{ duration: 300 }}
            class="grid gap-6 md:grid-cols-3 lg:grid-cols-4"
        >
            <!-- Left Column: Invoice Details (Takes up 2/3 or 3/4) -->
            <div class="md:col-span-2 lg:col-span-3 space-y-6">
                <!-- Status Banner -->
                <div
                    class="{getStatusColor(
                        sale.paymentStatus,
                    )} bg-opacity-10 border rounded-xl p-4 flex justify-between items-center shadow-sm"
                >
                    <div class="flex items-center gap-3">
                        <div
                            class="p-2 bg-white/50 dark:bg-black/20 rounded-full"
                        >
                            {#if sale.paymentStatus === "paid"}
                                <CheckCircle2 class="h-5 w-5" />
                            {:else if sale.paymentStatus === "partial"}
                                <Clock class="h-5 w-5" />
                            {:else}
                                <AlertCircle class="h-5 w-5" />
                            {/if}
                        </div>
                        <div>
                            <p
                                class="font-bold text-sm uppercase tracking-wide"
                            >
                                Status Pembayaran
                            </p>
                            <p class="text-xs font-semibold opacity-80">
                                {sale.paymentStatus === "paid"
                                    ? "LUNAS - Transaksi Selesai"
                                    : sale.paymentStatus === "partial"
                                      ? "SEBAGIAN - Menunggu pelunasan"
                                      : "BELUM DIBAYAR"}
                            </p>
                        </div>
                    </div>
                    <Badge
                        variant="outline"
                        class="bg-white/50 dark:bg-black/20 border-0 px-3 py-1 font-mono text-sm"
                    >
                        {sale.paymentStatus.toUpperCase()}
                    </Badge>
                </div>

                <!-- Invoice Card -->
                <Card
                    class="bg-card/80 backdrop-blur-sm border-l-4 border-l-blue-600 shadow-lg"
                >
                    <CardHeader class="pb-4 border-b bg-muted/10">
                        <div class="flex justify-between items-center">
                            <div class="flex items-center gap-2">
                                <FileText class="h-5 w-5 text-blue-600" />
                                <CardTitle class="text-lg"
                                    >Rincian Item</CardTitle
                                >
                            </div>
                            <span
                                class="text-xs text-muted-foreground font-mono"
                            >
                                {sale.items.length} Barang
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent class="p-0">
                        <div class="hidden md:block">
                            <Table>
                                <TableHeader class="bg-muted/30">
                                    <TableRow
                                        class="hover:bg-transparent border-0"
                                    >
                                        <TableHead class="pl-6 w-[40%]"
                                            >Produk</TableHead
                                        >
                                        <TableHead class="w-[20%]"
                                            >Varian</TableHead
                                        >
                                        <TableHead class="text-right w-[10%]"
                                            >Qty</TableHead
                                        >
                                        <TableHead class="text-right w-[15%]"
                                            >Harga Satuan</TableHead
                                        >
                                        <TableHead
                                            class="text-right pr-6 w-[15%]"
                                            >Total</TableHead
                                        >
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {#each sale.items as item}
                                        <TableRow
                                            class="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 border-b border-muted/50"
                                        >
                                            <TableCell class="pl-6 font-medium">
                                                <div class="flex flex-col">
                                                    <span
                                                        class="text-foreground"
                                                        >{item.product?.name ||
                                                            "Unknown Product"}</span
                                                    >
                                                    {#if item.product?.sku}
                                                        <span
                                                            class="text-[10px] text-muted-foreground font-mono"
                                                            >SKU: {item.product
                                                                .sku}</span
                                                        >
                                                    {/if}
                                                </div>
                                            </TableCell>
                                            <TableCell>
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
                                                class="text-right font-mono text-sm"
                                                >{item.qty}</TableCell
                                            >
                                            <TableCell
                                                class="text-right font-mono text-sm text-muted-foreground"
                                            >
                                                {formatCurrency(item.price)}
                                            </TableCell>
                                            <TableCell
                                                class="text-right pr-6 font-bold font-mono text-foreground"
                                            >
                                                {formatCurrency(item.subtotal)}
                                            </TableCell>
                                        </TableRow>
                                    {/each}
                                </TableBody>
                            </Table>
                        </div>

                        <!-- Mobile List View -->
                        <div class="md:hidden divide-y">
                            {#each sale.items as item}
                                <div
                                    class="p-4 flex justify-between items-start"
                                >
                                    <div class="space-y-1">
                                        <div class="font-medium">
                                            {item.product?.name || "Unknown"}
                                        </div>
                                        <div
                                            class="text-xs text-muted-foreground flex gap-2"
                                        >
                                            {#if item.variant}
                                                <Badge
                                                    variant="outline"
                                                    class="text-[10px] h-5 px-1"
                                                    >{item.variant}</Badge
                                                >
                                            {/if}
                                            <span>x{item.qty}</span>
                                        </div>
                                    </div>
                                    <div class="font-bold font-mono">
                                        {formatCurrency(item.subtotal)}
                                    </div>
                                </div>
                            {/each}
                        </div>

                        <!-- Summary Section -->
                        <div
                            class="flex flex-col items-end gap-3 p-6 bg-muted/10"
                        >
                            <div class="w-full md:w-1/2 lg:w-1/3 space-y-2">
                                <div
                                    class="flex justify-between text-sm text-muted-foreground"
                                >
                                    <span>Subtotal</span>
                                    <span class="font-mono"
                                        >{formatCurrency(
                                            sale.totalAmount,
                                        )}</span
                                    >
                                </div>
                                {#if sale.discountAmount > 0}
                                    <div
                                        class="flex justify-between text-sm text-red-500"
                                    >
                                        <span>Diskon</span>
                                        <span class="font-mono"
                                            >- {formatCurrency(
                                                sale.discountAmount,
                                            )}</span
                                        >
                                    </div>
                                {/if}
                                <Separator class="my-2" />
                                <div
                                    class="flex justify-between items-center text-lg font-bold text-foreground"
                                >
                                    <span>Total Tagihan</span>
                                    <span class="font-mono text-blue-600"
                                        >{formatCurrency(
                                            sale.finalAmount,
                                        )}</span
                                    >
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <!-- Right Column: Info & Payment -->
            <div class="space-y-6">
                <!-- Customer Info -->
                <Card
                    class="bg-card/50 backdrop-blur-sm border-blue-100 dark:border-blue-900/30"
                >
                    <CardHeader class="pb-3">
                        <CardTitle
                            class="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider text-muted-foreground"
                        >
                            <User class="h-4 w-4" /> Pelanggan
                        </CardTitle>
                    </CardHeader>
                    <CardContent class="grid gap-4">
                        <div class="flex items-center gap-3">
                            <div
                                class="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-bold text-lg"
                            >
                                {(sale.customerName || "G")[0].toUpperCase()}
                            </div>
                            <div>
                                <div class="font-bold">
                                    {sale.customerName || "Guest Customer"}
                                </div>
                                <div class="text-xs text-muted-foreground">
                                    ID: {sale.member?.id || "-"}
                                </div>
                            </div>
                        </div>

                        {#if sale.member?.phone}
                            <div
                                class="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 p-2 rounded border border-dashed"
                            >
                                <Phone class="h-3.5 w-3.5" />
                                <span>{sale.member.phone}</span>
                            </div>
                        {/if}

                        <div
                            class="text-xs text-muted-foreground mt-2 border-t pt-2"
                        >
                            <div class="flex justify-between py-1">
                                <span>Kasir:</span>
                                <span class="font-medium text-foreground"
                                    >{sale.user?.name || sale.userId}</span
                                >
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <!-- Payment Info -->
                <Card
                    class="bg-card/50 backdrop-blur-sm border-green-100 dark:border-green-900/30"
                >
                    <CardHeader class="pb-3">
                        <CardTitle
                            class="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider text-muted-foreground"
                        >
                            <CreditCard class="h-4 w-4" /> Pembayaran
                        </CardTitle>
                    </CardHeader>
                    <CardContent class="space-y-3">
                        {#each sale.payments as pay}
                            <div
                                class="bg-background/80 p-3 rounded-lg border flex justify-between items-center shadow-sm"
                            >
                                <div>
                                    <div
                                        class="text-sm font-medium capitalize flex items-center gap-1.5"
                                    >
                                        {pay.method}
                                        {#if pay.method === "cash"}
                                            <span
                                                class="text-[10px] bg-green-100 text-green-700 px-1 rounded"
                                                >Tunai</span
                                            >
                                        {:else}
                                            <span
                                                class="text-[10px] bg-indigo-100 text-indigo-700 px-1 rounded"
                                                >Non-Tunai</span
                                            >
                                        {/if}
                                    </div>
                                    <div
                                        class="text-[10px] text-muted-foreground mt-0.5"
                                    >
                                        {new Date(
                                            sale.createdAt,
                                        ).toLocaleTimeString("id-ID", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </div>
                                </div>
                                <div class="font-bold font-mono text-sm">
                                    {formatCurrency(pay.amount)}
                                </div>
                            </div>
                        {/each}

                        {#if sale.notes}
                            <div class="mt-4 pt-3 border-t">
                                <span
                                    class="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1"
                                >
                                    <FileText class="h-3 w-3" /> Catatan
                                </span>
                                <p
                                    class="text-xs italic text-muted-foreground bg-yellow-50 dark:bg-yellow-900/10 p-2 rounded border border-yellow-100 dark:border-yellow-900/20"
                                >
                                    "{sale.notes}"
                                </p>
                            </div>
                        {/if}
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
        /* Hide all non-essential elements */
        .print\:hidden {
            display: none !important;
        }
    }
</style>
