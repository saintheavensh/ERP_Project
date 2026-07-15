<script lang="ts">
    import { onMount } from "svelte";
    import { Button } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import { goto } from "$app/navigation";
    import {
        Search,
        Truck,
        Calendar,
        PackageCheck,
        Eye,
        FileText,
    } from "lucide-svelte";
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
    import { PurchaseListController } from "$lib/features/sales/components/purchases/purchase-list.controller.svelte";
    import { fade } from "svelte/transition";

    const controller = new PurchaseListController();

    onMount(() => {
        // Warehouse only cares about incoming or received items
        controller.statusFilter = "ORDERED";
        controller.load();
    });
</script>

<div class="min-h-screen space-y-6 p-6 pb-20">
    <!-- Header Section -->
    <div class="flex flex-col gap-2">
        <h1
            class="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3"
        >
            <div class="p-2 bg-amber-100 text-amber-600 rounded-lg">
                <Truck class="h-6 w-6" />
            </div>
            Penerimaan Barang
        </h1>
        <p class="text-muted-foreground text-lg">
            Cek dan terima barang masuk dari supplier.
        </p>
    </div>

    <!-- Mobile-First Search Bar -->
    <div
        class="sticky top-4 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 -mx-4 border-b md:border-0 md:bg-transparent md:p-0 md:mx-0"
    >
        <div class="relative w-full md:max-w-md">
            <Search
                class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            />
            <Input
                type="search"
                placeholder="Cari No. PO atau Supplier..."
                class="pl-9 h-12 text-lg shadow-sm"
                bind:value={controller.search}
                oninput={() => controller.handleSearch()}
            />
        </div>
    </div>

    <!-- List View -->
    <div class="space-y-4">
        {#if controller.loading}
            {#each Array(3) as _}
                <div
                    class="h-32 bg-muted/20 animate-pulse rounded-xl border border-dashed"
                ></div>
            {/each}
        {:else if controller.purchases.length === 0}
            <div
                class="text-center p-12 bg-muted/20 rounded-xl border border-dashed"
            >
                <PackageCheck
                    class="h-12 w-12 text-muted-foreground/30 mx-auto mb-3"
                />
                <p class="text-muted-foreground font-medium">
                    Tidak ada pesanan masuk
                </p>
                <p class="text-sm text-muted-foreground">
                    PO status Ordered akan muncul disini.
                </p>
            </div>
        {:else}
            {#each controller.purchases as po}
                <!-- Mobile Card Style for Warehouse Efficiency -->
                <div
                    in:fade={{ duration: 300 }}
                    class="bg-card rounded-xl border shadow-sm p-4 active:scale-[0.99] transition-transform relative overflow-hidden group hover:border-amber-400"
                >
                    <div class="flex justify-between items-start mb-3">
                        <div class="font-mono font-bold text-lg">
                            {po.notes || po.id}
                        </div>
                        <Badge
                            variant={po.status === "RECEIVED"
                                ? "default"
                                : "outline"}
                            class={po.status === "RECEIVED"
                                ? "bg-green-600"
                                : "text-blue-600 border-blue-200 bg-blue-50"}
                        >
                            {po.status}
                        </Badge>
                    </div>

                    <div class="mb-4">
                        <div
                            class="font-semibold text-lg text-foreground flex items-center gap-2"
                        >
                            <Truck class="h-4 w-4 text-muted-foreground" />
                            {po.supplier?.name || "Unknown Supplier"}
                        </div>
                        <div
                            class="text-sm text-muted-foreground flex items-center gap-2 mt-1"
                        >
                            <Calendar class="h-4 w-4" />
                            {controller.formatDate(po.date)}
                        </div>
                    </div>

                    <div
                        class="flex items-center justify-between border-t pt-3 mt-2"
                    >
                        <div class="text-sm font-medium">
                            {po.items?.length || 0} Item dipesan
                        </div>
                        <Button
                            href="/warehouse/reception/{po.id}"
                            class="bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-900/10"
                        >
                            <PackageCheck class="mr-2 h-4 w-4" />
                            Terima Barang
                        </Button>
                    </div>
                </div>
            {/each}
        {/if}
    </div>
</div>
