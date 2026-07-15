<script lang="ts">
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
        CardDescription,
    } from "$lib/shared/components/ui/card";
    import { Badge } from "$lib/shared/components/ui/badge";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/shared/components/ui/table";
    import {
        DollarSign,
        Wrench,
        Package,
        ClipboardCheck,
        ArrowUpRight,
        ArrowDownRight,
        Users,
        Copy,
    } from "lucide-svelte";
    import { toast } from "svelte-sonner";
    import { onMount } from "svelte";
    import { Button } from "$lib/shared/components/ui/button";
    import { api } from "$lib/shared/lib/api-client";
    import { authStore } from "$lib/shared/lib/auth-store.svelte";

    interface Props {
        salesSummary: any;
        servicesStats: any;
        technicians: any[];
    }

    let { salesSummary, servicesStats, technicians }: Props = $props();

    let pendingToolRequests = $state<any[]>([]);
    let loadingRequests = $state(true);

    async function loadToolRequests() {
        try {
            const res = await api.get("/service-tools/requests");
            pendingToolRequests = (res.data.data || []).filter(
                (r: any) => r.status === "pending",
            );
        } catch (e) {
            console.error("Failed to load tool requests", e);
        } finally {
            loadingRequests = false;
        }
    }

    async function updateRequestStatus(
        id: string,
        status: "approved" | "rejected",
    ) {
        try {
            await api.patch(`/service-tools/requests/${id}/status`, { status });
            toast.success(`Request ${status} successfully`);
            loadToolRequests();
        } catch (e) {
            toast.error(`Failed to ${status} request`);
        }
    }

    onMount(() => {
        loadToolRequests();
    });

    import { formatCurrency } from "$lib/shared/lib/utils";

    function copySummary() {
        const summary = `
LAPORAN SINGKAT STORE (Liaison Digest)
----------------------------------
Total Omzet: ${formatCurrency(salesSummary.totalRevenue)}
Cetak Profit: ${formatCurrency(salesSummary.totalProfit)}
Margin: ${salesSummary.profitMargin.toFixed(1)}%

OPERASIONAL:
Total Service: ${servicesStats.total}
Selesai: ${servicesStats.completed}
Permintaan Alat Pending: ${pendingToolRequests.length}

PERFORMA TIM:
${technicians.map((t: any) => `- ${t.name}: ${t.totalServices} Service (${formatCurrency(t.revenue)})`).join("\n")}
----------------------------------
Generated at: ${new Date().toLocaleString("id-ID")}
        `.trim();

        navigator.clipboard.writeText(summary);
        toast.success("Ringkasan berhasil disalin ke clipboard!");
    }
</script>

