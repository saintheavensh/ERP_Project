<script lang="ts">
    import { onMount } from "svelte";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { Button } from "$lib/shared/components/ui/button";
    import { Badge } from "$lib/shared/components/ui/badge";
    import {
        DollarSign,
        Package,
        CheckCircle2,
        Clock,
        User,
        ChevronRight,
        Loader2,
        Plus,
        ShoppingCart,
    } from "lucide-svelte";
    import { api } from "$lib/shared/lib/api-client";
    import { goto } from "$app/navigation";

    let loading = $state(true);
    let data = $state<any>(null);
    let error = $state<string | null>(null);

    async function fetchData() {
        try {
            loading = true;
            error = null;
            const res = await api.get("/dashboard/cashier");
            data = res.data.data;
        } catch (e: any) {
            console.error("Failed to fetch cashier dashboard", e);
            error = e.response?.data?.message || e.message || "Failed to load";
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000); // Refresh every minute
        return () => clearInterval(interval);
    });

    function formatCurrency(amount: number) {
        return new Intl.NumberFormat("id-ID").format(amount || 0);
    }
</script>

<div class="space-y-8">
    <div
        class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
    >
        <div>
            <h2 class="text-3xl font-bold tracking-tight">Kasir Dashboard</h2>
            <p class="text-muted-foreground">
                Monitor penjualan dan penyerahan unit service hari ini.
            </p>
        </div>
        <div class="flex items-center gap-3">
            <Button
                class="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 text-white"
                onclick={() => goto("/service/new")}
            >
                <Plus class="mr-2 h-4 w-4" />
                Input Service Baru
            </Button>
            <Button
                variant="outline"
                class="hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200"
                onclick={() => goto("/kasir/daily-report")}
            >
                <DollarSign class="mr-2 h-4 w-4" />
                Laporan Shift
            </Button>
            <Button
                variant="outline"
                class="hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                onclick={() => goto("/sale/new")}
            >
                <ShoppingCart class="mr-2 h-4 w-4" />
                Input Penjualan
            </Button>
        </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card class="border-l-4 border-l-green-500">
            <CardContent class="pt-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-muted-foreground">
                            Pendapatan Hari Ini
                        </p>
                        <p class="text-2xl font-bold text-green-600">
                            Rp {loading
                                ? "..."
                                : formatCurrency(data?.stats?.revenueToday)}
                        </p>
                    </div>
                    <DollarSign class="h-10 w-10 text-green-200" />
                </div>
            </CardContent>
        </Card>

        <Card class="border-l-4 border-l-blue-500">
            <CardContent class="pt-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-muted-foreground">
                            Siap Diambil
                        </p>
                        <p class="text-3xl font-bold text-blue-600">
                            {loading ? "..." : data?.stats?.readyCount || 0}
                        </p>
                    </div>
                    <Package class="h-10 w-10 text-blue-200" />
                </div>
            </CardContent>
        </Card>

        <Card class="border-l-4 border-l-teal-500">
            <CardContent class="pt-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-muted-foreground">
                            Diambil Hari Ini
                        </p>
                        <p class="text-3xl font-bold text-teal-600">
                            {loading ? "..." : data?.stats?.pickedUpToday || 0}
                        </p>
                    </div>
                    <CheckCircle2 class="h-10 w-10 text-teal-200" />
                </div>
            </CardContent>
        </Card>

        <Card class="border-l-4 border-l-amber-500">
            <CardContent class="pt-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-muted-foreground">
                            Menunggu Konfirmasi
                        </p>
                        <p class="text-3xl font-bold text-amber-600">
                            {loading ? "..." : data?.stats?.pendingConfirm || 0}
                        </p>
                    </div>
                    <Clock class="h-10 w-10 text-amber-200" />
                </div>
            </CardContent>
        </Card>
    </div>

    {#if loading}
        <div class="flex items-center justify-center py-12">
            <Loader2 class="h-8 w-8 animate-spin text-primary" />
        </div>
    {:else if error}
        <Card class="border-red-200 bg-red-50">
            <CardContent class="pt-6">
                <p class="text-red-600">{error}</p>
            </CardContent>
        </Card>
    {:else}
        <!-- Ready for Pickup -->
        <Card>
            <CardHeader>
                <CardTitle class="flex items-center gap-2">
                    <Package class="h-5 w-5 text-blue-500" />
                    Siap Diambil Customer
                </CardTitle>
            </CardHeader>
            <CardContent>
                {#if data?.readyPickup?.length}
                    <div class="space-y-3">
                        {#each data.readyPickup as job}
                            <button
                                onclick={() => goto(`/service/${job.id}`)}
                                class="w-full flex items-center justify-between p-4 rounded-xl border hover:bg-muted/50 transition-colors text-left"
                            >
                                <div class="flex items-center gap-3">
                                    <div
                                        class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center"
                                    >
                                        <User class="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p class="font-medium">{job.no}</p>
                                        <p
                                            class="text-sm text-muted-foreground"
                                        >
                                            {job.customer?.name || "Customer"} •
                                            {job.device?.brand || ""}
                                            {job.device?.model || ""}
                                        </p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-3">
                                    <div class="text-right">
                                        <p
                                            class="text-sm text-muted-foreground"
                                        >
                                            Total
                                        </p>
                                        <p class="font-bold text-green-600">
                                            Rp {formatCurrency(
                                                job.actualCost ||
                                                    job.costEstimate ||
                                                    0,
                                            )}
                                        </p>
                                    </div>
                                    <ChevronRight
                                        class="h-4 w-4 text-muted-foreground"
                                    />
                                </div>
                            </button>
                        {/each}
                    </div>
                {:else}
                    <p class="text-muted-foreground text-center py-8">
                        Tidak ada unit yang siap diambil
                    </p>
                {/if}
            </CardContent>
        </Card>
    {/if}
</div>
