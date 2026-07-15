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
    import { Input } from "$lib/shared/components/ui/input";
    import { Badge } from "$lib/shared/components/ui/badge";
    import {
        Loader2,
        Plus,
        Search,
        Smartphone,
        History,
        Microscope,
    } from "lucide-svelte";
    import { toast } from "svelte-sonner";
    import { formatCurrency } from "$lib/shared/lib/utils";
    import ProductSearchBarcode from "$lib/shared/components/custom/ProductSearchBarcode.svelte";

    let deadPhones = $state<any[]>([]);
    let loading = $state(true);
    let searchTerm = $state("");

    // Form Stats
    let showAddModal = $state(false);
    let newDevice = $state({
        deviceName: "",
        imei: "",
        purchasePrice: 0,
        notes: "",
    });

    async function fetchDeadPhones() {
        try {
            loading = true;
            const res = await api.get("/inventory/gambling/dead-phones");
            deadPhones = res.data.data;
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    async function addDevice() {
        try {
            await api.post("/inventory/gambling/dead-phones", newDevice);
            toast.success("Dead phone recorded");
            showAddModal = false;
            fetchDeadPhones();
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Failed to record device");
        }
    }

    const filteredPhones = $derived(
        deadPhones.filter(
            (p) =>
                p.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.imei && p.imei.includes(searchTerm)),
        ),
    );

    onMount(fetchDeadPhones);
</script>

<div class="space-y-6">
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-3xl font-bold tracking-tight">
                Gambling (Dead Phones)
            </h1>
            <p class="text-muted-foreground">
                Manage dead phone inventory and diagnosis.
            </p>
        </div>
        <Button
            class="rounded-2xl h-12 px-6 shadow-lg bg-indigo-600 hover:bg-indigo-700"
            onclick={() => (showAddModal = true)}
        >
            <Plus class="mr-2 h-5 w-5" />
            Beli HP Mati
        </Button>
    </div>

    {#if showAddModal}
        <Card
            class="animate-in slide-in-from-top-4 duration-300 border-2 border-indigo-100 bg-indigo-50/30"
        >
            <CardHeader>
                <CardTitle>Record New Purchase</CardTitle>
            </CardHeader>
            <CardContent>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-2">
                        <label for="deviceName" class="text-sm font-medium"
                            >Device Name</label
                        >
                        <Input
                            id="deviceName"
                            bind:value={newDevice.deviceName}
                            placeholder="iPhone 13 Pro Max"
                        />
                    </div>
                    <div class="space-y-2">
                        <label for="imei" class="text-sm font-medium"
                            >IMEI / SN</label
                        >
                        <Input
                            id="imei"
                            bind:value={newDevice.imei}
                            placeholder="15 digits"
                        />
                    </div>
                    <div class="space-y-2">
                        <label for="purchasePrice" class="text-sm font-medium"
                            >Purchase Price</label
                        >
                        <Input
                            id="purchasePrice"
                            type="number"
                            bind:value={newDevice.purchasePrice}
                        />
                    </div>
                    <div class="space-y-2">
                        <label for="notes" class="text-sm font-medium"
                            >Initial Notes</label
                        >
                        <Input
                            id="notes"
                            bind:value={newDevice.notes}
                            placeholder="Rusak jatuh, matot"
                        />
                    </div>
                </div>
                <div class="mt-4 flex justify-end gap-2">
                    <Button
                        variant="ghost"
                        onclick={() => (showAddModal = false)}>Cancel</Button
                    >
                    <Button onclick={addDevice}>Save Device</Button>
                </div>
            </CardContent>
        </Card>
    {/if}

    <Card class="rounded-3xl border-0 shadow-xl overflow-hidden">
        <CardHeader class="border-b bg-slate-50/50 dark:bg-slate-900/50">
            <div class="flex items-center gap-4">
                <ProductSearchBarcode
                    bind:value={searchTerm}
                    placeholder="Cari IMEI atau Nama HP..."
                />
            </div>
        </CardHeader>
        <CardContent class="p-0">
            {#if loading}
                <div class="p-12 text-center">
                    <Loader2
                        class="h-8 w-8 animate-spin mx-auto text-primary"
                    />
                </div>
            {:else if filteredPhones.length === 0}
                <div class="p-12 text-center text-muted-foreground">
                    <Smartphone class="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No dead phones found</p>
                </div>
            {:else}
                <div class="divide-y">
                    {#each filteredPhones as phone}
                        <div
                            class="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between"
                        >
                            <div class="flex items-center gap-4">
                                <div
                                    class="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center"
                                >
                                    <Smartphone
                                        class="h-6 w-6 text-slate-400"
                                    />
                                </div>
                                <div>
                                    <h4 class="font-bold">
                                        {phone.deviceName}
                                    </h4>
                                    <p class="text-sm text-muted-foreground">
                                        IMEI: {phone.imei || "N/A"} • {formatCurrency(
                                            phone.purchasePrice,
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div class="flex items-center gap-4">
                                <Badge
                                    variant={phone.status === "DEAD"
                                        ? "destructive"
                                        : phone.status === "REPAIRABLE"
                                          ? "default"
                                          : "secondary"}
                                >
                                    {phone.status}
                                </Badge>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    class="rounded-xl"
                                >
                                    <Microscope class="mr-2 h-4 w-4" />
                                    Diagnosis
                                </Button>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </CardContent>
    </Card>
</div>
