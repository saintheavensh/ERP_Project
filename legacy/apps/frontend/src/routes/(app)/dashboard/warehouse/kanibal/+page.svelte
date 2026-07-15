<script lang="ts">
    import { api } from "$lib/shared/lib/api-client";
    import { onMount } from "svelte";
    import {
        Card,
        CardHeader,
        CardTitle,
        CardContent,
    } from "$lib/shared/components/ui/card";
    import { Button } from "$lib/shared/components/ui/button";
    import { Badge } from "$lib/shared/components/ui/badge";
    import {
        Loader2,
        Scissors,
        Package,
        ArrowRight,
        CheckCircle2,
    } from "lucide-svelte";
    import { toast } from "svelte-sonner";
    import { ProductsService } from "$lib/features/inventory/products/products.service";

    let devices = $state<any[]>([]); // Forfeited devices and dead phones (status KANIBAL)
    let loading = $state(true);
    let products = $state<any[]>([]); // To select destination product

    let selectedDevice = $state<any>(null);
    let selectedProduct = $state<any>(null);
    let quantity = $state(1);

    async function init() {
        try {
            loading = true;
            const [forfeitRes, prodRes] = await Promise.all([
                api.get("/inventory/kanibal/forfeited-devices"),
                ProductsService.getAll(),
            ]);
            devices = forfeitRes.data.data;
            products = prodRes;
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    async function handleHarvest() {
        if (!selectedDevice || !selectedProduct) {
            toast.error("Please select a source device and target product");
            return;
        }

        try {
            const payload = {
                sourceType: selectedDevice.serviceId ? "FORFEITED" : "GAMBLING",
                sourceId: selectedDevice.id,
                productId: selectedProduct.id,
                variantName: "Copotan",
                quantity,
                notes: `Harvested from ${selectedDevice.deviceName}`,
            };

            await api.post("/inventory/kanibal/harvest", payload);
            toast.success("Part harvested successfully! New batch created.");
            selectedDevice = null;
            init();
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Failed to harvest part");
        }
    }

    onMount(init);
</script>

<div class="space-y-6">
    <div class="flex items-center gap-3">
        <div
            class="h-12 w-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center"
        >
            <Scissors class="h-6 w-6 text-red-600" />
        </div>
        <div>
            <h1 class="text-3xl font-bold tracking-tight">
                Kanibal (Part Harvesting)
            </h1>
            <p class="text-muted-foreground">
                Extract parts from abandoned or dead devices into inventory
                batches.
            </p>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Source Selection -->
        <Card class="rounded-3xl border-0 shadow-lg">
            <CardHeader class="border-b">
                <CardTitle>1. Select Source Device</CardTitle>
            </CardHeader>
            <CardContent class="p-0 overflow-y-auto max-h-[500px]">
                {#if loading}
                    <div class="p-12 text-center text-muted-foreground">
                        <Loader2 class="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p>Loading devices...</p>
                    </div>
                {:else if devices.length === 0}
                    <div class="p-12 text-center text-muted-foreground">
                        <Package class="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p>No devices available for harvesting</p>
                    </div>
                {:else}
                    <div class="divide-y">
                        {#each devices as device}
                            <button
                                class="w-full p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between text-left"
                                onclick={() => (selectedDevice = device)}
                            >
                                <div class="flex items-center gap-3">
                                    <div
                                        class={`h-3 w-3 rounded-full ${selectedDevice?.id === device.id ? "bg-indigo-500 animate-pulse" : "bg-slate-200"}`}
                                    ></div>
                                    <div>
                                        <h4 class="font-bold">
                                            {device.deviceName}
                                        </h4>
                                        <p
                                            class="text-xs text-muted-foreground"
                                        >
                                            {device.serviceId
                                                ? `Service #${device.serviceId}`
                                                : `IMEI: ${device.imei}`}
                                        </p>
                                    </div>
                                </div>
                                <Badge variant="outline">{device.status}</Badge>
                            </button>
                        {/each}
                    </div>
                {/if}
            </CardContent>
        </Card>

        <!-- Destination & Action -->
        <div class="space-y-6">
            <Card
                class="rounded-3xl border-0 shadow-lg bg-indigo-600 text-white"
            >
                <CardHeader>
                    <CardTitle>2. Harvesting Details</CardTitle>
                </CardHeader>
                <CardContent class="space-y-4">
                    {#if selectedDevice}
                        <div
                            class="p-4 bg-white/10 rounded-2xl border border-white/20"
                        >
                            <p
                                class="text-indigo-100 text-xs font-bold uppercase tracking-wider"
                            >
                                Source
                            </p>
                            <h3 class="text-xl font-bold">
                                {selectedDevice.deviceName}
                            </h3>
                        </div>

                        <div class="space-y-2">
                            <label
                                for="targetProduct"
                                class="text-sm font-medium text-indigo-100"
                                >Target Product</label
                            >
                            <select
                                id="targetProduct"
                                class="w-full h-12 bg-white/10 border-white/20 rounded-xl px-4 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                                bind:value={selectedProduct}
                            >
                                <option value={null} class="text-slate-900"
                                    >Select part...</option
                                >
                                {#each products as p}
                                    <option value={p} class="text-slate-900"
                                        >{p.name}</option
                                    >
                                {/each}
                            </select>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label
                                    for="quantity"
                                    class="text-sm font-medium text-indigo-100"
                                    >Quantity</label
                                >
                                <input
                                    id="quantity"
                                    type="number"
                                    class="w-full h-12 bg-white/10 border-white/20 rounded-xl px-4 text-white"
                                    bind:value={quantity}
                                />
                            </div>
                            <div class="flex items-end">
                                <Button
                                    class="w-full h-12 rounded-xl bg-white text-indigo-700 hover:bg-slate-100 shadow-xl font-bold transition-all hover:scale-105 active:scale-95"
                                    onclick={handleHarvest}
                                >
                                    Harvest Now
                                    <ArrowRight class="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    {:else}
                        <div
                            class="p-12 text-center text-indigo-200 border-2 border-dashed border-white/20 rounded-3xl"
                        >
                            <CheckCircle2
                                class="h-12 w-12 mx-auto mb-2 opacity-50"
                            />
                            <p>
                                Select a device from the list to start
                                harvesting
                            </p>
                        </div>
                    {/if}
                </CardContent>
            </Card>

            <Card class="rounded-3xl border-0 shadow-lg">
                <CardHeader>
                    <CardTitle class="text-sm font-medium">History</CardTitle>
                </CardHeader>
                <CardContent
                    class="text-center p-8 text-muted-foreground italic"
                >
                    <p>Recent harvests will show up here.</p>
                </CardContent>
            </Card>
        </div>
    </div>
</div>
