<script lang="ts">
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { Button } from "$lib/shared/components/ui/button";
    import {
        LayoutDashboard,
        Wrench,
        ShoppingCart,
        Truck,
        BarChart3,
        ClipboardList,
        Package,
        Users,
    } from "lucide-svelte";
    import { authStore } from "$lib/shared/lib/auth-store.svelte";
    import { Skeleton } from "$lib/shared/components/ui/skeleton";

    const user = $derived(authStore.user);
    const isLoading = $derived(authStore.loading);
</script>

<div class="space-y-8 animate-in fade-in-50 duration-500">
    <div class="flex flex-col gap-2">
        <h1
            class="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
        >
            Manager Dashboard
        </h1>
        <p class="text-muted-foreground">
            Overview operasional, performa bisnis, dan manajemen inventaris.
        </p>
    </div>

    <!-- Overview Stats -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium"
                    >Total Penjualan</CardTitle
                >
                <ShoppingCart class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">Rp 12.5M</div>
                <p class="text-xs text-muted-foreground">
                    +2.5% dari bulan lalu
                </p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium">Service Aktif</CardTitle>
                <Wrench class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">24</div>
                <p class="text-xs text-muted-foreground">4 perlu approval</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium"
                    >Purchase Orders</CardTitle
                >
                <Truck class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">8</div>
                <p class="text-xs text-muted-foreground">2 pending delivery</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium">Stok Kritis</CardTitle>
                <Package class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold text-red-600">3</div>
                <p class="text-xs text-muted-foreground">
                    Perlu restock segera
                </p>
            </CardContent>
        </Card>
    </div>

    <!-- Quick Actions -->
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div class="space-y-4">
            <h3 class="text-lg font-semibold tracking-tight">
                Operasional Harian
            </h3>
            <div class="grid grid-cols-2 gap-3">
                <Button
                    variant="outline"
                    class="h-24 flex flex-col gap-2 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    href="/sales"
                >
                    <ShoppingCart class="h-6 w-6 text-blue-600" />
                    <span>POS Penjualan</span>
                </Button>
                <Button
                    variant="outline"
                    class="h-24 flex flex-col gap-2 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                    href="/service"
                >
                    <Wrench class="h-6 w-6 text-orange-600" />
                    <span>Antrian Service</span>
                </Button>
            </div>
        </div>

        <div class="space-y-4">
            <h3 class="text-lg font-semibold tracking-tight">Manajemen</h3>
            <div class="grid grid-cols-2 gap-3">
                <Button
                    variant="outline"
                    class="h-24 flex flex-col gap-2"
                    href="/purchases"
                >
                    <ClipboardList class="h-6 w-6" />
                    <span>Pembelian</span>
                </Button>
                <Button
                    variant="outline"
                    class="h-24 flex flex-col gap-2"
                    href="/products"
                >
                    <Package class="h-6 w-6" />
                    <span>Produk & Stok</span>
                </Button>
            </div>
        </div>

        <div class="space-y-4">
            <h3 class="text-lg font-semibold tracking-tight">
                Laporan & Analisis
            </h3>
            <div class="grid grid-cols-1 gap-3">
                <Button
                    variant="default"
                    class="h-24 flex flex-row items-center justify-center gap-4 bg-slate-900 text-white hover:bg-slate-800"
                    href="/reports"
                >
                    <BarChart3 class="h-8 w-8" />
                    <div class="text-left">
                        <div class="font-bold">Laporan Keuangan</div>
                        <div class="text-xs opacity-70 font-normal">
                            Analisis profit & performa
                        </div>
                    </div>
                </Button>
            </div>
        </div>
    </div>
</div>
