<script lang="ts">
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
    import type {
        PurchasesSummary,
        PurchaseReport,
    } from "$lib/features/finance/reports/reports.service";
    import { formatCurrency, formatDate } from "$lib/shared/lib/utils";

    interface Props {
        purchasesSummary: PurchasesSummary;
        purchasesTransactions: PurchaseReport[];
    }

    let { purchasesSummary, purchasesTransactions }: Props = $props();
</script>

<div class="grid gap-6 md:grid-cols-3">
    <Card class="shadow-md">
        <CardHeader class="pb-2">
            <CardTitle class="text-sm uppercase text-muted-foreground"
                >Total Pembelian</CardTitle
            >
        </CardHeader>
        <CardContent>
            <div class="text-2xl font-bold">
                {formatCurrency(purchasesSummary.totalAmount)}
            </div>
        </CardContent>
    </Card>
    <Card class="shadow-md">
        <CardHeader class="pb-2">
            <CardTitle class="text-sm uppercase text-muted-foreground"
                >Transaksi</CardTitle
            >
        </CardHeader>
        <CardContent>
            <div class="text-2xl font-bold">
                {purchasesSummary.totalTransactions}
            </div>
        </CardContent>
    </Card>
    <Card class="shadow-md">
        <CardHeader class="pb-2">
            <CardTitle class="text-sm uppercase text-muted-foreground"
                >Item Masuk</CardTitle
            >
        </CardHeader>
        <CardContent>
            <div class="text-2xl font-bold">
                {purchasesSummary.totalItems}
            </div>
        </CardContent>
    </Card>
</div>
<Card class="border-0 shadow-lg mt-6">
    <CardHeader>
        <CardTitle>Riwayat Pembelian</CardTitle>
    </CardHeader>
    <CardContent>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead class="text-center">Items</TableHead>
                    <TableHead class="text-right">Total</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {#each purchasesTransactions as p}
                    <TableRow>
                        <TableCell>{formatDate(p.date)}</TableCell>
                        <TableCell>{p.supplierName || "-"}</TableCell>
                        <TableCell class="text-center">{p.items}</TableCell>
                        <TableCell class="text-right font-medium"
                            >{formatCurrency(p.totalAmount)}</TableCell
                        >
                    </TableRow>
                {/each}
            </TableBody>
        </Table>
    </CardContent>
</Card>

