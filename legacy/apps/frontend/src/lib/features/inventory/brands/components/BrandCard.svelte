<script lang="ts">
    import { Card, CardContent } from "$lib/shared/components/ui/card";
    import { Button, buttonVariants } from "$lib/shared/components/ui/button";
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuTrigger,
    } from "$lib/shared/components/ui/dropdown-menu";
    import { MoreVertical, Edit2, Trash2 } from "lucide-svelte";
    import { cn } from "$lib/shared/lib/utils";
    import type { BrandsController } from "../brands.controller.svelte";

    let { brand, controller }: { brand: any; controller: BrandsController } =
        $props();
</script>

<Card
    class="group relative overflow-hidden hover:shadow-lg transition-all duration-300 border-muted"
>
    <CardContent
        class="p-4 flex flex-col items-center justify-center gap-3 text-center h-full"
    >
        <!-- Action Menu Top Right -->
        <div
            class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
            <DropdownMenu>
                <DropdownMenuTrigger
                    class={cn(
                        buttonVariants({
                            variant: "ghost",
                            size: "icon",
                        }),
                        "h-6 w-6",
                    )}
                >
                    <MoreVertical class="h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem
                        onclick={() => controller.openEditDialog(brand)}
                    >
                        <Edit2 class="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        class="text-destructive focus:text-destructive"
                        onclick={() => controller.handleDelete(brand.id)}
                    >
                        <Trash2 class="mr-2 h-4 w-4" /> Hapus
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

        <div class="h-20 w-full flex items-center justify-center mb-1">
            {#if brand.logo}
                <img
                    src={brand.logo}
                    alt={brand.name}
                    class="h-16 w-auto max-w-[80%] object-contain"
                />
            {:else}
                <div
                    class="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center text-xl font-bold text-muted-foreground"
                >
                    {brand.name.substring(0, 2).toUpperCase()}
                </div>
            {/if}
        </div>
        <div>
            <h3
                class="font-semibold text-base truncate w-full px-1"
                title={brand.name}
            >
                {brand.name}
            </h3>
            <p class="text-[10px] text-muted-foreground font-mono">
                {brand.id}
            </p>
        </div>
    </CardContent>
</Card>
