<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/shared/components/ui/select";
    import { History, Search, Filter } from "lucide-svelte";
    import type { SalesController } from "./sales.controller.svelte";

    let { controller }: { controller: SalesController } = $props();
</script>

<div
    class="px-6 py-4 flex flex-col gap-4 border-b bg-background/80 backdrop-blur-xl z-20"
>
    <div class="flex items-center justify-between">
        <div>
            <h1
                class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600"
            >
                Point of Sales
            </h1>
            <p class="text-muted-foreground text-sm">
                Kelola transaksi penjualan dengan mudah
            </p>
        </div>
        <div class="flex items-center gap-2">
            <Button
                variant="outline"
                href="/sales/history"
                class="gap-2 hidden md:flex"
            >
                <History class="h-4 w-4" />
                Riwayat Transaksi
            </Button>
        </div>
    </div>

    <!-- Toolbar -->
    <div class="flex gap-3">
        <div class="relative flex-1 max-w-md">
            <Search
                class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            />
            <Input
                type="search"
                placeholder="Cari produk (Nama atau SKU)..."
                class="pl-9 bg-secondary/10 border-muted-foreground/20 focus:bg-background transition-all"
                bind:value={controller.searchTerm}
            />
        </div>
        <Select type="single" bind:value={controller.selectedCategory}>
            <SelectTrigger
                class="w-[180px] bg-secondary/10 border-muted-foreground/20"
            >
                <div class="flex items-center gap-2 overflow-hidden">
                    <Filter class="w-3.5 h-3.5 flex-shrink-0" />
                    <span class="truncate">
                        {controller.categories.find(
                            (c) => c.id === controller.selectedCategory,
                        )?.name || "Semua Kategori"}
                    </span>
                </div>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {#each controller.categories as cat}
                    <SelectItem value={cat.id}>{cat.name}</SelectItem>
                {/each}
            </SelectContent>
        </Select>
    </div>
</div>
