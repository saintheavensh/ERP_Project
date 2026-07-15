<script lang="ts">
    import { SalesService } from "$lib/features/sales/components/sales.service";
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
    import { Card, CardContent } from "$lib/shared/components/ui/card";
    import {
        Search,
        Calendar,
        Filter,
        Eye,
        ArrowUpRight,
        History,
        CreditCard,
        User,
        FileText,
        ChevronRight,
    } from "lucide-svelte";
    import { formatCurrency } from "$lib/shared/lib/utils";
    import DateTimePicker from "$lib/shared/components/custom/date-time-picker.svelte";
    import { createQuery } from "@tanstack/svelte-query";
    import { fade, fly } from "svelte/transition";

    // Reactive filter state
    let search = $state("");
    let startDate = $state("");
    let endDate = $state("");

    // Build query params reactively
    let queryParams = $derived(() => {
        const params: Record<string, string> = {};
        if (search) params.search = search;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        return params;
    });

    // TanStack Query with reactive params
    const salesQuery = createQuery(() => ({
        queryKey: ["sales", "history", search, startDate, endDate],
        queryFn: () => SalesService.getAll(queryParams()),
    }));

    // Derived state from query
    let sales = $derived(salesQuery.data || []);
    let loading = $derived(salesQuery.isPending);

    // Derived Stats
    let totalRevenue = $derived(
        sales.reduce((sum: number, s: any) => sum + (s.finalAmount || 0), 0),
    );
    let totalTransactions = $derived(sales.length);

    function handleSearch() {
        salesQuery.refetch();
    }

    function formatDate(dateStr: string | Date | null | undefined) {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function getPaymentStatusColor(status: string) {
        switch (status) {
            case "paid":
                return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
            case "partial":
                return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
            case "unpaid":
                return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
            default:
                return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
        }
    }
</script>

<div class="min-h-screen space-y-8 p-6 pb-20">
    <!-- Header Section -->
    <div
        class="relative bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white overflow-hidden shadow-2xl"
    >
        <div
            class="absolute inset-0 bg-white/10 opacity-20 pattern-dots pointer-events-none"
        ></div>
        <div
            class="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        >
            <div>
                <div class="flex items-center gap-3 mb-2">
                    <div class="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <History class="h-6 w-6 text-white" />
                    </div>
                    <h1 class="text-3xl font-bold tracking-tight text-white">
                        Riwayat Penjualan
                    </h1>
                </div>
                <p class="text-blue-100 max-w-xl text-lg">
                    Pantau kinerja penjualan dan kelola arsip transaksi.
                </p>
            </div>

            <!-- Quick Stats in Header -->
            <div class="flex gap-4">
                <div
                    class="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 min-w-[140px]"
                >
                    <p
                        class="text-xs uppercase tracking-wider text-blue-200 font-semibold mb-1"
                    >
                        Total Transaksi
                    </p>
                    <p class="text-2xl font-bold text-white">
                        {totalTransactions}
                    </p>
                </div>
                <div
                    class="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 min-w-[180px]"
                >
                    <p
                        class="text-xs uppercase tracking-wider text-blue-200 font-semibold mb-1"
                    >
                        Total Pendapatan
                    </p>
                    <p class="text-2xl font-bold text-white">
                        {formatCurrency(totalRevenue)}
                    </p>
                </div>
            </div>
        </div>
    </div>

    <!-- Filters & Content -->
    <div class="grid gap-6">
        <!-- Advanced Filter Bar -->
        <div
            class="bg-card/50 backdrop-blur-sm border rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-end md:items-center justify-between sticky top-4 z-30"
        >
            <div class="flex flex-col md:flex-row gap-4 flex-1 w-full">
                <div class="relative flex-1 min-w-[200px]">
                    <Search
                        class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                    />
                    <Input
                        type="search"
                        placeholder="Cari Invoice, Nama Pelanggan..."
                        class="pl-9 h-10 bg-background/50 border-muted-foreground/20 focus:bg-background transition-all"
                        bind:value={search}
                        onkeydown={(e) => e.key === "Enter" && handleSearch()}
                    />
                </div>

                <div class="flex items-center gap-2">
                    <div class="w-[200px]">
                        <DateTimePicker
                            bind:value={startDate}
                            showTime={false}
                        />
                    </div>
                    <span
                        class="text-muted-foreground text-xs uppercase font-medium"
                        >to</span
                    >
                    <div class="w-[200px]">
                        <DateTimePicker bind:value={endDate} showTime={false} />
                    </div>
                </div>

                <Button
                    onclick={handleSearch}
                    class="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                >
                    <Filter class="h-4 w-4 mr-2" /> Terapkan Filter
                </Button>
            </div>
        </div>

        <!-- Desktop Table View -->
        <div
            class="hidden md:block bg-card rounded-xl border shadow-sm overflow-hidden"
        >
            <Table>
                <TableHeader class="bg-muted/50">
                    <TableRow class="hover:bg-transparent">
                        <TableHead class="w-[180px]">No. Invoice</TableHead>
                        <TableHead>Pelanggan</TableHead>
                        <TableHead>Tanggal Transaksi</TableHead>
                        <TableHead>Metode Bayar</TableHead>
                        <TableHead class="text-right">Total Nominal</TableHead>
                        <TableHead class="text-center">Status</TableHead>
                        <TableHead class="text-right w-[100px]">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {#if loading}
                        {#each Array(5) as _}
                            <TableRow>
                                <TableCell colspan={7} class="h-16">
                                    <div
                                        class="w-full h-4 bg-muted/20 animate-pulse rounded"
                                    ></div>
                                </TableCell>
                            </TableRow>
                        {/each}
                    {:else if sales.length === 0}
                        <TableRow>
                            <TableCell
                                colspan={7}
                                class="text-center h-64 text-muted-foreground"
                            >
                                <div
                                    class="flex flex-col items-center justify-center gap-3 opacity-60"
                                >
                                    <FileText
                                        class="h-12 w-12 text-muted-foreground/50"
                                    />
                                    <p class="text-lg font-medium">
                                        Tidak ada data ditemukan
                                    </p>
                                    <p class="text-sm">
                                        Coba sesuaikan filter pencarian Anda.
                                    </p>
                                </div>
                            </TableCell>
                        </TableRow>
                    {:else}
                        {#each sales as sale}
                            <TableRow
                                class="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer group transition-colors"
                            >
                                <TableCell class="font-mono font-medium">
                                    <div
                                        class="flex items-center gap-2 text-blue-600 group-hover:text-blue-700"
                                    >
                                        <FileText class="h-4 w-4 opacity-50" />
                                        {sale.id}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center"
                                        >
                                            <User class="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div
                                                class="font-medium text-foreground"
                                            >
                                                {sale.customerName || "Guest"}
                                            </div>
                                            {#if sale.member}
                                                <div
                                                    class="text-xs text-muted-foreground"
                                                >
                                                    {sale.member.phone}
                                                </div>
                                            {/if}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div class="text-sm text-muted-foreground">
                                        {formatDate(sale.createdAt)}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div class="flex items-center gap-2">
                                        <CreditCard
                                            class="h-3.5 w-3.5 text-muted-foreground"
                                        />
                                        <span
                                            class="capitalize text-sm font-medium"
                                        >
                                            {sale.paymentMethod === "mixed"
                                                ? "Split Payment"
                                                : sale.paymentMethod}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell class="text-right">
                                    <span
                                        class="font-bold text-foreground text-base"
                                    >
                                        {formatCurrency(sale.finalAmount)}
                                    </span>
                                </TableCell>
                                <TableCell class="text-center">
                                    <Badge
                                        variant="outline"
                                        class="{getPaymentStatusColor(
                                            sale.paymentStatus,
                                        )} px-3 py-1 shadow-sm uppercase text-[10px] tracking-wider"
                                    >
                                        {sale.paymentStatus === "paid"
                                            ? "Lunas"
                                            : sale.paymentStatus}
                                    </Badge>
                                </TableCell>
                                <TableCell class="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        class="h-8 w-8 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                                        href="/sales/history/{sale.id}"
                                    >
                                        <ArrowUpRight class="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        {/each}
                    {/if}
                </TableBody>
            </Table>
        </div>

        <!-- Mobile Data View -->
        <div class="md:hidden space-y-4">
            {#if loading}
                {#each Array(3) as _}
                    <div class="h-32 bg-card animate-pulse rounded-xl"></div>
                {/each}
            {:else if sales.length === 0}
                <div
                    class="text-center p-12 bg-muted/20 rounded-xl border border-dashed"
                >
                    <p class="text-muted-foreground">
                        Tidak ada riwayat penjualan.
                    </p>
                </div>
            {:else}
                {#each sales as sale}
                    <div
                        class="bg-card rounded-xl border shadow-sm p-4 active:scale-[0.99] transition-transform relative overflow-hidden"
                    >
                        <div class="flex justify-between items-start mb-4">
                            <div class="flex items-center gap-3">
                                <div
                                    class="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center"
                                >
                                    <FileText class="h-5 w-5" />
                                </div>
                                <div>
                                    <div
                                        class="font-bold text-foreground text-sm"
                                    >
                                        {sale.id}
                                    </div>
                                    <div
                                        class="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"
                                    >
                                        <Calendar class="h-3 w-3" />
                                        {formatDate(sale.createdAt)}
                                    </div>
                                </div>
                            </div>
                            <Badge
                                variant="outline"
                                class="{getPaymentStatusColor(
                                    sale.paymentStatus,
                                )} text-[10px] uppercase font-bold"
                            >
                                {sale.paymentStatus}
                            </Badge>
                        </div>

                        <div
                            class="flex justify-between items-end border-t pt-3 mt-2"
                        >
                            <div>
                                <p class="text-xs text-muted-foreground mb-1">
                                    Total Transaksi
                                </p>
                                <p class="text-lg font-bold text-foreground">
                                    {formatCurrency(sale.finalAmount)}
                                </p>
                            </div>
                            <div class="flex flex-col items-end gap-1">
                                <span
                                    class="text-xs font-medium text-muted-foreground capitalize flex items-center gap-1"
                                >
                                    <CreditCard class="h-3 w-3" />
                                    {sale.paymentMethod === "mixed"
                                        ? "Split"
                                        : sale.paymentMethod}
                                </span>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    class="h-7 text-xs gap-1 hover:text-blue-600 pr-0"
                                    href="/sales/history/{sale.id}"
                                >
                                    Detail <ChevronRight class="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    </div>
                {/each}
            {/if}
        </div>
    </div>
</div>
