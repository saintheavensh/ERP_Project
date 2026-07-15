<script lang="ts">
    import { onMount } from "svelte";
    import { OpnameController } from "$lib/features/inventory/opname/opname.controller.svelte";
    import { Button } from "$lib/shared/components/ui/button";
    import { Card } from "$lib/shared/components/ui/card";
    import * as Table from "$lib/shared/components/ui/table";
    import { Badge } from "$lib/shared/components/ui/badge";
    import { Plus, User, ArrowRight, Package } from "lucide-svelte";
    import { Input } from "$lib/shared/components/ui/input";
    import { formatDate } from "$lib/shared/lib/utils";
    import * as Dialog from "$lib/shared/components/ui/dialog";
    import * as Select from "$lib/shared/components/ui/select";
    import { Label } from "$lib/shared/components/ui/label";

    const controller = new OpnameController();

    onMount(() => {
        controller.init();
    });
</script>

<div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-3xl font-bold tracking-tight">Stock Opname</h1>
            <p class="text-muted-foreground">
                Manage and track inventory audit sessions.
            </p>
        </div>
        <Button onclick={() => controller.openCreateDialog()}>
            <Plus class="mr-2 h-4 w-4" />
            Mulai Opname Baru
        </Button>
    </div>

    <Card class="p-0 overflow-hidden">
        <Table.Root>
            <Table.Header>
                <Table.Row>
                    <Table.Head>ID Sesi</Table.Head>
                    <Table.Head>Tanggal Mulai</Table.Head>
                    <Table.Head>Petugas</Table.Head>
                    <Table.Head>Status</Table.Head>
                    <Table.Head>Selesai Pada</Table.Head>
                    <Table.Head>Catatan</Table.Head>
                    <Table.Head class="text-right">Aksi</Table.Head>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {#if controller.isLoading}
                    <Table.Row>
                        <Table.Cell colspan={7} class="text-center py-8">
                            <span class="animate-pulse">Memuat data...</span>
                        </Table.Cell>
                    </Table.Row>
                {:else if controller.sessions.length === 0}
                    <Table.Row>
                        <Table.Cell
                            colspan={7}
                            class="text-center py-12 text-muted-foreground"
                        >
                            <Package
                                class="mx-auto h-12 w-12 opacity-20 mb-4"
                            />
                            Belum ada sesi stock opname.
                        </Table.Cell>
                    </Table.Row>
                {:else}
                    {#each controller.sessions as session}
                        <Table.Row>
                            <Table.Cell class="font-mono text-xs"
                                >{session.id}</Table.Cell
                            >
                            <Table.Cell
                                >{formatDate(session.createdAt)}</Table.Cell
                            >
                            <Table.Cell>
                                <div class="flex items-center gap-2">
                                    <div
                                        class="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center"
                                    >
                                        <User class="h-3 w-3 text-primary" />
                                    </div>
                                    <span class="text-sm"
                                        >{session.user?.name || "Unknown"}</span
                                    >
                                </div>
                            </Table.Cell>
                            <Table.Cell>
                                <Badge
                                    variant={controller.getStatusVariant(
                                        session.status,
                                    )}
                                    class="capitalize"
                                >
                                    {session.status}
                                </Badge>
                            </Table.Cell>
                            <Table.Cell>
                                {session.completedAt
                                    ? formatDate(session.completedAt)
                                    : "-"}
                            </Table.Cell>
                            <Table.Cell class="max-w-xs truncate"
                                >{session.notes || "-"}</Table.Cell
                            >
                            <Table.Cell class="text-right">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onclick={() =>
                                        controller.navigateToSession(
                                            session.id,
                                        )}
                                >
                                    <ArrowRight class="h-4 w-4" />
                                </Button>
                            </Table.Cell>
                        </Table.Row>
                    {/each}
                {/if}
            </Table.Body>
        </Table.Root>
    </Card>

    <Dialog.Root bind:open={controller.isCreateDialogOpen}>
        <Dialog.Content>
            <Dialog.Header>
                <Dialog.Title>Mulai Sesi Stock Opname</Dialog.Title>
                <Dialog.Description>
                    Pilih kategori atau biarkan kosong untuk audit seluruh stok.
                </Dialog.Description>
            </Dialog.Header>
            <div class="space-y-4 py-4">
                <div class="space-y-2">
                    <Label for="category-select"
                        >Kategori Produk (Opsional)</Label
                    >
                    <Select.Root
                        type="single"
                        bind:value={controller.selectedCategoryId}
                    >
                        <Select.Trigger id="category-select">
                            {controller.getSelectedCategoryName()}
                        </Select.Trigger>
                        <Select.Content>
                            <Select.Item value="">Semua Kategori</Select.Item>
                            {#each controller.categories as cat}
                                <Select.Item value={cat.id}
                                    >{cat.name}</Select.Item
                                >
                            {/each}
                        </Select.Content>
                    </Select.Root>
                </div>
                <div class="space-y-2">
                    <Label for="session-note">Catatan Sesi</Label>
                    <Input
                        id="session-note"
                        bind:value={controller.newSessionNote}
                        placeholder="Contoh: Audit Bulanan Gudang B"
                    />
                </div>
            </div>
            <Dialog.Footer>
                <Button
                    variant="outline"
                    onclick={() => controller.closeDialog()}>Batal</Button
                >
                <Button onclick={() => controller.handleCreateSession()}
                    >Mulai Sesi</Button
                >
            </Dialog.Footer>
        </Dialog.Content>
    </Dialog.Root>
</div>
