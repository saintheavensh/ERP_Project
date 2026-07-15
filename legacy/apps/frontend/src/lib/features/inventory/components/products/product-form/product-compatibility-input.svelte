<script lang="ts">
    import { Input } from "$lib/shared/components/ui/input";
    import { Button } from "$lib/shared/components/ui/button";
    import { Label } from "$lib/shared/components/ui/label";
    import { Badge } from "$lib/shared/components/ui/badge";
    import { Smartphone, Search, Check, Plus } from "lucide-svelte";
    import { ProductFormController } from "$lib/features/inventory/products/controllers/product-form.controller.svelte";

    let { controller } = $props<{ controller: ProductFormController }>();
</script>

<div class="space-y-3">
    <div class="flex items-center justify-between">
        <Label class="text-sm font-medium"
            >Nama Produk <span class="text-destructive">*</span></Label
        >
        {#if controller.compatibility.length > 0 || controller.manualNameParts.length > 0}
            <Badge variant="secondary" class="font-normal text-xs">
                <Smartphone class="h-3 w-3 mr-1" />
                {controller.compatibility.length} device{#if controller.manualNameParts.length > 0}
                    + {controller.manualNameParts.length} manual{/if}
            </Badge>
        {/if}
    </div>

    <Input
        value={controller.name}
        oninput={(e) => controller.handleNameChange(e.currentTarget.value)}
        placeholder="Ketik nama device (Mis: Oppo A3s / A5s / Realme 2)"
        class="text-base"
    />

    <!-- Device Suggestions Dropdown -->
    {#if controller.nameSuggestions.length > 0}
        <div
            class="border-2 border-primary/20 rounded-xl shadow-lg bg-card overflow-hidden"
        >
            <!-- Search Header -->
            <div
                class="flex items-center gap-2 p-3 border-b bg-gradient-to-r from-primary/5 to-transparent"
            >
                <div class="relative flex-1">
                    <Search
                        class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                    />
                    <Input
                        value={controller.deviceSearchQuery}
                        oninput={(e) =>
                            controller.setDeviceSearchQuery(
                                e.currentTarget.value,
                            )}
                        placeholder="Cari device..."
                        class="pl-8 h-9 text-sm"
                    />
                </div>
                <Button
                    variant="default"
                    size="sm"
                    class="h-9 px-4 text-xs font-semibold shadow-sm"
                    onclick={() => controller.applyAllSuggestions()}
                >
                    <Check class="h-3.5 w-3.5 mr-1" />
                    Tambah Semua
                </Button>
            </div>

            <!-- Devices Header -->
            <div
                class="px-3 py-2 bg-muted/30 border-b flex items-center justify-between"
            >
                <span
                    class="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                    >Saran Device ({controller.filteredSuggestions
                        .length})</span
                >
            </div>

            <!-- Device List -->
            <div class="max-h-[280px] overflow-y-auto divide-y divide-muted/20">
                {#each controller.filteredSuggestions as suggestion, index}
                    <button
                        type="button"
                        class="w-full flex items-center gap-3 px-3 py-3 hover:bg-primary/5 transition-all duration-150 text-left group"
                        onclick={() => controller.applySuggestion(suggestion)}
                    >
                        <!-- Device Image -->
                        <div
                            class="w-11 h-11 rounded-lg bg-gradient-to-br from-muted/50 to-muted/20 flex items-center justify-center overflow-hidden shrink-0 ring-1 ring-muted/30"
                        >
                            {#if suggestion.device.image}
                                <img
                                    src={suggestion.device.image}
                                    alt="{suggestion.device.brand} {suggestion
                                        .device.model}"
                                    class="w-full h-full object-contain"
                                />
                            {:else}
                                <Smartphone
                                    class="h-5 w-5 text-muted-foreground/50"
                                />
                            {/if}
                        </div>

                        <!-- Device Info -->
                        <div class="flex-1 min-w-0">
                            <div class="font-medium text-sm text-foreground">
                                {suggestion.device.brand}
                                {suggestion.device.model}
                            </div>
                            {#if suggestion.device.code}
                                <div
                                    class="text-xs text-muted-foreground truncate"
                                >
                                    {suggestion.device.code}
                                </div>
                            {/if}
                        </div>

                        <!-- Add Icon -->
                        <div
                            class="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0"
                        >
                            <Plus class="h-4 w-4" />
                        </div>
                    </button>
                {/each}

                {#if controller.filteredSuggestions.length === 0}
                    <div class="p-4 text-center text-sm text-muted-foreground">
                        Tidak ada device yang cocok
                    </div>
                {/if}
            </div>
        </div>
    {/if}

    <!-- Selected Devices -->
    {#if controller.compatibility.length > 0 || controller.manualNameParts.length > 0}
        <div class="flex flex-wrap gap-2">
            {#each controller.selectedDevices as device (device.id)}
                <span
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm bg-primary/10 text-primary rounded-full border border-primary/20"
                >
                    <Smartphone class="h-3.5 w-3.5" />
                    {device.brand}
                    {device.model}
                    <button
                        type="button"
                        class="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                        onclick={() => controller.removeDevice(device.id)}
                        aria-label="Hapus {device.brand} {device.model}"
                    >
                        <svg
                            class="h-3 w-3"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </span>
            {/each}
            {#each controller.manualNameParts as part, i}
                <span
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm bg-muted text-muted-foreground rounded-full border"
                >
                    🔤 {part}
                    <button
                        type="button"
                        class="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                        onclick={() => controller.removeManualPart(i)}
                        aria-label="Hapus {part}"
                    >
                        <svg
                            class="h-3 w-3"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </span>
            {/each}
        </div>
    {/if}

    <p class="text-xs text-muted-foreground">
        Ketik nama device dipisahkan dengan " / ". Saran akan muncul untuk
        device yang cocok.
    </p>
</div>
