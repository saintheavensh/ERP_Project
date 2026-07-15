<script lang="ts">
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { Button } from "$lib/shared/components/ui/button";
    import {
        Package,
        Search,
        Truck,
        Archive,
        AlertTriangle,
        Smartphone,
        Scissors,
    } from "lucide-svelte";
    import { authStore } from "$lib/shared/lib/auth-store.svelte";

    const user = $derived(authStore.user);
</script>

<div class="space-y-6">
    <div class="flex flex-col gap-2">
        <h1 class="text-3xl font-bold tracking-tight">Warehouse Dashboard</h1>
        <p class="text-muted-foreground">
            Halo {user?.name || "Staff"}, berikut ringkasan inventaris hari ini.
        </p>
    </div>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium">Total Produk</CardTitle>
                <Package class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">1,240</div>
                <p class="text-xs text-muted-foreground">SKU Aktif</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium">Stok Menipis</CardTitle>
                <AlertTriangle class="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold text-orange-600">12</div>
                <p class="text-xs text-muted-foreground">Perlu restock</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium">Barang Masuk</CardTitle>
                <Truck class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">5</div>
                <p class="text-xs text-muted-foreground">
                    Pesanan pembelian hari ini
                </p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium">Total Aset</CardTitle>
                <Archive class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">Rp 450M</div>
                <p class="text-xs text-muted-foreground">Estimasi nilai stok</p>
            </CardContent>
        </Card>
    </div>

    <!-- Quick Actions -->
    <div class="space-y-4">
        <h3 class="text-lg font-semibold tracking-tight">Aksi Cepat</h3>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Button
                variant="outline"
                class="h-24 flex flex-col gap-2"
                href="/products"
            >
                <Package class="h-6 w-6" />
                <span>Kelola Produk</span>
            </Button>
            <Button
                variant="outline"
                class="h-24 flex flex-col gap-2"
                href="/searchproduct"
            >
                <Search class="h-6 w-6" />
                <span>Cari Stok</span>
            </Button>
            <Button
                variant="outline"
                class="h-24 flex flex-col gap-2 border-indigo-100 bg-indigo-50/50 hover:border-indigo-500"
                href="/warehouse/gambling"
            >
                <Smartphone class="h-6 w-6 text-indigo-600" />
                <span>Gambling (HP Mati)</span>
            </Button>
            <Button
                variant="outline"
                class="h-24 flex flex-col gap-2 border-red-100 bg-red-50/50 hover:border-red-500"
                href="/warehouse/kanibal"
            >
                <Scissors class="h-6 w-6 text-red-600" />
                <span>Kanibal (Panen Part)</span>
            </Button>
            <Button
                variant="outline"
                class="h-24 flex flex-col gap-2"
                href="/purchases"
            >
                <Truck class="h-6 w-6" />
                <span>Penerimaan Barang</span>
            </Button>
        </div>
    </div>
</div>
