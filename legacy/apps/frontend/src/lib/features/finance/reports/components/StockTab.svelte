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
    import type { StockValueReport } from "$lib/features/finance/reports/reports.service";
    import { formatCurrency } from "$lib/shared/lib/utils";

    interface Props {
        stockValue: StockValueReport | null;
    }

    let { stockValue }: Props = $props();
</script>

{#if stockValue}
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card
            class="bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30"
        >
            <CardHeader class="pb-2">
                <CardTitle
                    class="text-xs uppercase text-blue-600 font-bold tracking-wider"
                    >Nilai Aset (HPP)</CardTitle
                >
            </CardHeader>
            <CardContent>
                <div
                    class="text-2xl font-bold text-blue-700 dark:text-blue-400"
                >
                    {formatCurrency(stockValue.totalValueHPP)}
                </div>
            </CardContent>
        </Card>
        <Card
            class="bg-green-50/50 border-green-100 dark:bg-green-900/10 dark:border-green-900/30"
        >
            <CardHeader class="pb-2">
                <CardTitle
                    class="text-xs uppercase text-green-600 font-bold tracking-wider"
                    >Potensi Omzet</CardTitle
                >
            </CardHeader>
            <CardContent>
                <div
                    class="text-2xl font-bold text-green-700 dark:text-green-400"
                >
                    {formatCurrency(stockValue.totalValueSell)}
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader class="pb-2">
                <CardTitle
                    class="text-xs uppercase text-muted-foreground font-bold tracking-wider"
                    >Total Item</CardTitle
                >
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">
                    {stockValue.totalItems}
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader class="pb-2">
                <CardTitle
                    class="text-xs uppercase text-muted-foreground font-bold tracking-wider"
                    >Total Stok Qty</CardTitle
                >
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">
                    {stockValue.totalStock}
                </div>
            </CardContent>
        </Card>
    </div>

    <Card class="border-0 shadow-lg mt-6">
        <CardHeader>
            <CardTitle>Stok per Kategori</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Kategori</TableHead>
                        <TableHead class="text-center">Jml Stok</TableHead>
                        <TableHead class="text-right">Nilai Aset</TableHead>
                        <TableHead class="text-right">%</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {#each stockValue.categories as c}
                        <TableRow>
                            <TableCell class="font-medium">{c.name}</TableCell>
                            <TableCell class="text-center">{c.stock}</TableCell>
                            <TableCell class="text-right font-medium"
                                >{formatCurrency(c.value)}</TableCell
                            >
                            <TableCell class="text-right text-muted-foreground">
                                {Math.round(
                                    (c.value / stockValue.totalValueHPP) * 100,
                                )}%
                            </TableCell>
                        </TableRow>
                    {/each}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
{/if}

