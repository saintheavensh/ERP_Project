<script lang="ts">
    import { createQuery } from "@tanstack/svelte-query";
    import { ProductsService as InventoryService } from "$lib/features/inventory/products/products.service";
    import { Button } from "$lib/shared/components/ui/button";
    import { ArrowLeft, Loader2, PackageX } from "lucide-svelte";
    import { Badge } from "$lib/shared/components/ui/badge";

    const query = createQuery(() => ({
        queryKey: ["unlinked-products"],
        queryFn: () => InventoryService.getUnlinkedProducts(100, 0),
    }));

    let unlinkedProducts = $derived(query.data || []);
</script>

<div
    class="space-y-6 container mx-auto p-6 max-w-7xl animate-in fade-in duration-500"
>
    <!-- Header -->
    <div class="flex items-center justify-between">
        <div class="space-y-1">
            <h2 class="text-3xl font-bold tracking-tight">Unlinked Products</h2>
            <p class="text-muted-foreground">
                Founded products that do not have any compatibility links with
                devices.
            </p>
        </div>
        <Button variant="outline" href="/devices">
            <ArrowLeft class="mr-2 h-4 w-4" />
            Back to Devices
        </Button>
    </div>

    <!-- Content -->
    {#if query.isLoading}
        <div
            class="flex flex-col items-center justify-center py-20 text-muted-foreground"
        >
            <Loader2 class="h-10 w-10 animate-spin mb-4" />
            <p>Scanning for orphan products...</p>
        </div>
    {:else if query.isError}
        <div
            class="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600"
        >
            <p>Failed to load unlinked products.</p>
        </div>
    {:else if unlinkedProducts.length === 0}
        <div
            class="flex flex-col items-center justify-center py-20 text-muted-foreground border rounded-xl border-dashed"
        >
            <PackageX class="h-16 w-16 mb-4 opacity-50" />
            <h3 class="text-lg font-semibold">Clean Slate!</h3>
            <p>All products are linked to at least one device.</p>
        </div>
    {:else}
        <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
            {#each unlinkedProducts as product}
                <div
                    class="border rounded-xl p-4 bg-card shadow-sm hover:shadow-md transition-shadow"
                >
                    <div class="flex items-start justify-between mb-2">
                        <Badge variant="secondary" class="font-mono text-xs"
                            >{product.code || "No Code"}</Badge
                        >
                        <Badge variant="destructive" class="text-xs"
                            >Unlinked</Badge
                        >
                    </div>
                    <h3
                        class="font-semibold text-lg line-clamp-2 min-h-[3.5rem] mb-2"
                    >
                        {product.name}
                    </h3>
                    <div
                        class="flex items-center justify-between mt-4 pt-4 border-t text-sm text-muted-foreground"
                    >
                        <span
                            >Stock: <span class="text-foreground font-medium"
                                >{product.stock}</span
                            ></span
                        >
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>
