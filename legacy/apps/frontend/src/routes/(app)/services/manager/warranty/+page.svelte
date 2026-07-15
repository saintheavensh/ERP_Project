<script lang="ts">
    import { onMount } from "svelte";
    import { api } from "$lib/shared/lib/api-client";
    import type { ApiResponse } from "@repo/shared";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/shared/components/ui/table";
    import { Badge } from "$lib/shared/components/ui/badge";
    import { Button } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import {
        Search,
        RotateCcw,
        ShieldCheck,
        AlertCircle,
        ShieldAlert,
        Smartphone,
        User,
        Calendar,
        History,
    } from "lucide-svelte";
    import { goto } from "$app/navigation";
    import { cn } from "$lib/shared/lib/utils";

    let services = $state<any[]>([]);
    let loading = $state(true);
    let searchQuery = $state("");

    async function loadData() {
        loading = true;
        try {
            const res = await api.get<ApiResponse<any[]>>("/service");
            // Filter services that have warranty field set and not "Tanpa Garansi"
            services = (res.data.data || []).filter(
                (s: any) =>
                    s.warranty &&
                    s.warranty !== "none" &&
                    s.warranty !== "Tanpa Garansi",
            );
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        loadData();
    });

    function isExpired(dateStr: string) {
        if (!dateStr) return false;
        // Compare dates without time to avoid issues with same-day expiration logic if needed
        // but typically expiration is end of day. simple check:
        return new Date(dateStr) < new Date();
    }

    function formatDate(dateStr: string) {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    }

    let filteredServices = $derived(
        services.filter((s) => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return (
                s.no.toLowerCase().includes(q) ||
                s.customer?.name?.toLowerCase().includes(q) ||
                s.device?.model?.toLowerCase().includes(q)
            );
        }),
    );

    // Statistics
    let stats = $derived.by(() => {
        const total = filteredServices.length;
        const active = filteredServices.filter(
            (s) => s.warrantyExpiryDate && !isExpired(s.warrantyExpiryDate),
        ).length;
        const expired = filteredServices.filter(
            (s) => s.warrantyExpiryDate && isExpired(s.warrantyExpiryDate),
        ).length;
        return { total, active, expired };
    });
</script>

