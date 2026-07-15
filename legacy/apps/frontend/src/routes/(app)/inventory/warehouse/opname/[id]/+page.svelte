<script lang="ts">
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import { Button } from "$lib/shared/components/ui/button";
    import { Card } from "$lib/shared/components/ui/card";
    import * as Table from "$lib/shared/components/ui/table";
    import { Badge } from "$lib/shared/components/ui/badge";
    import { Input } from "$lib/shared/components/ui/input";
    import { formatDate } from "$lib/shared/lib/utils";
    import {
        Check,
        X,
        Save,
        AlertTriangle,
        ChevronLeft,
        Printer,
        CheckCircle2,
        Loader2,
        Search,
    } from "lucide-svelte";
    import { OpnameDetailController } from "$lib/features/inventory/opname/opname-detail.controller.svelte";

    const sessionId = $page.params.id ?? "";
    const controller = new OpnameDetailController(sessionId);

    onMount(() => {
        controller.fetchSession();
    });
</script>

<div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
            <Button
                variant="outline"
                size="icon"
                onclick={() => controller.handleBack()}
            >
                <ChevronLeft class="h-4 w-4" />
            </Button>
            <div>
                <div class="flex items-center gap-2">
                    <h1 class="text-3xl font-bold tracking-tight">
                        Session Detail
                    </h1>
                    {#if controller.session}
                        <Badge
                            variant={controller.session.status === "completed"
                                ? "default"
                                : controller.session.status === "draft"
                                  ? "secondary"
                                  : "destructive"}
                            class="capitalize"
                        >
                            {controller.session.status}
                        </Badge>
                    {/if}
                </div>
                <p class="text-muted-foreground font-mono text-xs">
                    {sessionId}
                </p>
            </div>
        </div>
        <div class="flex items-center gap-2">
            {#if controller.isDraft}
                <Button
                    variant="outline"
                    onclick={() => controller.handleCancel()}
                    disabled={controller.isSaving}>Batal</Button
                >
                <Button
                    variant="default"
                    onclick={() => controller.handleFinalize()}
                    disabled={controller.isSaving}
                >
                    {#if controller.isSaving}
                        <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                    {/if}
                    Selesaikan & Update Stok
                </Button>
            {/if}
            <Button variant="outline" onclick={() => controller.handlePrint()}>
                <Printer class="mr-2 h-4 w-4" />
                Cetak Laporan
            </Button>
        </div>
    </div>

    {#if controller.isLoading}
        <div class="h-64 flex items-center justify-center">
            <Loader2 class="h-8 w-8 animate-spin text-primary" />
        </div>
    {:else if controller.session}
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card class="p-4 space-y-4">
                <h3
                    class="font-semibold text-sm text-muted-foreground uppercase tracking-wider"
                >
                    Info Sesi
                </h3>
                <div class="space-y-2">
                    <div class="flex justify-between text-sm">
                        <span class="text-muted-foreground">Dibuat Oleh:</span>
                        <span class="font-medium"
                            >{controller.session.user?.name}</span
                        >
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-muted-foreground">Kapan:</span>
                        <span class="font-medium"
                            >{formatDate(controller.session.createdAt)}</span
                        >
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-muted-foreground">Status:</span>
                        <span class="font-medium capitalize"
                            >{controller.session.status}</span
                        >
                    </div>
                </div>
            </Card>

            <Card class="p-4 space-y-4">
                <h3
                    class="font-semibold text-sm text-muted-foreground uppercase tracking-wider"
                >
                    Statistik
                </h3>
                <div class="space-y-2">
                    <div class="flex justify-between text-sm">
                        <span class="text-muted-foreground">Total Item:</span>
                        <span class="font-medium"
                            >{controller.totalItemsCount}</span
                        >
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-muted-foreground"
                            >Item Terhitung:</span
                        >
                        <span class="font-medium"
                            >{controller.countedItemsCount}</span
                        >
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-muted-foreground"
                            >Akumulasi Selisih:</span
                        >
                        <span
                            class="font-medium"
                            class:text-destructive={controller.totalDifference !==
                                0}
                        >
                            {controller.totalDifference}
                        </span>
                    </div>
                </div>
            </Card>

            <Card class="p-4 md:col-span-2 space-y-4">
                <h3
                    class="font-semibold text-sm text-muted-foreground uppercase tracking-wider"
                >
                    Catatan Sesi
                </h3>
                <p class="text-sm italic">
                    {controller.session.notes || "Tidak ada catatan."}
                </p>
            </Card>
        </div>

        <Card class="p-0 overflow-hidden">
            <div class="p-4 bg-muted/30 border-b flex items-center gap-4">
                <div class="relative flex-1">
                    <Search
                        class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                    />
                    <Input
                        bind:value={controller.searchTerm}
                        placeholder="Cari produk atau batch ID..."
                        class="pl-9 bg-background"
                    />
                </div>
            </div>
            <Table.Root>
                <Table.Header>
                    <Table.Row>
                        <Table.Head>Produk</Table.Head>
                        <Table.Head>Varian</Table.Head>
                        <Table.Head class="text-center">Stok Sistem</Table.Head>
                        <Table.Head class="text-center">Fisik</Table.Head>
                        <Table.Head class="text-center">Selisih</Table.Head>
                        <Table.Head>Keterangan</Table.Head>
                        {#if controller.isDraft}
                            <Table.Head class="text-right">Simpan</Table.Head>
                        {/if}
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {#each controller.filteredItems as item}
                        <Table.Row>
                            <Table.Cell>
                                <div class="font-medium">
                                    {item.product?.name}
                                </div>
                            </Table.Cell>
                            <Table.Cell>
                                <div class="font-medium">
                                    {item.variantName &&
                                    item.variantName !== "Standard"
                                        ? item.variantName
                                        : ""}
                                </div>
                            </Table.Cell>
                            <Table.Cell
                                class="text-center font-semibold text-blue-600"
                            >
                                {item.systemStock}
                            </Table.Cell>
                            <Table.Cell class="w-32">
                                {#if controller.isDraft}
                                    <Input
                                        type="number"
                                        bind:value={item.physicalStock}
                                        class="text-center"
                                        onchange={() =>
                                            controller.updateItemDifference(
                                                item,
                                            )}
                                    />
                                {:else}
                                    <div class="text-center font-bold">
                                        {item.physicalStock ?? "-"}
                                    </div>
                                {/if}
                            </Table.Cell>
                            <Table.Cell class="text-center">
                                {#if item.physicalStock !== null}
                                    <Badge
                                        variant={item.difference === 0
                                            ? "secondary"
                                            : item.difference > 0
                                              ? "default"
                                              : "destructive"}
                                    >
                                        {item.difference > 0
                                            ? `+${item.difference}`
                                            : item.difference}
                                    </Badge>
                                {:else}
                                    <span class="text-muted-foreground">-</span>
                                {/if}
                            </Table.Cell>
                            <Table.Cell>
                                {#if controller.isDraft}
                                    <Input
                                        bind:value={item.adjustmentReason}
                                        placeholder="Alasan..."
                                    />
                                {:else}
                                    <span class="text-sm"
                                        >{item.adjustmentReason || "-"}</span
                                    >
                                {/if}
                            </Table.Cell>
                            {#if controller.isDraft}
                                <Table.Cell class="text-right">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onclick={() =>
                                            controller.updateItem(item)}
                                    >
                                        <Save class="h-4 w-4" />
                                    </Button>
                                </Table.Cell>
                            {/if}
                        </Table.Row>
                    {/each}
                </Table.Body>
            </Table.Root>
        </Card>
    {/if}
</div>
