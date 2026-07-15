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
    import { Badge } from "$lib/shared/components/ui/badge";
    import type { PartsUsageReport } from "$lib/features/finance/reports/reports.service";
    import { formatCurrency, formatDate } from "$lib/shared/lib/utils";

    interface Props {
        partsUsage: PartsUsageReport[];
    }

    let { partsUsage }: Props = $props();
</script>

<Card class="border-0 shadow-lg">
    <CardHeader>
        <CardTitle>Penggunaan Sparepart</CardTitle>
    </CardHeader>
    <CardContent>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Sparepart</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead class="text-right">Qty</TableHead>
                    <TableHead class="text-right">Subtotal</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {#each partsUsage as p}
                    <TableRow>
                        <TableCell>{formatDate(p.date)}</TableCell>
                        <TableCell>
                            <div class="flex flex-col">
                                <span class="font-medium">{p.partName}</span>
                                <span class="text-xs text-muted-foreground"
                                    >{p.variant || "-"}</span
                                >
                            </div>
                        </TableCell>
                        <TableCell
                            ><Badge variant="outline">{p.source}</Badge
                            ></TableCell
                        >
                        <TableCell class="text-right">{p.qty}</TableCell>
                        <TableCell class="text-right font-medium"
                            >{formatCurrency(p.subtotal)}</TableCell
                        >
                    </TableRow>
                {/each}
            </TableBody>
        </Table>
    </CardContent>
</Card>

