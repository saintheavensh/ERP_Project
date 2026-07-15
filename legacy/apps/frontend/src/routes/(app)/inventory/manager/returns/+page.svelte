<script lang="ts">
    import {
        Tabs,
        TabsContent,
        TabsList,
        TabsTrigger,
    } from "$lib/shared/components/ui/tabs";
    import DefectiveItemsList from "$lib/features/inventory/purchase-returns/components/defective-items-list.svelte";
    import PurchaseReturnsList from "$lib/features/inventory/purchase-returns/components/purchase-returns-list.svelte";
    import { Undo2, Archive, History } from "lucide-svelte";
    import { Button } from "$lib/shared/components/ui/button";
    import { fade } from "svelte/transition";
</script>

<div class="min-h-screen space-y-8 p-6 pb-20">
    <!-- Header with Gradient -->
    <div
        class="relative bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-3xl p-8 text-white overflow-hidden shadow-2xl"
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
                        <Undo2 class="h-6 w-6 text-white" />
                    </div>
                    <h1 class="text-3xl font-bold tracking-tight text-white">
                        Retur Pembelian
                    </h1>
                </div>
                <p class="text-white/80 max-w-xl text-lg font-light">
                    Kelola barang rusak, staging area, dan dokumen pengembalian
                    ke supplier.
                </p>
            </div>

            <!-- Optional Actions / Stats could go here -->
        </div>
    </div>

    <!-- Main Content Tabs -->
    <div in:fade={{ duration: 500 }}>
        <Tabs value="staging" class="space-y-6">
            <div class="flex items-center justify-between">
                <TabsList
                    class="bg-card/50 backdrop-blur border p-1 rounded-xl h-auto"
                >
                    <TabsTrigger
                        value="staging"
                        class="px-6 py-2.5 rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white transition-all gap-2"
                    >
                        <Archive class="h-4 w-4" /> Gudang Retur (Staging)
                    </TabsTrigger>
                    <TabsTrigger
                        value="history"
                        class="px-6 py-2.5 rounded-lg data-[state=active]:bg-fuchsia-600 data-[state=active]:text-white transition-all gap-2"
                    >
                        <History class="h-4 w-4" /> Riwayat Retur
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="staging" class="focus-visible:outline-none">
                <div
                    class="bg-card/40 backdrop-blur-sm rounded-xl border shadow-sm p-1"
                >
                    <DefectiveItemsList />
                </div>
            </TabsContent>

            <TabsContent value="history" class="focus-visible:outline-none">
                <div
                    class="bg-card/40 backdrop-blur-sm rounded-xl border shadow-sm p-1"
                >
                    <PurchaseReturnsList />
                </div>
            </TabsContent>
        </Tabs>
    </div>
</div>
