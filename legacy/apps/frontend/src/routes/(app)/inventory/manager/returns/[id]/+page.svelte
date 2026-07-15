<script lang="ts">
    import { page } from "$app/stores";
    import { Button } from "$lib/shared/components/ui/button";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { ArrowLeft, Printer } from "lucide-svelte";
    import { Skeleton } from "$lib/shared/components/ui/skeleton";
    import { PurchaseReturnDetailController } from "$lib/features/inventory/purchase-returns/purchase-return-detail.controller.svelte";

    const id = $page.params.id ?? "";
    const controller = new PurchaseReturnDetailController(id);

    // Shorthand for the return data
    let r = $derived(controller.purchaseReturn);
</script>

<div class="space-y-6 print:hidden">
    <div class="flex items-center gap-4">
        <Button variant="outline" size="icon" href="/purchase-returns">
            <ArrowLeft class="h-4 w-4" />
        </Button>
        <h2 class="text-3xl font-bold tracking-tight">
            Detail Retur Pembelian
        </h2>
        <div class="ml-auto">
            <Button
                variant="outline"
                onclick={() => controller.handlePrint()}
                class="print:hidden"
            >
                <Printer class="mr-2 h-4 w-4" />
                Print
            </Button>
        </div>
    </div>

    {#if controller.isLoading}
        <div class="space-y-4">
            <Skeleton class="h-40 w-full" />
            <Skeleton class="h-60 w-full" />
        </div>
    {:else if controller.isError}
        <div class="p-4 text-red-500 border rounded bg-red-50">
            Gagal memuat detail retur: {controller.error?.message}
        </div>
    {:else if !r}
        <div class="p-8 text-center border rounded bg-muted/20">
            <h3 class="text-lg font-semibold">Retur Tidak Ditemukan</h3>
            <p class="text-muted-foreground">
                Data retur dengan ID <span class="font-mono font-bold"
                    >{id}</span
                > tidak ditemukan.
            </p>
            <Button variant="outline" class="mt-4" href="/purchase-returns">
                Kembali ke Daftar
            </Button>
        </div>
    {:else}
        <!-- Header Info -->
        <Card>
            <CardHeader>
                <CardTitle>Informasi Retur #{r.id}</CardTitle>
            </CardHeader>
            <CardContent class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <div class="text-sm font-medium text-muted-foreground">
                        Tanggal
                    </div>
                    <div class="text-lg">
                        {new Date(r.date).toLocaleDateString("id-ID", {
                            dateStyle: "long",
                        })}
                    </div>
                </div>
                <div>
                    <div class="text-sm font-medium text-muted-foreground">
                        Supplier
                    </div>
                    <div class="text-lg font-semibold">{r.supplier.name}</div>
                    <div class="text-sm text-muted-foreground">
                        {r.supplier.address || "-"}
                    </div>
                </div>
                <div>
                    <div class="text-sm font-medium text-muted-foreground">
                        Catatan
                    </div>
                    <div class="italic">{r.notes || "-"}</div>
                </div>
                <div>
                    <div class="text-sm font-medium text-muted-foreground">
                        Dibuat Oleh
                    </div>
                    <div>{r.user?.name || "-"}</div>
                </div>
            </CardContent>
        </Card>

        <!-- Items Table -->
        <Card>
            <CardHeader class="flex flex-row items-center justify-between">
                <CardTitle>Item Retur</CardTitle>
            </CardHeader>
            <CardContent>
                <!-- Desktop Table View -->
                <div class="hidden md:block border rounded-md">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b bg-muted/50">
                                <th class="p-3 text-left">Produk</th>
                                <th class="p-3 text-left">Kategori</th>
                                <th class="p-3 text-left">Batch/Varian</th>
                                <th class="p-3 text-right">Qty Retur</th>
                                <th class="p-3 text-left">Alasan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each r.items as item}
                                <tr
                                    class="border-b last:border-0 hover:bg-muted/50"
                                >
                                    <td class="p-3 font-medium"
                                        >{item.product?.name ||
                                            "Unknown Product"}</td
                                    >
                                    <td class="p-3 text-muted-foreground"
                                        >{item.product?.category?.name ||
                                            "-"}</td
                                    >
                                    <td class="p-3"
                                        >{item.batch?.variant || "-"}</td
                                    >
                                    <td
                                        class="p-3 text-right font-bold text-red-600"
                                        >-{item.qty}</td
                                    >
                                    <td class="p-3 text-muted-foreground"
                                        >{item.reason || "-"}</td
                                    >
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>

                <!-- Mobile Card View -->
                <div class="md:hidden space-y-4">
                    {#each r.items as item}
                        <div class="bg-muted/30 rounded-lg border p-4">
                            <div class="flex justify-between items-start mb-2">
                                <div class="font-medium">
                                    {item.product?.name || "Unknown Product"}
                                </div>
                                <div class="font-bold text-red-600">
                                    -{item.qty}
                                </div>
                            </div>
                            <div class="text-sm text-muted-foreground mb-2">
                                {item.batch?.variant || "-"} • {item.product
                                    ?.category?.name || "-"}
                            </div>
                            <div class="text-sm italic bg-muted p-2 rounded">
                                " {item.reason || "-"} "
                            </div>
                        </div>
                    {/each}
                </div>
            </CardContent>
        </Card>
    {/if}
</div>

<!-- Print Layout -->
{#if r}
    <div
        class="hidden print:block print-layout absolute top-0 left-0 w-full min-h-screen z-[9999] bg-white text-black p-8 font-sans"
    >
        <!-- Header -->
        <div class="flex justify-between mb-8">
            <div class="w-1/2">
                <!-- Logo Layout -->
                <div class="flex items-center gap-4 mb-4">
                    <div
                        class="bg-slate-800 text-white rounded-full h-16 w-16 flex items-center justify-center text-xl font-bold"
                    >
                        S
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold">
                            {controller.storeName}
                        </h1>
                        {#if controller.storeAddress}<p class="text-sm">
                                {controller.storeAddress}
                            </p>{/if}
                        {#if controller.storePhone}<p class="text-sm">
                                Tel: {controller.storePhone}
                            </p>{/if}
                    </div>
                </div>
            </div>
            <div class="w-1/2 text-right">
                <div class="bg-slate-100 p-2 mb-2 inline-block">
                    <h3 class="text-2xl font-bold uppercase">Parts Return</h3>
                </div>
                <div class="text-xl font-bold text-slate-500 mt-2">
                    No. {r.id}
                </div>
            </div>
        </div>

        <!-- Info Grid -->
        <div class="flex mb-8 border-t border-b border-l overflow-hidden">
            <!-- Left: Supplier Info -->
            <div class="w-1/2 border-r p-1">
                <div class="flex flex-col ml-4">
                    <div class="font-bold text-2xl">
                        {r.supplier?.name || "Unknown Supplier"}
                    </div>
                    <div class="text-sm">{r.supplier?.address || "-"}</div>
                    <div class="text-sm">{r.supplier?.phone || "-"}</div>
                </div>
            </div>
            <!-- Right: Meta Info -->
            <div class="w-1/2">
                <div class="grid grid-cols-[150px_1fr] border-b">
                    <div class="bg-slate-100 p-1 px-2 font-bold text-sm">
                        RETURNS DATE
                    </div>
                    <div class="p-1 px-2">
                        {new Date(r.date || new Date()).toLocaleDateString()}
                    </div>
                </div>
                <div class="grid grid-cols-[150px_1fr] border-b">
                    <div class="bg-slate-100 p-1 px-2 font-bold text-sm">
                        INVOICE NO.
                    </div>
                    <div class="p-1 px-2">-</div>
                </div>
                <div class="grid grid-cols-[150px_1fr]">
                    <div class="bg-slate-100 p-1 px-2 font-bold text-sm">
                        ORDER NO.
                    </div>
                    <div class="p-1 px-2">-</div>
                </div>
            </div>
        </div>

        <!-- Items Table -->
        <div class="mb-8">
            <table class="w-full border-collapse text-sm">
                <thead>
                    <tr class="bg-slate-400 text-white uppercase text-xs">
                        <th class="p-2 border border-slate-400 w-12 text-center"
                            >No.</th
                        >
                        <th class="p-2 border border-slate-400 text-left"
                            >Description / Item</th
                        >
                        <th class="p-2 border border-slate-400 text-left w-32"
                            >Kategori</th
                        >
                        <th class="p-2 border border-slate-400 text-left"
                            >Alasan Retur</th
                        >
                        <th class="p-2 border border-slate-400 w-16 text-center"
                            >Qty</th
                        >
                    </tr>
                </thead>
                <tbody>
                    {#each r.items as item, i}
                        <tr class="border-b border-slate-200">
                            <td
                                class="p-2 border-r border-l border-slate-200 text-center"
                                >{i + 1}</td
                            >
                            <td class="p-2 border-r border-slate-200">
                                <div class="font-bold">
                                    {item.product?.name || "Unknown"}
                                </div>
                                <div class="text-xs text-slate-500">
                                    {item.product?.code || ""} - {item.batch
                                        ?.variant || "-"}
                                </div>
                            </td>
                            <td class="p-2 border-r border-slate-200"
                                >{item.product?.category?.name || "-"}</td
                            >
                            <td
                                class="p-2 border-r border-slate-200 text-slate-600 italic"
                                >{item.reason || "-"}</td
                            >
                            <td
                                class="p-2 border-r border-slate-200 text-center font-bold"
                                >{item.qty}</td
                            >
                        </tr>
                    {/each}
                </tbody>
                <tfoot>
                    <tr class="bg-slate-100 font-bold">
                        <td
                            colspan="4"
                            class="p-2 text-right border border-slate-200"
                            >TOTAL QTY</td
                        >
                        <td class="p-2 text-center border border-slate-200">
                            {controller.totalQty}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>
{/if}

<style>
    @media print {
        @page {
            margin: 0.5cm;
            size: auto;
        }
        /* Hide everything */
        :global(body) {
            visibility: hidden;
            overflow: hidden;
        }
        /* Show only our print layout */
        .print-layout {
            visibility: visible;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: auto;
            overflow: visible;
        }
        /* Ensure children are visible */
        .print-layout * {
            visibility: visible;
        }
        /* Ensure background colors print */
        * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
    }
</style>
