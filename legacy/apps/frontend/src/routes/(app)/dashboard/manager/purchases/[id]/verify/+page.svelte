<script lang="ts">
    import { page } from "$app/stores";
    import { PurchaseDetailController } from "$lib/features/sales/components/purchases/purchase-detail.controller.svelte";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
        CardDescription,
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
        Select,
        SelectTrigger,
        SelectContent,
        SelectItem,
    } from "$lib/shared/components/ui/select";
    import { Label } from "$lib/shared/components/ui/label";
    import { Separator } from "$lib/shared/components/ui/separator";
    import {
        ChevronLeft,
        Gavel,
        AlertCircle,
        Loader2,
        Truck,
        TicketPercent,
        Wallet,
        Printer,
        PackageCheck,
        Tag,
        FileText,
        Calendar,
        FileUp,
    } from "lucide-svelte";
    import { onMount } from "svelte";

    const id = $page.params.id as string;
    const controller = new PurchaseDetailController(id);

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

    const PAYMENT_METHODS = {
        cash: "Tunai",
        transfer: "Transfer",
        credit: "Hutang",
    };
</script>

<div class="container mx-auto py-6 max-w-6xl space-y-6">
    <!-- Header -->
    <div
        class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
    >
        <div class="space-y-1">
            <Button
                variant="ghost"
                href="/manager/purchases/{id}"
                class="-ml-2 h-8 text-muted-foreground"
            >
                <ChevronLeft class="mr-2 h-4 w-4" /> Kembali ke Detail
            </Button>
            <div class="flex items-center gap-3">
                <div
                    class="h-10 w-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center"
                >
                    <Gavel class="h-6 w-6" />
                </div>
                <div>
                    <h1 class="text-3xl font-bold tracking-tight">
                        Verifikasi & Penentuan Harga
                    </h1>
                    <p class="text-muted-foreground">
                        PO {id} - Masukkan harga beli akhir dan harga jual
                    </p>
                </div>
            </div>
        </div>

        <div class="flex items-center gap-2">
            <Badge
                variant="outline"
                class="px-3 py-1 text-sm bg-blue-50 text-blue-700 border-blue-200"
            >
                Status: {controller.purchase?.status || "..."}
            </Badge>
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
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <!-- Left Side: Pricing Table -->
            <div class="lg:col-span-3 space-y-6">
                {#each categories as cat}
                    <Card
                        class="overflow-hidden border-l-4 border-l-green-500 shadow-sm"
                    >
                        <CardHeader class="bg-green-50/30 py-3 border-b">
                            <CardTitle
                                class="text-lg text-green-800 flex items-center justify-between"
                            >
                                <span>{cat.name}</span>
                                <Badge variant="outline" class="bg-white"
                                    >{cat.items.length} Item</Badge
                                >
                            </CardTitle>
                        </CardHeader>
                        <CardContent class="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow class="bg-muted/10">
                                        <TableHead class="w-[30%]"
                                            >Produk</TableHead
                                        >
                                        <TableHead class="w-[10%] text-center"
                                            >Qty</TableHead
                                        >
                                        <TableHead class="w-[25%]"
                                            >Harga Beli Akhir</TableHead
                                        >
                                        <TableHead class="w-[25%]"
                                            >Harga Jual Baru</TableHead
                                        >
                                        <TableHead class="w-[10%]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {#each cat.items as item}
                                        {@const editItem = getEditItem(
                                            item.productId,
                                            item.variant,
                                        )}
                                        <TableRow>
                                            <TableCell>
                                                <div class="flex flex-col">
                                                    <span class="font-medium"
                                                        >{item.product
                                                            ?.name}</span
                                                    >
                                                    <span
                                                        class="text-[10px] text-muted-foreground"
                                                        >{item.variant ||
                                                            "Original"}</span
                                                    >
                                                </div>
                                            </TableCell>
                                            <TableCell
                                                class="text-center font-bold"
                                            >
                                                {item.qtyReceived}
                                            </TableCell>
                                            <TableCell>
                                                <div class="relative">
                                                    <span
                                                        class="absolute left-2.5 top-2 text-xs text-muted-foreground"
                                                        >Rp</span
                                                    >
                                                    {#if editItem}
                                                        <Input
                                                            type="number"
                                                            class="h-8 pl-8 text-sm font-medium"
                                                            bind:value={
                                                                editItem.buyPrice
                                                            }
                                                            placeholder="Harga Beli"
                                                        />
                                                    {/if}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div class="relative">
                                                    <span
                                                        class="absolute left-2.5 top-2 text-xs text-muted-foreground"
                                                        >Rp</span
                                                    >
                                                    {#if editItem}
                                                        <Input
                                                            type="number"
                                                            class="h-8 pl-8 text-sm font-medium border-blue-200 bg-blue-50/30"
                                                            bind:value={
                                                                editItem.sellPrice
                                                            }
                                                            placeholder="Harga Jual"
                                                        />
                                                    {/if}
                                                </div>
                                            </TableCell>
                                            <TableCell class="text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    class="h-8 w-8"
                                                    onclick={() =>
                                                        controller.printLabel(
                                                            item,
                                                        )}
                                                >
                                                    <Printer class="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    {/each}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                {/each}
            </div>

            <!-- Right Side: Summary & Actions -->
            <div class="lg:col-span-1 space-y-6">
                <Card
                    class="sticky top-6 shadow-md border-green-200 overflow-hidden"
                >
                    <CardHeader class="bg-green-600 text-white py-4">
                        <CardTitle
                            class="text-sm uppercase tracking-wider opacity-80"
                            >Ringkasan Biaya</CardTitle
                        >
                        <div class="text-3xl font-bold">
                            {controller.formatRp(controller.grandTotal)}
                        </div>
                    </CardHeader>
                    <CardContent class="p-5 space-y-4">
                        <!-- Costs Inputs -->
                        <div class="space-y-4">
                            <div class="space-y-1.5">
                                <Label
                                    class="text-xs font-bold text-muted-foreground flex items-center gap-1"
                                >
                                    <FileText class="h-3 w-3" /> NO. INVOICE SUPPLIER
                                </Label>
                                <Input
                                    type="text"
                                    placeholder="Contoh: INV/2024/001"
                                    bind:value={controller.referenceNumber}
                                />
                            </div>

                            <div class="space-y-1.5">
                                <Label
                                    class="text-xs font-bold text-muted-foreground flex items-center gap-1"
                                >
                                    <Truck class="h-3 w-3" /> ONGKOS KIRIM
                                </Label>
                                <div class="relative">
                                    <span
                                        class="absolute left-3 top-2.5 text-xs text-muted-foreground"
                                        >Rp</span
                                    >
                                    <Input
                                        type="number"
                                        class="pl-8"
                                        bind:value={controller.shippingFee}
                                    />
                                </div>
                                <div class="pt-1">
                                    <Select
                                        type="single"
                                        bind:value={
                                            controller.shippingExpenseAccountId
                                        }
                                    >
                                        <SelectTrigger class="h-8 text-xs">
                                            <span>
                                                {controller.expenseAccounts.find(
                                                    (a) =>
                                                        a.id ===
                                                        controller.shippingExpenseAccountId,
                                                )?.name || "Pilih Akun Biaya"}
                                            </span>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {#each controller.expenseAccounts as acc}
                                                <SelectItem value={acc.id}
                                                    >{acc.code} - {acc.name}</SelectItem
                                                >
                                            {/each}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div class="space-y-1.5">
                                <Label
                                    class="text-xs font-bold text-muted-foreground flex items-center gap-1"
                                >
                                    <TicketPercent class="h-3 w-3" /> DISKON TOTAL
                                </Label>
                                <div class="relative">
                                    <span
                                        class="absolute left-3 top-2.5 text-xs text-muted-foreground"
                                        >Rp</span
                                    >
                                    <Input
                                        type="number"
                                        class="pl-8 text-destructive font-medium"
                                        bind:value={controller.discountAmount}
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <!-- Totals Breakdown -->
                        <div class="space-y-2 pt-2">
                            <div class="flex justify-between text-sm">
                                <span class="text-muted-foreground"
                                    >Total Barang</span
                                >
                                <span
                                    >{controller.formatRp(
                                        controller.actualItemsTotal,
                                    )}</span
                                >
                            </div>
                            <div class="flex justify-between text-sm">
                                <span
                                    class="text-muted-foreground text-xs italic"
                                    >* Diterima: {controller.purchase.items.reduce(
                                        (s: number, i: any) =>
                                            s + (i.qtyReceived || 0),
                                        0,
                                    )} unit</span
                                >
                            </div>
                        </div>

                        <Separator />

                        <!-- Payment Section -->
                        <div class="space-y-4 pt-2">
                            <div class="space-y-1.5">
                                <Label
                                    class="text-xs font-bold text-muted-foreground flex items-center gap-1"
                                >
                                    <Wallet class="h-3 w-3" /> PEMBAYARAN AWAL
                                </Label>
                                <div class="grid grid-cols-2 gap-2">
                                    <Select
                                        type="single"
                                        bind:value={controller.paymentMethod}
                                    >
                                        <SelectTrigger class="h-9">
                                            <span
                                                >{PAYMENT_METHODS[
                                                    controller.paymentMethod as keyof typeof PAYMENT_METHODS
                                                ] || "Metode"}</span
                                            >
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cash"
                                                >Tunai</SelectItem
                                            >
                                            <SelectItem value="transfer"
                                                >Transfer</SelectItem
                                            >
                                            <SelectItem value="credit"
                                                >Hutang (0)</SelectItem
                                            >
                                        </SelectContent>
                                    </Select>
                                    <div class="relative">
                                        <span
                                            class="absolute left-2.5 top-2.5 text-[10px] text-muted-foreground"
                                            >Rp</span
                                        >
                                        <Input
                                            type="number"
                                            class="h-9 pl-7 text-sm"
                                            bind:value={controller.amountPaid}
                                        />
                                    </div>
                                </div>

                                <!-- Payment Source (Cash/Bank) -->
                                {#if controller.amountPaid > 0}
                                    <div class="pt-2">
                                        <Label
                                            class="text-[10px] text-muted-foreground font-bold mb-1 block"
                                            >SUMBER DANA</Label
                                        >
                                        <Select
                                            type="single"
                                            bind:value={
                                                controller.paymentAccountId
                                            }
                                        >
                                            <SelectTrigger class="h-8 text-xs">
                                                <span>
                                                    {controller.paymentAccounts.find(
                                                        (a) =>
                                                            a.id ===
                                                            controller.paymentAccountId,
                                                    )?.name ||
                                                        "Pilih Akun Kas/Bank"}
                                                </span>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {#each controller.paymentAccounts as acc}
                                                    <SelectItem value={acc.id}
                                                        >{acc.name}</SelectItem
                                                    >
                                                {/each}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                {/if}

                                <!-- Transfer Proof -->
                                {#if controller.paymentMethod === "transfer" && controller.amountPaid > 0}
                                    <div class="pt-2">
                                        <Label
                                            class="text-[10px] text-muted-foreground font-bold mb-1 flex items-center gap-1"
                                        >
                                            <FileUp class="h-3 w-3" /> BUKTI TRANSFER
                                        </Label>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            class="text-xs h-8"
                                            onchange={(e) => {
                                                const file =
                                                    e.currentTarget.files?.[0];
                                                if (file)
                                                    controller.paymentProofImage =
                                                        file;
                                            }}
                                        />
                                    </div>
                                {/if}

                                <!-- Debt Due Date -->
                                {#if controller.amountPaid < controller.grandTotal}
                                    <div class="pt-2 border-t mt-2">
                                        <div
                                            class="flex items-center justify-between mb-1"
                                        >
                                            <Label
                                                class="text-[10px] text-muted-foreground font-bold flex items-center gap-1"
                                            >
                                                <Calendar class="h-3 w-3" /> JATUH
                                                TEMPO HUTANG
                                            </Label>
                                            <span
                                                class="text-[10px] text-red-500 font-medium"
                                            >
                                                Sisa: {controller.formatRp(
                                                    controller.grandTotal -
                                                        controller.amountPaid,
                                                )}
                                            </span>
                                        </div>
                                        <Input
                                            type="date"
                                            class="h-8 text-xs"
                                            bind:value={
                                                controller.paymentDueDate
                                            }
                                        />
                                    </div>
                                {/if}
                            </div>
                        </div>

                        <Button
                            class="w-full bg-green-600 hover:bg-green-700 h-12 text-lg font-bold shadow-lg"
                            disabled={controller.isSubmitting}
                            onclick={() => controller.handleVerify()}
                        >
                            {#if controller.isSubmitting}
                                <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                                Menyimpan...
                            {:else}
                                <PackageCheck class="mr-2 h-5 w-5" />
                                FINAL VERIFY
                                {#if controller.amountPaid >= controller.grandTotal}
                                    & LUNAS{/if}
                            {/if}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    {/if}
</div>
