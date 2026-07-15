<script lang="ts">
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
        CardDescription,
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
    import type { TechnicianReport } from "$lib/features/finance/reports/reports.service";
    import { formatCurrency } from "$lib/shared/lib/utils";

    interface Props {
        technicians: TechnicianReport[];
    }

    let { technicians }: Props = $props();
</script>

<Card class="border-0 shadow-lg">
    <CardHeader>
        <CardTitle>Kinerja Teknisi</CardTitle>
        <CardDescription>Performansi dan kontribusi revenue</CardDescription>
    </CardHeader>
    <CardContent>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Teknisi</TableHead>
                    <TableHead class="text-center">Total Service</TableHead>
                    <TableHead class="text-center">Selesai</TableHead>
                    <TableHead class="text-center">Rate</TableHead>
                    <TableHead class="text-right">Pendapatan</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {#each technicians as t}
                    <TableRow>
                        <TableCell>
                            <div class="flex items-center gap-3">
                                <div
                                    class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold"
                                >
                                    {t.name.charAt(0).toUpperCase()}
                                </div>
                                <span class="font-medium">{t.name}</span>
                            </div>
                        </TableCell>
                        <TableCell class="text-center"
                            ><Badge variant="outline">{t.totalServices}</Badge
                            ></TableCell
                        >
                        <TableCell class="text-center text-green-600 font-bold"
                            >{t.completed}</TableCell
                        >
                        <TableCell class="text-center">
                            <div class="flex items-center gap-2 justify-center">
                                <div
                                    class="w-16 bg-muted rounded-full h-1.5 overflow-hidden"
                                >
                                    <div
                                        class="h-full bg-green-500"
                                        style="width: {t.completionRate}%"
                                    ></div>
                                </div>
                                <span class="text-xs">{t.completionRate}%</span>
                            </div>
                        </TableCell>
                        <TableCell class="text-right font-medium text-green-600"
                            >{formatCurrency(t.revenue)}</TableCell
                        >
                    </TableRow>
                {/each}
            </TableBody>
        </Table>
    </CardContent>
</Card>

