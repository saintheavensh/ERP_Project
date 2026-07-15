<script lang="ts">
    import { page } from "$app/stores";
    import { PurchaseDetailController } from "$lib/features/sales/components/purchases/purchase-detail.controller.svelte";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { Button } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
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
        ChevronLeft,
        PackageCheck,
        AlertCircle,
        Loader2,
        Tag,
    } from "lucide-svelte";
    import { onMount } from "svelte";

    let purchaseDetail: any = $state(null);
    let error: string | null = $state(null);

    const id = $page.params.id;
    const controller = new PurchaseDetailController(id || "");

    onMount(() => {
        controller.load();
    });

    const categories = $derived.by(() => {
        if (!controller.purchase) return [];
        const cats: Record<string, { id: string; name: string; items: any[] }> =
            {};
        controller.purchase.items.forEach((item: any) => {
            const catId = item.product?.categoryId || "Uncategorized";
            const catName = item.product?.category?.name || "Uncategorized";
            if (!cats[catId])
                cats[catId] = { id: catId, name: catName, items: [] };
            cats[catId].items.push(item);
        });
        return Object.values(cats);
    });

    function getEditItem(productId: string, variant: string | null) {
        return controller.editItems.find(
            (i: any) => i.productId === productId && i.variant === variant,
        );
    }
</script>

<div class="container mx-auto py-6 max-w-5xl space-y-6 pb-24">
    <!-- Header -->
    <div
        class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
    >
        <div class="space-y-1">
            <Button
                variant="ghost"
                href="/warehouse/reception"
                class="-ml-2 h-8 text-muted-foreground"
            >
                <ChevronLeft class="mr-2 h-4 w-4" /> Kembali ke List
            </Button>
            <div class="flex items-center gap-3">
                <div
                    class="h-10 w-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center"
                >
                    <PackageCheck class="h-6 w-6" />
                </div>
                <div>
                    <h1 class="text-3xl font-bold tracking-tight">
                        Penerimaan Barang
                    </h1>
                    <p class="text-muted-foreground">PO #{id}</p>
                </div>
            </div>
        </div>
    </div>

    {#if controller.loading}
        <div class="flex h-[400px] items-center justify-center">
            <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    {:else if controller.error}
        <Card class="border-destructive bg-destructive/10">
            <CardContent class="py-10 text-center">
                <AlertCircle class="mx-auto h-12 w-12 text-destructive mb-4" />
                <p class="text-destructive font-medium">{controller.error}</p>
                <Button
                    variant="outline"
                    class="mt-4"
                    onclick={() => controller.load()}
                >
                    Coba Lagi
                </Button>
            </CardContent>
        </Card>
    {:else if controller.purchase}
        <!-- Info Summary -->
        <Card class="bg-muted/30 border-none shadow-none">
            <CardContent class="py-4 flex flex-wrap gap-8">
                <div>
                    <p
                        class="text-[10px] uppercase font-bold text-muted-foreground"
                    >
                        Supplier
                    </p>
                    <p class="font-medium text-lg">
                        {controller.purchase.supplier?.name}
                    </p>
                </div>
                <div>
                    <p
                        class="text-[10px] uppercase font-bold text-muted-foreground"
                    >
                        Total Item
                    </p>
                    <p class="font-medium text-lg">
                        {controller.purchase.items.length} SKU
                    </p>
                </div>
                <div>
                    <p
                        class="text-[10px] uppercase font-bold text-muted-foreground"
                    >
                        Tanggal Order
                    </p>
                    <p class="font-medium text-lg">
                        {controller.formatDate(controller.purchase.date)}
                    </p>
                </div>
            </CardContent>
        </Card>

        <!-- Category Groups -->
        <div class="space-y-6">
            {#each categories as cat}
                <Card
                    class="overflow-hidden border-l-4 border-l-amber-500 shadow-sm"
                >
                    <CardHeader
                        class="bg-amber-50/50 py-3 border-b border-amber-100"
                    >
                        <CardTitle
                            class="text-lg text-amber-800 flex items-center gap-2"
                        >
                            <Tag class="h-4 w-4" />
                            {cat.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent class="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow class="bg-muted/20">
                                    <TableHead class="w-[50%]"
                                        >Nama Produk</TableHead
                                    >
                                    <TableHead class="w-[15%]">Varian</TableHead
                                    >
                                    <TableHead class="w-[15%] text-center"
                                        >Dipesan</TableHead
                                    >
                                    <TableHead class="w-[20%] text-center"
                                        >Diterima</TableHead
                                    >
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {#each cat.items as item}
                                    {@const editItem = getEditItem(
                                        item.productId,
                                        item.variant,
                                    )}
                                    <TableRow>
                                        <TableCell class="font-medium">
                                            {item.product?.name}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                class="font-normal"
                                            >
                                                {item.variant || "Original"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell
                                            class="text-center font-bold text-muted-foreground"
                                        >
                                            {item.qtyOrdered}
                                        </TableCell>
                                        <TableCell>
                                            <div
                                                class="flex items-center justify-center gap-2"
                                            >
                                                {#if editItem}
                                                    <Input
                                                        type="number"
                                                        class="w-24 text-center h-10 text-lg font-bold {editItem.qtyReceived !==
                                                        item.qtyOrdered
                                                            ? 'border-amber-500 text-amber-700 bg-amber-50 shadow-inner'
                                                            : ''}"
                                                        bind:value={
                                                            editItem.qtyReceived
                                                        }
                                                        min="0"
                                                    />
                                                {/if}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                {/each}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            {/each}
        </div>

        <!-- Sticky Footer Action -->
        <div
            class="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]"
        >
            <div
                class="container mx-auto max-w-5xl flex items-center justify-between"
            >
                <div class="flex items-center gap-4">
                    <!-- Optional summary here -->
                </div>
                <div class="flex items-center gap-3 w-full justify-end">
                    <Button variant="ghost" href="/warehouse/reception"
                        >Batal</Button
                    >
                    <Button
                        class="bg-amber-600 hover:bg-amber-700 px-8 w-full md:w-auto text-lg h-12"
                        disabled={controller.isSubmitting}
                        onclick={() => controller.handleReceive()}
                    >
                        {#if controller.isSubmitting}
                            <Loader2 class="mr-2 h-5 w-5 animate-spin" />
                            Memproses...
                        {:else}
                            <PackageCheck class="mr-2 h-5 w-5" />
                            Simpan Penerimaan
                        {/if}
                    </Button>
                </div>
            </div>
        </div>
    {/if}
</div>
