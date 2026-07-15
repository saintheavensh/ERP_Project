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
    import { PieChart } from "lucide-svelte";
    import ServiceStatusChart from "./ServiceStatusChart.svelte";
    import type {
        ServiceStats,
        ServiceReport,
    } from "$lib/features/finance/reports/reports.service";
    import { formatCurrency, formatDate } from "$lib/shared/lib/utils";

    interface Props {
        servicesStats: ServiceStats;
        servicesTransactions: ServiceReport[];
        serviceStatusData: { status: string; count: number }[];
    }

    let { servicesStats, servicesTransactions, serviceStatusData }: Props =
        $props();

    function getStatusBadgeVariant(
        status: string,
    ): "default" | "secondary" | "outline" | "destructive" {
        switch (status) {
            case "selesai":
            case "diambil":
                return "default";
            case "dikerjakan":
                return "secondary";
            case "batal":
                return "destructive";
            default:
                return "outline";
        }
    }

    function getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            antrian: "Antrian",
            dicek: "Dicek",
            konfirmasi: "Konfirmasi",
            dikerjakan: "Dikerjakan",
            selesai: "Selesai",
            diambil: "Diambil",
            batal: "Batal",
        };
        return labels[status] || status;
    }

    function calculateStatusPercentage(count: number, total: number): number {
        if (total === 0) return 0;
        return Math.round((count / total) * 100);
    }
</script>

<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    <Card class="lg:col-span-1 border-0 shadow-lg">
        <CardHeader>
            <CardTitle class="flex items-center gap-2">
                <PieChart class="h-5 w-5 text-blue-600" />
                Status Service
            </CardTitle>
            <CardDescription>Distribusi status pengerjaan</CardDescription>
        </CardHeader>
        <CardContent>
            <ServiceStatusChart data={serviceStatusData} />
        </CardContent>
    </Card>

    <div class="lg:col-span-2 grid gap-6 md:grid-cols-2">
        <Card class="border-l-4 border-l-purple-500 shadow-md">
            <CardHeader>
                <CardTitle
                    class="text-sm font-medium uppercase tracking-wider text-muted-foreground"
                    >Total Service Masuk</CardTitle
                >
            </CardHeader>
            <CardContent>
                <div class="text-4xl font-bold">
                    {servicesStats.total}
                </div>
                <p class="text-sm text-muted-foreground mt-2">
                    Unit device diterima
                </p>
            </CardContent>
        </Card>
        <Card class="border-l-4 border-l-green-500 shadow-md bg-green-50/20">
            <CardHeader>
                <CardTitle
                    class="text-sm font-medium uppercase tracking-wider text-green-700"
                    >Pendapatan Service</CardTitle
                >
            </CardHeader>
            <CardContent>
                <div class="text-4xl font-bold text-green-700">
                    {formatCurrency(servicesStats.revenue)}
                </div>
                <p class="text-sm text-green-600/80 mt-2">
                    Dari service selesai
                </p>
            </CardContent>
        </Card>
        <Card class="col-span-2 border-0 shadow-lg">
            <CardHeader>
                <CardTitle>Statistik Pengerjaan</CardTitle>
            </CardHeader>
            <CardContent class="grid grid-cols-2 gap-4">
                <div class="p-4 rounded-xl bg-muted/50">
                    <span class="text-sm text-muted-foreground"
                        >Selesai / Diambil</span
                    >
                    <div class="text-2xl font-bold mt-1">
                        {servicesStats.completed}
                    </div>
                </div>
                <div class="p-4 rounded-xl bg-muted/50">
                    <span class="text-sm text-muted-foreground"
                        >Completion Rate</span
                    >
                    <div class="text-2xl font-bold mt-1">
                        {servicesStats.total > 0
                            ? calculateStatusPercentage(
                                  servicesStats.completed,
                                  servicesStats.total,
                              )
                            : 0}%
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
</div>

<Card class="border-0 shadow-lg overflow-hidden">
    <CardHeader class="bg-muted/30">
        <CardTitle>Riwayat Service</CardTitle>
        <CardDescription>Daftar transaksi service terbaru</CardDescription>
    </CardHeader>
    <CardContent class="p-0">
        <Table>
            <TableHeader>
                <TableRow class="hover:bg-transparent">
                    <TableHead class="pl-6">Tanggal</TableHead>
                    <TableHead>No. Service</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead class="text-center">Status</TableHead>
                    <TableHead class="text-right pr-6">Biaya</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {#each servicesTransactions as s}
                    <TableRow class="hover:bg-muted/50">
                        <TableCell class="pl-6 text-muted-foreground"
                            >{formatDate(s.date)}</TableCell
                        >
                        <TableCell class="font-medium text-primary"
                            >{s.no}</TableCell
                        >
                        <TableCell>{s.customerName}</TableCell>
                        <TableCell class="text-muted-foreground"
                            >{s.deviceInfo || "-"}</TableCell
                        >
                        <TableCell class="text-center">
                            <Badge
                                variant={getStatusBadgeVariant(s.status)}
                                class="shadow-sm"
                            >
                                {getStatusLabel(s.status)}
                            </Badge>
                        </TableCell>
                        <TableCell class="text-right pr-6 font-medium">
                            {s.actualCost > 0
                                ? formatCurrency(s.actualCost)
                                : "-"}
                        </TableCell>
                    </TableRow>
                {/each}
                {#if servicesTransactions.length === 0}
                    <TableRow>
                        <TableCell
                            colspan={6}
                            class="text-center py-12 text-muted-foreground"
                            >Tidak ada service dalam periode ini</TableCell
                        >
                    </TableRow>
                {/if}
            </TableBody>
        </Table>
    </CardContent>
</Card>

