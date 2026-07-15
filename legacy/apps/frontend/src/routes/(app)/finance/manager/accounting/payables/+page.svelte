<script lang="ts">
    import { onMount } from "svelte";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { Button } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogTrigger,
        DialogFooter,
    } from "$lib/shared/components/ui/dialog";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/shared/components/ui/table";
    import {
        Search,
        Filter,
        Download,
        Plus,
        MoreHorizontal,
        ArrowUpDown,
        HelpCircle,
        Loader2,
        ArrowRight,
        CreditCard,
        Receipt,
        ChevronRight,
    } from "lucide-svelte";
    import { Badge } from "$lib/shared/components/ui/badge";
    import { PayablesController } from "$lib/features/finance/accounting/payables/payables.controller.svelte";

    const controller = new PayablesController();

    onMount(() => {
        controller.init();
    });

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(val);

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
</script>

<div class="space-y-6 animate-in fade-in duration-500 pb-10">
    <!-- Header -->
    <div
        class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
    >
        <div>
            <div class="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <a href="/accounting" class="hover:text-blue-600">Akuntansi</a>
                <ChevronRight class="h-4 w-4" />
                <span class="text-slate-900 font-medium">Hutang Supplier</span>
            </div>
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
                Accounts Payable
            </h1>
        </div>
    </div>

    <!-- Summary Cards -->
    {#if controller.summary}
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card
                class="border-0 shadow-md rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white"
            >
                <CardContent class="p-6">
                    <p class="text-sm text-red-100">Total Hutang</p>
                    <p class="text-3xl font-bold">
                        {formatCurrency(controller.summary.totalOutstanding)}
                    </p>
                </CardContent>
            </Card>
            <Card class="border-0 shadow-md rounded-xl">
                <CardContent class="p-6">
                    <p class="text-sm text-slate-500">Jumlah Faktur</p>
                    <p class="text-2xl font-bold">
                        {controller.summary.purchaseCount}
                    </p>
                </CardContent>
            </Card>
            <Card class="border-0 shadow-md rounded-xl">
                <CardContent class="p-6">
                    <p class="text-sm text-slate-500">Jumlah Supplier</p>
                    <p class="text-2xl font-bold">
                        {controller.summary.bySupplier?.length || 0}
                    </p>
                </CardContent>
            </Card>
        </div>
    {/if}

    <!-- Payables List -->
    {#if controller.loading}
        <div class="flex items-center justify-center py-20">
            <Loader2 class="h-8 w-8 animate-spin text-blue-600" />
        </div>
    {:else}
        <Card class="border-0 shadow-lg rounded-2xl overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow class="bg-slate-50">
                        <TableHead class="w-28">No. PO</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead class="w-28">Tanggal</TableHead>
                        <TableHead class="text-right">Total</TableHead>
                        <TableHead class="text-right">Terbayar</TableHead>
                        <TableHead class="text-right">Sisa</TableHead>
                        <TableHead class="w-24">Status</TableHead>
                        <TableHead class="w-24"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {#each controller.payables as item}
                        <TableRow class="hover:bg-slate-50">
                            <TableCell class="font-mono text-sm"
                                >{item.id}</TableCell
                            >
                            <TableCell class="font-medium"
                                >{item.supplierName}</TableCell
                            >
                            <TableCell class="text-sm"
                                >{formatDate(item.date)}</TableCell
                            >
                            <TableCell class="text-right font-mono">
                                {formatCurrency(item.totalAmount)}
                            </TableCell>
                            <TableCell
                                class="text-right font-mono text-green-600"
                            >
                                {formatCurrency(item.totalPaid)}
                            </TableCell>
                            <TableCell
                                class="text-right font-mono text-red-600 font-bold"
                            >
                                {formatCurrency(item.outstanding)}
                            </TableCell>
                            <TableCell>
                                <span
                                    class="text-xs px-2 py-1 rounded-full {item.paymentStatus ===
                                    'partial'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-red-100 text-red-700'}"
                                >
                                    {item.paymentStatus === "partial"
                                        ? "Sebagian"
                                        : "Belum Bayar"}
                                </span>
                            </TableCell>
                            <TableCell>
                                <Button
                                    size="sm"
                                    onclick={() =>
                                        controller.openPayDialog(item)}
                                >
                                    Bayar
                                </Button>
                            </TableCell>
                        </TableRow>
                    {:else}
                        <TableRow>
                            <TableCell
                                colspan={8}
                                class="text-center py-10 text-slate-500"
                            >
                                Tidak ada hutang
                            </TableCell>
                        </TableRow>
                    {/each}
                </TableBody>
            </Table>
        </Card>
    {/if}
</div>

<!-- Payment Dialog -->
<Dialog bind:open={controller.showPayDialog}>
    <DialogContent class="max-w-md">
        <DialogHeader>
            <DialogTitle>Pembayaran ke Supplier</DialogTitle>
        </DialogHeader>
        {#if controller.selectedPayable}
            <form
                onsubmit={(e) => {
                    e.preventDefault();
                    controller.submitPayment();
                }}
                class="space-y-4"
            >
                <div class="p-4 bg-slate-50 rounded-lg">
                    <div class="flex justify-between text-sm">
                        <span class="text-slate-500">No. PO</span>
                        <span class="font-mono"
                            >{controller.selectedPayable.id}</span
                        >
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-slate-500">Supplier</span>
                        <span class="font-medium"
                            >{controller.selectedPayable.supplierName}</span
                        >
                    </div>
                    <div
                        class="flex justify-between text-sm mt-2 pt-2 border-t"
                    >
                        <span class="text-slate-500">Sisa Hutang</span>
                        <span class="font-bold text-red-600"
                            >{formatCurrency(
                                controller.selectedPayable.outstanding,
                            )}</span
                        >
                    </div>
                </div>

                <div class="space-y-2">
                    <Label>Jumlah Bayar</Label>
                    <Input
                        type="number"
                        bind:value={controller.payAmount}
                        min="1"
                        max={controller.selectedPayable.outstanding}
                    />
                </div>

                <div class="space-y-2">
                    <Label>Metode Pembayaran</Label>
                    <select
                        bind:value={controller.payMethod}
                        class="w-full px-3 py-2 border rounded-md"
                    >
                        <option value="cash">Tunai</option>
                        <option value="transfer">Transfer Bank</option>
                    </select>
                </div>

                <div class="space-y-2">
                    <Label>Referensi (opsional)</Label>
                    <Input
                        bind:value={controller.payReference}
                        placeholder="No. Bukti Transfer"
                    />
                </div>

                <div class="flex justify-end gap-3 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onclick={() => (controller.showPayDialog = false)}
                    >
                        Batal
                    </Button>
                    <Button
                        type="submit"
                        disabled={controller.processingPayment ||
                            controller.payAmount <= 0}
                    >
                        {#if controller.processingPayment}
                            <Loader2 class="h-4 w-4 animate-spin mr-2" />
                        {/if}
                        Bayar {formatCurrency(controller.payAmount)}
                    </Button>
                </div>
            </form>
        {/if}
    </DialogContent>
</Dialog>