<div class="h-full flex flex-col gap-6 animate-in fade-in duration-500">
    <!-- Header Dashboard -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Title Card -->
        <div
            class="md:col-span-3 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-sm relative overflow-hidden"
        >
            <!-- Background decoration -->
            <div
                class="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"
            ></div>

            <div
                class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4"
            >
                <div class="flex items-center gap-4">
                    <div
                        class="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl text-white shadow-lg shadow-emerald-500/20"
                    >
                        <ShieldCheck class="h-8 w-8" />
                    </div>
                    <div>
                        <h1
                            class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 to-teal-600 dark:from-emerald-400 dark:to-teal-400"
                        >
                            Monitoring Garansi
                        </h1>
                        <p class="text-muted-foreground text-sm font-medium">
                            Lacak status garansi unit service purna jual.
                        </p>
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <div
                        class="flex flex-col items-end px-4 py-2 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-white/20"
                    >
                        <span
                            class="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                            >Total Terdaftar</span
                        >
                        <span class="text-2xl font-black text-foreground"
                            >{stats.total}</span
                        >
                    </div>
                    <div
                        class="flex flex-col items-end px-4 py-2 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100/50"
                    >
                        <span
                            class="text-xs font-bold text-emerald-600 uppercase tracking-wider"
                            >Aktif</span
                        >
                        <span class="text-2xl font-black text-emerald-700"
                            >{stats.active}</span
                        >
                    </div>
                    <div
                        class="flex flex-col items-end px-4 py-2 bg-red-50/50 dark:bg-red-900/20 rounded-2xl border border-red-100/50"
                    >
                        <span
                            class="text-xs font-bold text-red-600 uppercase tracking-wider"
                            >Expired</span
                        >
                        <span class="text-2xl font-black text-red-700"
                            >{stats.expired}</span
                        >
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Toolbar -->
    <div
        class="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-2 pl-4 rounded-2xl border border-white/20 shadow-sm"
    >
        <div class="relative w-full sm:max-w-md group">
            <Search
                class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-emerald-500 transition-colors"
            />
            <Input
                placeholder="Cari No Service, Customer, atau Device..."
                bind:value={searchQuery}
                class="pl-9 bg-white/50 border-white/20 focus:bg-white rounded-xl transition-all"
            />
        </div>
        <Button
            variant="ghost"
            size="sm"
            onclick={loadData}
            class="hover:bg-white/50 rounded-xl"
        >
            <RotateCcw class={cn("mr-2 h-4 w-4", loading && "animate-spin")} /> Refresh
            Data
        </Button>
    </div>

    <!-- Table Card -->
    <div
        class="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/20 shadow-sm overflow-hidden flex-1"
    >
        <div class="overflow-x-auto">
            {#if loading}
                <div
                    class="flex flex-col items-center justify-center py-20 space-y-4"
                >
                    <div
                        class="animate-spin h-10 w-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full"
                    ></div>
                    <p class="text-muted-foreground animate-pulse">
                        Memuat data garansi...
                    </p>
                </div>
            {:else if filteredServices.length === 0}
                <div
                    class="flex flex-col items-center justify-center py-20 text-center opacity-70"
                >
                    <div class="p-4 bg-slate-100 rounded-full mb-4">
                        <ShieldAlert class="h-10 w-10 text-slate-400" />
                    </div>
                    <h3 class="text-lg font-bold text-foreground">
                        Tidak ada data
                    </h3>
                    <p class="text-sm text-muted-foreground">
                        Belum ada unit service dengan garansi aktif/expired di
                        database.
                    </p>
                </div>
            {:else}
                <Table>
                    <TableHeader class="bg-white/50 dark:bg-slate-900/50">
                        <TableRow class="hover:bg-transparent border-white/10">
                            <TableHead
                                class="font-bold uppercase text-xs tracking-wider text-muted-foreground"
                                >Service No</TableHead
                            >
                            <TableHead
                                class="font-bold uppercase text-xs tracking-wider text-muted-foreground"
                                >Customer</TableHead
                            >
                            <TableHead
                                class="font-bold uppercase text-xs tracking-wider text-muted-foreground"
                                >Device</TableHead
                            >
                            <TableHead
                                class="font-bold uppercase text-xs tracking-wider text-muted-foreground"
                                >Durasi</TableHead
                            >
                            <TableHead
                                class="font-bold uppercase text-xs tracking-wider text-muted-foreground"
                                >Status Expiry</TableHead
                            >
                            <TableHead
                                class="text-right font-bold uppercase text-xs tracking-wider text-muted-foreground"
                                >Action</TableHead
                            >
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {#each filteredServices as s}
                            <TableRow
                                class="hover:bg-white/40 dark:hover:bg-slate-800/40 border-white/10 transition-colors group"
                            >
                                <TableCell
                                    class="font-bold text-foreground relative"
                                >
                                    <div
                                        class="absolute left-0 top-3 bottom-3 w-1 bg-emerald-500 rounded-r opacity-0 group-hover:opacity-100 transition-opacity"
                                    ></div>
                                    <span
                                        class="ml-2 font-mono text-xs bg-slate-100 px-2 py-1 rounded-md"
                                        >{s.no}</span
                                    >
                                </TableCell>
                                <TableCell>
                                    <div class="flex items-center gap-2">
                                        <div
                                            class="p-1.5 bg-blue-50 text-blue-600 rounded-lg"
                                        >
                                            <User class="h-3.5 w-3.5" />
                                        </div>
                                        <div>
                                            <div class="font-bold text-sm">
                                                {s.customer?.name}
                                            </div>
                                            <div
                                                class="text-[10px] text-muted-foreground"
                                            >
                                                {s.customer?.phone}
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div class="flex items-center gap-2">
                                        <div
                                            class="p-1.5 bg-purple-50 text-purple-600 rounded-lg"
                                        >
                                            <Smartphone class="h-3.5 w-3.5" />
                                        </div>
                                        <div>
                                            <div class="font-medium text-sm">
                                                {s.device?.model}
                                            </div>
                                            <div
                                                class="text-[10px] text-muted-foreground font-mono opacity-80"
                                            >
                                                {s.device?.brand}
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant="outline"
                                        class="bg-white/50 border-emerald-200 text-emerald-700 font-mono"
                                    >
                                        {s.warranty}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div class="flex flex-col gap-1">
                                        {#if !s.warrantyExpiryDate}
                                            <Badge
                                                variant="secondary"
                                                class="w-fit bg-slate-100 text-slate-500"
                                                >No Date</Badge
                                            >
                                        {:else if isExpired(s.warrantyExpiryDate)}
                                            <div
                                                class="flex items-center gap-2"
                                            >
                                                <Badge
                                                    variant="destructive"
                                                    class="gap-1 pl-1 pr-2 shadow-sm shadow-red-500/20"
                                                >
                                                    <div
                                                        class="bg-white/20 p-0.5 rounded-full"
                                                    >
                                                        <AlertCircle
                                                            class="h-3 w-3"
                                                        />
                                                    </div>
                                                    Expired
                                                </Badge>
                                                <span
                                                    class="text-[10px] font-medium text-red-600/70"
                                                    >{formatDate(
                                                        s.warrantyExpiryDate,
                                                    )}</span
                                                >
                                            </div>
                                        {:else}
                                            <div
                                                class="flex items-center gap-2"
                                            >
                                                <Badge
                                                    variant="default"
                                                    class="bg-emerald-500 hover:bg-emerald-600 gap-1 pl-1 pr-2 shadow-sm shadow-emerald-500/20"
                                                >
                                                    <div
                                                        class="bg-white/20 p-0.5 rounded-full"
                                                    >
                                                        <ShieldCheck
                                                            class="h-3 w-3"
                                                        />
                                                    </div>
                                                    Active
                                                </Badge>
                                                <span
                                                    class="text-[10px] font-medium text-emerald-600/70"
                                                    >s/d {formatDate(
                                                        s.warrantyExpiryDate,
                                                    )}</span
                                                >
                                            </div>
                                        {/if}
                                    </div>
                                </TableCell>
                                <TableCell class="text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        class="h-8 w-8 p-0 rounded-full hover:bg-slate-200/50"
                                        onclick={() => goto(`/service/${s.id}`)}
                                        title="Lihat Detail"
                                    >
                                        <History
                                            class="h-4 w-4 text-muted-foreground"
                                        />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        {/each}
                    </TableBody>
                </Table>
            {/if}
        </div>
    </div>
</div>
