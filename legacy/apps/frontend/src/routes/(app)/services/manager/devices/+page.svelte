<script lang="ts">
    import { Button, buttonVariants } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import * as Card from "$lib/shared/components/ui/card";
    import { Badge } from "$lib/shared/components/ui/badge";
    import { Separator } from "$lib/shared/components/ui/separator";
    import * as DropdownMenu from "$lib/shared/components/ui/dropdown-menu";
    import * as AlertDialog from "$lib/shared/components/ui/alert-dialog";
    import {
        Search,
        Plus,
        Filter,
        Trash2,
        Edit,
        Smartphone,
        Cpu,
        Grid,
        List,
        RefreshCw,
        Download,
        Upload,
        ChevronDown,
        Check,
    } from "lucide-svelte";
    import { fly } from "svelte/transition";
    import { cn } from "$lib/shared/lib/utils";
    import { DevicesController } from "$lib/features/services/devices/devices.controller.svelte";
    import DeviceForm from "$lib/features/services/devices/components/device-form.svelte";

    const controller = new DevicesController();
</script>

<div class="container mx-auto py-6 space-y-6">
    <!-- Header -->
    <div
        class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
    >
        <div>
            <h1 class="text-3xl font-bold tracking-tight">Devices Database</h1>
            <p class="text-muted-foreground">
                Manage smartphone specifications and compatibility data.
            </p>
        </div>
        <div class="flex items-center gap-2">
            <Button variant="outline" size="sm">
                <Upload class="mr-2 h-4 w-4" /> Import
            </Button>
            <Button variant="outline" size="sm">
                <Download class="mr-2 h-4 w-4" /> Export
            </Button>
            <Button onclick={() => controller.handleCreateNew()}>
                <Plus class="mr-2 h-4 w-4" /> Add Device
            </Button>
        </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card.Root>
            <Card.Header
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <Card.Title class="text-sm font-medium"
                    >Total Devices</Card.Title
                >
                <Smartphone class="h-4 w-4 text-muted-foreground" />
            </Card.Header>
            <Card.Content>
                <div class="text-2xl font-bold">{controller.totalDevices}</div>
                <p class="text-xs text-muted-foreground">Registered models</p>
            </Card.Content>
        </Card.Root>
        <Card.Root>
            <Card.Header
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <Card.Title class="text-sm font-medium">Top Brand</Card.Title>
                <Badge variant="secondary">{controller.topBrand}</Badge>
            </Card.Header>
            <Card.Content>
                <div class="text-2xl font-bold">
                    {controller.brandStats[controller.topBrand] || 0}
                </div>
                <p class="text-xs text-muted-foreground">Models available</p>
            </Card.Content>
        </Card.Root>
        <Card.Root>
            <Card.Header
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <Card.Title class="text-sm font-medium">Sync Status</Card.Title>
                <RefreshCw class="h-4 w-4 text-muted-foreground" />
            </Card.Header>
            <Card.Content>
                <div class="text-2xl font-bold">Ready</div>
                <p class="text-xs text-muted-foreground">
                    Last synced: Just now
                </p>
            </Card.Content>
        </Card.Root>
    </div>

    <!-- Filters & Toolbar -->
    <div
        class="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border shadow-sm"
    >
        <div class="flex items-center gap-2 w-full md:w-auto">
            <div class="relative w-full md:w-64">
                <Search
                    class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                />
                <Input
                    type="search"
                    placeholder="Search devices..."
                    class="pl-9"
                    bind:value={controller.searchTerm}
                />
            </div>
            <DropdownMenu.Root>
                <DropdownMenu.Trigger
                    class={cn(
                        buttonVariants({ variant: "outline" }),
                        "w-[140px] justify-between",
                    )}
                >
                    {controller.selectedBrand === "all"
                        ? "All Brands"
                        : controller.selectedBrand}
                    <ChevronDown class="ml-2 h-4 w-4 opacity-50" />
                </DropdownMenu.Trigger>
                <DropdownMenu.Content
                    class="w-[200px] max-h-[300px] overflow-y-auto"
                >
                    <DropdownMenu.Label>Filter by Brand</DropdownMenu.Label>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item
                        onclick={() => (controller.selectedBrand = "all")}
                    >
                        All Brands
                        {#if controller.selectedBrand === "all"}
                            <Check class="ml-auto h-4 w-4" />
                        {/if}
                    </DropdownMenu.Item>
                    {#each controller.brands as brand}
                        <DropdownMenu.Item
                            onclick={() =>
                                (controller.selectedBrand = brand.name)}
                        >
                            {brand.name}
                            {#if controller.selectedBrand === brand.name}
                                <Check class="ml-auto h-4 w-4" />
                            {/if}
                        </DropdownMenu.Item>
                    {/each}
                </DropdownMenu.Content>
            </DropdownMenu.Root>
        </div>

        <div class="flex items-center gap-2">
            {#if controller.selectedIds.length > 0}
                <Button
                    variant="destructive"
                    size="sm"
                    onclick={() => controller.confirmBulkDelete()}
                >
                    <Trash2 class="mr-2 h-4 w-4" /> Delete ({controller
                        .selectedIds.length})
                </Button>
            {/if}
            <div class="border rounded-md p-1 flex items-center">
                <Button
                    variant={controller.layout === "grid"
                        ? "secondary"
                        : "ghost"}
                    size="icon"
                    class="h-8 w-8"
                    onclick={() => (controller.layout = "grid")}
                >
                    <Grid class="h-4 w-4" />
                </Button>
                <Button
                    variant={controller.layout === "list"
                        ? "secondary"
                        : "ghost"}
                    size="icon"
                    class="h-8 w-8"
                    onclick={() => (controller.layout = "list")}
                >
                    <List class="h-4 w-4" />
                </Button>
            </div>
        </div>
    </div>

    <!-- Content -->
    {#if controller.loading && controller.devices.length === 0}
        <div
            class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
            {#each Array(8) as _}
                <div class="h-[300px] rounded-xl bg-muted animate-pulse"></div>
            {/each}
        </div>
    {:else}
        {#each controller.groupedDevices as [brandName, group]}
            <div class="space-y-4">
                <div class="flex items-center gap-3">
                    <h3 class="text-xl font-bold">{brandName}</h3>
                    <Badge variant="outline"
                        >{group.flat.length +
                            Object.values(group.series).flat().length} models</Badge
                    >
                </div>

                <!-- Series Groups -->
                {#each Object.entries(group.series) as [seriesName, devices]}
                    <div class="pl-4 border-l-2 border-primary/20">
                        <h4
                            class="text-lg font-semibold mb-3 text-muted-foreground"
                        >
                            {seriesName}
                        </h4>
                        <div
                            class={cn(
                                "grid gap-6",
                                controller.layout === "grid"
                                    ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                                    : "grid-cols-1",
                            )}
                        >
                            {#each devices as device (device.id)}
                                <div
                                    class="group relative bg-card rounded-xl border shadow-sm hover:shadow-lg transition-all overflow-hidden"
                                    transition:fly={{ y: 20, duration: 300 }}
                                >
                                    <!-- Selection Checkbox -->
                                    <div class="absolute top-3 left-3 z-10">
                                        <input
                                            type="checkbox"
                                            checked={controller.selectedIds.includes(
                                                device.id,
                                            )}
                                            onchange={() =>
                                                controller.toggleSelect(
                                                    device.id,
                                                )}
                                            class="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                    </div>

                                    <!-- Actions -->
                                    <div
                                        class="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1"
                                    >
                                        <Button
                                            size="icon"
                                            variant="secondary"
                                            class="h-8 w-8 rounded-full shadow-sm"
                                            onclick={() =>
                                                controller.handleEdit(device)}
                                        >
                                            <Edit class="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="destructive"
                                            class="h-8 w-8 rounded-full shadow-sm"
                                            onclick={() =>
                                                controller.handleDelete(
                                                    device.id,
                                                )}
                                        >
                                            <Trash2 class="h-3.5 w-3.5" />
                                        </Button>
                                    </div>

                                    <div
                                        class="aspect-[4/3] bg-muted/30 relative flex items-center justify-center p-4"
                                    >
                                        {#if device.image}
                                            <img
                                                src={device.image}
                                                alt={device.model}
                                                class="w-full h-full object-contain mix-blend-multiply"
                                            />
                                        {:else}
                                            <Smartphone
                                                class="h-12 w-12 text-muted-foreground/20"
                                            />
                                        {/if}
                                        <Badge
                                            variant="secondary"
                                            class="absolute bottom-2 right-2 text-[10px]"
                                            >{device.code || "NO CODE"}</Badge
                                        >
                                    </div>

                                    <div class="p-4 space-y-2">
                                        <div>
                                            <div
                                                class="text-xs text-muted-foreground font-medium uppercase tracking-wider"
                                            >
                                                {device.brand}
                                            </div>
                                            <h3
                                                class="font-bold text-lg leading-tight truncate"
                                                title={device.model}
                                            >
                                                {device.model}
                                            </h3>
                                        </div>

                                        <div class="flex flex-wrap gap-1">
                                            {#if device.chipset}
                                                <Badge
                                                    variant="outline"
                                                    class="text-[10px]"
                                                    ><Cpu
                                                        class="mr-1 h-2 w-2"
                                                    />
                                                    {device.chipset}</Badge
                                                >
                                            {/if}
                                            {#if device.colors && Array.isArray(device.colors)}
                                                <Badge
                                                    variant="outline"
                                                    class="text-[10px]"
                                                    >{device.colors.length} colors</Badge
                                                >
                                            {/if}
                                        </div>

                                        <div
                                            class="pt-2 flex items-center justify-between"
                                        >
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                class="w-full text-xs"
                                                onclick={() =>
                                                    controller.syncCompatibility(
                                                        device.id,
                                                    )}
                                                disabled={controller.isSyncing}
                                            >
                                                {#if controller.isSyncing}
                                                    <RefreshCw
                                                        class="mr-2 h-3 w-3 animate-spin"
                                                    /> Syncing...
                                                {:else}
                                                    <RefreshCw
                                                        class="mr-2 h-3 w-3"
                                                    /> Sync Compatibility
                                                {/if}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/each}

                <!-- Flat List -->
                {#if group.flat.length > 0}
                    <div
                        class={cn(
                            "grid gap-6",
                            controller.layout === "grid"
                                ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                                : "grid-cols-1",
                        )}
                    >
                        {#each group.flat as device (device.id)}
                            <div
                                class="group relative bg-card rounded-xl border shadow-sm hover:shadow-lg transition-all overflow-hidden"
                                transition:fly={{ y: 20, duration: 300 }}
                            >
                                <!-- Selection Checkbox -->
                                <div class="absolute top-3 left-3 z-10">
                                    <input
                                        type="checkbox"
                                        checked={controller.selectedIds.includes(
                                            device.id,
                                        )}
                                        onchange={() =>
                                            controller.toggleSelect(device.id)}
                                        class="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                </div>

                                <!-- Actions -->
                                <div
                                    class="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1"
                                >
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        class="h-8 w-8 rounded-full shadow-sm"
                                        onclick={() =>
                                            controller.handleEdit(device)}
                                    >
                                        <Edit class="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="destructive"
                                        class="h-8 w-8 rounded-full shadow-sm"
                                        onclick={() =>
                                            controller.handleDelete(device.id)}
                                    >
                                        <Trash2 class="h-3.5 w-3.5" />
                                    </Button>
                                </div>

                                <div
                                    class="aspect-[4/3] bg-muted/30 relative flex items-center justify-center p-4"
                                >
                                    {#if device.image}
                                        <img
                                            src={device.image}
                                            alt={device.model}
                                            class="w-full h-full object-contain mix-blend-multiply"
                                        />
                                    {:else}
                                        <Smartphone
                                            class="h-12 w-12 text-muted-foreground/20"
                                        />
                                    {/if}
                                    <Badge
                                        variant="secondary"
                                        class="absolute bottom-2 right-2 text-[10px]"
                                        >{device.code || "NO CODE"}</Badge
                                    >
                                </div>

                                <div class="p-4 space-y-2">
                                    <div>
                                        <div
                                            class="text-xs text-muted-foreground font-medium uppercase tracking-wider"
                                        >
                                            {device.brand}
                                        </div>
                                        <h3
                                            class="font-bold text-lg leading-tight truncate"
                                            title={device.model}
                                        >
                                            {device.model}
                                        </h3>
                                    </div>

                                    <div class="flex flex-wrap gap-1">
                                        {#if device.chipset}
                                            <Badge
                                                variant="outline"
                                                class="text-[10px]"
                                                ><Cpu class="mr-1 h-2 w-2" />
                                                {device.chipset}</Badge
                                            >
                                        {/if}
                                        {#if device.colors && Array.isArray(device.colors)}
                                            <Badge
                                                variant="outline"
                                                class="text-[10px]"
                                                >{device.colors.length} colors</Badge
                                            >
                                        {/if}
                                    </div>

                                    <div
                                        class="pt-2 flex items-center justify-between"
                                    >
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            class="w-full text-xs"
                                            onclick={() =>
                                                controller.syncCompatibility(
                                                    device.id,
                                                )}
                                            disabled={controller.isSyncing}
                                        >
                                            {#if controller.isSyncing}
                                                <RefreshCw
                                                    class="mr-2 h-3 w-3 animate-spin"
                                                /> Syncing...
                                            {:else}
                                                <RefreshCw
                                                    class="mr-2 h-3 w-3"
                                                /> Sync Compatibility
                                            {/if}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}

                <Separator class="my-6" />
            </div>
        {/each}
    {/if}

    <DeviceForm {controller} />

    <!-- Delete Confirmation -->
    <AlertDialog.Root bind:open={controller.openDelete}>
        <AlertDialog.Content>
            <AlertDialog.Header>
                <AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
                <AlertDialog.Description>
                    This action cannot be undone. This will permanently delete
                    the device and remove its data from our servers.
                </AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Footer>
                <AlertDialog.Cancel
                    onclick={() => {
                        controller.openDelete = false;
                        controller.deletingId = null;
                    }}>Cancel</AlertDialog.Cancel
                >
                <AlertDialog.Action onclick={() => controller.confirmDelete()}
                    >Continue</AlertDialog.Action
                >
            </AlertDialog.Footer>
        </AlertDialog.Content>
    </AlertDialog.Root>

    <AlertDialog.Root bind:open={controller.openBulkDelete}>
        <AlertDialog.Content>
            <AlertDialog.Header>
                <AlertDialog.Title
                    >Delete {controller.selectedIds.length} Devices?</AlertDialog.Title
                >
                <AlertDialog.Description>
                    This action cannot be undone.
                </AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Footer>
                <AlertDialog.Cancel
                    onclick={() => (controller.openBulkDelete = false)}
                    >Cancel</AlertDialog.Cancel
                >
                <AlertDialog.Action
                    onclick={() => controller.handleBulkDelete()}
                    >Delete All</AlertDialog.Action
                >
            </AlertDialog.Footer>
        </AlertDialog.Content>
    </AlertDialog.Root>
</div>