<div class="space-y-6 animate-in fade-in duration-500">
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle
                    class="text-sm font-medium text-muted-foreground uppercase"
                    >Revenue Today</CardTitle
                >
                <DollarSign class="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">
                    {formatCurrency(salesSummary.totalRevenue)}
                </div>
                <p
                    class="text-[10px] text-muted-foreground mt-1 flex items-center gap-1"
                >
                    <ArrowUpRight class="h-3 w-3 text-green-500" />
                    Berdasarkan periode filter
                </p>
            </CardContent>
        </Card>

        <Card>
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle
                    class="text-sm font-medium text-muted-foreground uppercase"
                    >Open Services</CardTitle
                >
                <Wrench class="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">
                    {servicesStats.total - servicesStats.completed}
                </div>
                <p class="text-[10px] text-muted-foreground mt-1">
                    Dari total {servicesStats.total} unit
                </p>
            </CardContent>
        </Card>

        <Card>
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle
                    class="text-sm font-medium text-muted-foreground uppercase"
                    >Tool Requests</CardTitle
                >
                <ClipboardCheck class="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">
                    {pendingToolRequests.length}
                </div>
                <p class="text-[10px] text-muted-foreground mt-1">
                    Menunggu persetujuan Management
                </p>
            </CardContent>
        </Card>

        <Card>
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle
                    class="text-sm font-medium text-muted-foreground uppercase"
                    >Store Margin</CardTitle
                >
                <Package class="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">
                    {salesSummary.profitMargin.toFixed(1)}%
                </div>
                <p class="text-[10px] text-muted-foreground mt-1">
                    Efisiensi operasional
                </p>
            </CardContent>
        </Card>
    </div>

    <div class="grid gap-6 md:grid-cols-7">
        <Card class="md:col-span-4">
            <CardHeader>
                <div class="flex items-center justify-between">
                    <div>
                        <CardTitle>Ringkasan Kinerja Tim</CardTitle>
                        <CardDescription
                            >Produktivitas teknisi dalam periode ini</CardDescription
                        >
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Teknisi</TableHead>
                            <TableHead class="text-center"
                                >Total Service</TableHead
                            >
                            <TableHead class="text-right">Omzet</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {#each technicians as tech}
                            <TableRow>
                                <TableCell class="font-medium"
                                    >{tech.name}</TableCell
                                >
                                <TableCell class="text-center"
                                    >{tech.totalServices}</TableCell
                                >
                                <TableCell class="text-right font-semibold"
                                    >{formatCurrency(tech.revenue)}</TableCell
                                >
                            </TableRow>
                        {/each}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        <Card class="md:col-span-3 bg-primary/5 border-primary/20">
            <CardHeader>
                <CardTitle class="flex items-center gap-2">
                    <Copy class="h-4 w-4" />
                    Liaison Report Builder
                </CardTitle>
                <CardDescription
                    >Format teks untuk dilaporkan ke Owner</CardDescription
                >
            </CardHeader>
            <CardContent class="space-y-4">
                <div
                    class="p-4 rounded-md bg-white dark:bg-zinc-950 border text-[12px] font-mono whitespace-pre text-muted-foreground overflow-x-auto"
                >
                    LAPORAN SINGKAT STORE (Liaison Digest)
                    ---------------------------------- Total Omzet: {formatCurrency(
                        salesSummary.totalRevenue,
                    )}
                    Cetak Profit: {formatCurrency(salesSummary.totalProfit)}
                    Margin: {salesSummary.profitMargin.toFixed(1)}% OPERASIONAL:
                    Total Service: {servicesStats.total}
                    Selesai: {servicesStats.completed}
                    Permintaan Alat: {pendingToolRequests.length}
                </div>
                <Button class="w-full" variant="outline" onclick={copySummary}>
                    <Copy class="h-4 w-4 mr-2" /> Salin Laporan Lengkap
                </Button>
            </CardContent>
        </Card>
    </div>

    {#if pendingToolRequests.length > 0}
        <Card>
            <CardHeader>
                <CardTitle>Permintaan Alat Pending</CardTitle>
                <CardDescription
                    >Menunggu persetujuan Owner untuk pengadaan atau penggunaan
                    alat</CardDescription
                >
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Alat</TableHead>
                            <TableHead>Alasan / Kebutuhan</TableHead>
                            <TableHead>Technician</TableHead>
                            <TableHead>Tanggal</TableHead>
                            {#if authStore.hasRole(["super_admin", "owner"])}
                                <TableHead class="text-right">Aksi</TableHead>
                            {/if}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {#each pendingToolRequests as req}
                            <TableRow>
                                <TableCell class="font-medium"
                                    >{req.toolName || req.name}</TableCell
                                >
                                <TableCell
                                    >{req.notes ||
                                        "Tidak ada catatan"}</TableCell
                                >
                                <TableCell
                                    >{req.userName || "Unknown"}</TableCell
                                >
                                <TableCell
                                    >{new Date(
                                        req.createdAt,
                                    ).toLocaleDateString()}</TableCell
                                >
                                {#if authStore.hasRole( ["super_admin", "owner"], )}
                                    <TableCell class="text-right">
                                        <div class="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                class="h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                onclick={() =>
                                                    updateRequestStatus(
                                                        req.id,
                                                        "approved",
                                                    )}
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                class="h-8 text-destructive hover:bg-destructive/10"
                                                onclick={() =>
                                                    updateRequestStatus(
                                                        req.id,
                                                        "rejected",
                                                    )}
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                    </TableCell>
                                {/if}
                            </TableRow>
                        {/each}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    {/if}
</div>

