<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { Button } from "$lib/shared/components/ui/button";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/shared/components/ui/table";
    import { Input } from "$lib/shared/components/ui/input";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/shared/components/ui/select";
    import { Badge } from "$lib/shared/components/ui/badge";
    import {
        Search,
        Eye,
        Play,
        UserPlus,
        CheckCircle,
        Package,
        ChevronRight,
        MessageSquare,
        Trash2,
        Plus,
        Filter,
        RefreshCw,
        Archive,
        AlertTriangle,
    } from "lucide-svelte";
    import { goto } from "$app/navigation";
    import { Separator } from "$lib/shared/components/ui/separator";
    import { page } from "$app/stores";
    import { refreshServiceList } from "$lib/features/services/services/event-store.svelte";
    import { cn } from "$lib/shared/lib/utils";
    import { authStore } from "$lib/shared/lib/auth-store.svelte";

    // Modals
    import ReassignTechnicianModal from "./reassign-technician-modal.svelte";
    import BarcodeScannerModal from "./barcode-scanner-modal.svelte";
    import ServiceCompletionWizard from "$lib/features/services/tickets/components/wizards/ServiceCompletionWizard.svelte";
    import ServicePickupWizard from "$lib/features/services/tickets/components/wizards/ServicePickupWizard.svelte";
    import {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogDescription,
        DialogFooter,
    } from "$lib/shared/components/ui/dialog";
    import * as AlertDialog from "$lib/shared/components/ui/alert-dialog";
    import { Label } from "$lib/shared/components/ui/label";
    import { Textarea } from "$lib/shared/components/ui/textarea";
    import CurrencyInput from "$lib/shared/components/custom/currency-input.svelte";
    import { Switch } from "$lib/shared/components/ui/switch";

    import { ServiceController } from "$lib/features/services/service";

    const controller = new ServiceController();
    const urlStatus = $derived($page.url.searchParams.get("status"));

    onMount(() => {
        controller.init(urlStatus);
    });

    $effect(() => {
        if (urlStatus) {
            controller.filterStatus = urlStatus;
            controller.isAllDataView = false;
        } else {
            controller.filterStatus = "all";
            controller.searchQuery = "";
            controller.filterTechnician = "all";
            if (authStore.role === "teknisi") {
                controller.filterTechnician = authStore.user?.id || "all";
            }
            controller.isAllDataView = true;
        }
    });

    $effect(() => {
        if (controller.filterStatus) controller.loadData();
    });

    $effect(() => {
        const _ = refreshServiceList.value;
        controller.loadData();
    });

    function viewServiceDetail(id: number) {
        goto(`/service/${id}`);
    }
</script>

<div class="space-y-6">
    <!-- Dashboard Tiles -->
    <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {#each controller.statusTiles as tile}
            <button
                class={`p-4 rounded-xl border transition-all text-left relative overflow-hidden group hover:shadow-md ${controller.filterStatus === tile.id ? "ring-2 ring-offset-2 " + tile.color.replace("text-", "ring-") : "border-transparent bg-background/60 shadow-sm"}`}
                class:ring-2={controller.filterStatus === tile.id}
                onclick={() => (controller.filterStatus = tile.id)}
            >
                <div class={`absolute inset-0 opacity-20 ${tile.bg}`}></div>
                <div class="relative z-10 flex justify-between items-start">
                    <div
                        class={`p-2 rounded-lg bg-white/50 backdrop-blur shadow-sm ${tile.color}`}
                    >
                        <span class="text-xl leading-none">{tile.icon}</span>
                    </div>
                    <span class={`text-3xl font-black ${tile.color}`}
                        >{tile.count}</span
                    >
                </div>
                <div class="relative z-10 mt-3">
                    <p
                        class="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                    >
                        {tile.label}
                    </p>
                </div>
            </button>
        {/each}
    </div>

    <!-- Main Card -->
    <div class="rounded-xl border bg-card/60 backdrop-blur-sm shadow-sm">
        <div
            class="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b"
        >
            <div class="space-y-1">
                <h2 class="text-xl font-bold tracking-tight">Daftar Service</h2>
                <p class="text-sm text-muted-foreground">
                    Monitor semua aktifitas service di toko anda.
                </p>
            </div>
            <div class="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <Button
                    size="sm"
                    href="/service/new"
                    class="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                >
                    <Plus class="h-4 w-4 mr-2" /> Service Baru
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onclick={() => controller.loadData()}
                    disabled={controller.loading}
                    class="w-full sm:w-auto"
                >
                    <RefreshCw
                        class={`h-3.5 w-3.5 mr-2 ${controller.loading ? "animate-spin" : ""}`}
                    />
                    Refresh
                </Button>
            </div>
        </div>

        <div class="p-6 space-y-6">
            <!-- Filters -->
            <div
                class="flex flex-col sm:flex-row gap-4 bg-muted/40 p-4 rounded-xl border"
            >
                <div class="relative flex-1 md:max-w-md flex gap-2">
                    <div class="relative flex-1">
                        <Search
                            class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                        />
                        <Input
                            type="search"
                            placeholder="Cari Service No, Customer, Device..."
                            class="pl-9 bg-background border-input/60"
                            bind:value={controller.searchQuery}
                            onkeydown={(e) => {
                                if (e.key === "Enter") {
                                    if (
                                        controller.filteredOrders.length === 1
                                    ) {
                                        viewServiceDetail(
                                            controller.filteredOrders[0].id,
                                        );
                                        controller.searchQuery = "";
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
                {#if controller.isAllDataView}
                    <div
                        class="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0"
                    >
                        <Select
                            type="single"
                            name="status"
                            bind:value={controller.filterStatus}
                        >
                            <SelectTrigger
                                class="w-[160px] bg-background border-input/60"
                            >
                                <Filter
                                    class="w-3.5 h-3.5 mr-2 text-muted-foreground"
                                />
                                <span class="truncate"
                                    >{controller.filterStatus === "all"
                                        ? "Semua Status"
                                        : controller.filterStatus}</span
                                >
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem
                                >
                                <SelectItem value="antrian">Antrian</SelectItem>
                                <SelectItem value="dicek"
                                    >Sedang Dicek</SelectItem
                                >
                                <SelectItem value="konfirmasi"
                                    >Konfirmasi</SelectItem
                                >
                                <SelectItem value="dikerjakan"
                                    >Dikerjakan</SelectItem
                                >
                                <SelectItem value="re-konfirmasi"
                                    >Re-konfirmasi</SelectItem
                                >
                                <SelectItem value="selesai">Selesai</SelectItem>
                                <SelectItem value="diambil"
                                    >Sudah Diambil</SelectItem
                                >
                                <SelectItem value="batal">Dibatalkan</SelectItem
                                >
                            </SelectContent>
                        </Select>
                        {#if authStore.role !== "teknisi"}
                            <Select
                                type="single"
                                name="technician"
                                bind:value={controller.filterTechnician}
                            >
                                <SelectTrigger
                                    class="w-[160px] bg-background border-input/60"
                                >
                                    <UserPlus
                                        class="w-3.5 h-3.5 mr-2 text-muted-foreground"
                                    />
                                    <span class="truncate"
                                        >{controller.filterTechnician === "all"
                                            ? "Semua Teknisi"
                                            : controller.filterTechnician ===
                                                "unassigned"
                                              ? "Belum Assign"
                                              : controller.technicians.find(
                                                    (t) =>
                                                        t.id ===
                                                        controller.filterTechnician,
                                                )?.name ||
                                                controller.filterTechnician}</span
                                    >
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all"
                                        >Semua Teknisi</SelectItem
                                    >
                                    <SelectItem value="unassigned"
                                        >Belum Assign</SelectItem
                                    >
                                    {#each controller.technicians as tech}
                                        <SelectItem value={tech.id}
                                            >{tech.name}</SelectItem
                                        >
                                    {/each}
                                </SelectContent>
                            </Select>
                        {/if}
                    </div>
                {/if}

                {#if controller.isAllDataView && controller.settings?.enableVirtualArchive}
                    <div class="flex items-center gap-2 pl-2 border-l ml-2">
                        <div class="flex items-center gap-2">
                            <Switch
                                id="show-archived"
                                bind:checked={controller.showArchived}
                            />
                            <Label
                                for="show-archived"
                                class="text-xs cursor-pointer select-none flex items-center gap-1.5 whitespace-nowrap"
                            >
                                <Archive
                                    class="h-3.5 w-3.5 text-muted-foreground"
                                />
                                {controller.showArchived
                                    ? "Sembunyikan Arsip"
                                    : "Tampilkan Arsip"}
                            </Label>
                        </div>
                    </div>
                {/if}
            </div>

            <!-- Desktop Table -->
            <div
                class="hidden md:block rounded-xl border bg-background/50 overflow-hidden"
            >
                <Table>
                    <TableHeader class="bg-muted/50">
                        <TableRow>
                            <TableHead class="w-[120px]">No. Service</TableHead>
                            <TableHead class="w-[140px]">Tanggal</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Handphone</TableHead>
                            <TableHead>Teknisi</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead class="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {#if controller.loading}
                            <TableRow>
                                <TableCell colspan={7} class="text-center h-32">
                                    <div
                                        class="flex flex-col items-center justify-center gap-2 text-muted-foreground"
                                    >
                                        <span
                                            class="loading loading-spinner loading-sm"
                                        ></span>
                                        Memuat data...
                                    </div>
                                </TableCell>
                            </TableRow>
                        {:else if controller.filteredOrders.length === 0}
                            <TableRow>
                                <TableCell
                                    colspan={7}
                                    class="text-center h-32 text-muted-foreground"
                                >
                                    <div
                                        class="flex flex-col items-center justify-center gap-2 opacity-60"
                                    >
                                        <Package class="h-8 w-8" />
                                        Tidak ada data service ditemukan.
                                    </div>
                                </TableCell>
                            </TableRow>
                        {:else}
                            {#each controller.filteredOrders as order}
                                {@const statusInfo = controller.getStatusBadge(
                                    order.status,
                                )}
                                {@const nextAction = controller.getNextAction(
                                    order.status,
                                    !!order.technician,
                                )}
                                <TableRow
                                    class={cn(
                                        "hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors",
                                        controller.isArchived(order) &&
                                            "bg-slate-50/50 dark:bg-slate-900/50 opacity-75 grayscale-[0.8]",
                                    )}
                                >
                                    <TableCell>
                                        <span
                                            class="font-mono font-bold text-blue-600"
                                            >{order.no}</span
                                        >
                                    </TableCell>
                                    <TableCell class="text-muted-foreground">
                                        {new Date(
                                            order.dateIn,
                                        ).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <div class="flex flex-col">
                                            <span class="font-medium"
                                                >{order.customer.name}</span
                                            >
                                            {#if order.customer.phone}
                                                <span
                                                    class="text-xs text-muted-foreground"
                                                    >{order.customer
                                                        .phone}</span
                                                >
                                            {:else}
                                                <span
                                                    class="text-xs text-orange-500 font-medium flex items-center gap-1"
                                                >
                                                    <AlertTriangle
                                                        class="h-3 w-3"
                                                    /> No Contact
                                                </span>
                                            {/if}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div class="flex flex-col">
                                            <span class="font-medium"
                                                >{order.device.brand}
                                                {order.device.model}</span
                                            >
                                            <span
                                                class="text-xs text-muted-foreground flex gap-1 items-center"
                                                ><span
                                                    class="w-2 h-2 rounded-full bg-slate-200 inline-block"
                                                ></span>
                                                {order.device.color ||
                                                    "No Color"}</span
                                            >
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {#if order.technician}
                                            <div
                                                class="flex items-center gap-2"
                                            >
                                                <div
                                                    class="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold"
                                                >
                                                    {order.technician.name
                                                        .substring(0, 2)
                                                        .toUpperCase()}
                                                </div>
                                                <span class="text-sm"
                                                    >{order.technician
                                                        .name}</span
                                                >
                                            </div>
                                        {:else}
                                            <Badge
                                                variant="outline"
                                                class="text-xs font-normal text-muted-foreground border-dashed"
                                                >Unassigned</Badge
                                            >
                                        {/if}
                                    </TableCell>
                                    <TableCell>
                                        <div
                                            class="flex flex-col gap-1 items-start"
                                        >
                                            {#if controller.isArchived(order)}
                                                <Badge
                                                    variant="secondary"
                                                    class="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 px-1.5 h-5 pointer-events-none"
                                                >
                                                    <Archive
                                                        class="h-3 w-3 mr-1"
                                                    />
                                                    Arsip
                                                </Badge>
                                            {/if}

                                            <Badge
                                                variant={statusInfo.variant as any}
                                                class={`whitespace-nowrap ${statusInfo.className}`}
                                            >
                                                <span class="mr-1.5"
                                                    >{statusInfo.icon}</span
                                                >
                                                {statusInfo.label}
                                            </Badge>
                                        </div></TableCell
                                    >
                                    <TableCell class="text-right">
                                        <div
                                            class="flex items-center justify-end gap-1"
                                        >
                                            {#if nextAction}
                                                <Button
                                                    size="sm"
                                                    class="{nextAction.color} h-8 px-3 text-xs shadow-sm"
                                                    onclick={() =>
                                                        controller.handleQuickAction(
                                                            order,
                                                        )}
                                                    title={nextAction.label}
                                                >
                                                    {@const IconComponent =
                                                        nextAction.icon}
                                                    <IconComponent
                                                        class="h-3.5 w-3.5 mr-1.5"
                                                    />
                                                    {nextAction.label}
                                                </Button>
                                            {/if}
                                            {#if order.status === "dikerjakan" || order.status === "re-konfirmasi"}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    class="h-8 px-2 text-xs text-orange-600 border-orange-200 hover:bg-orange-50"
                                                    onclick={() =>
                                                        controller.openReconfirmModal(
                                                            order,
                                                        )}
                                                    title="Rekonfirmasi"
                                                >
                                                    <MessageSquare
                                                        class="h-3.5 w-3.5"
                                                    />
                                                </Button>
                                            {/if}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                class="h-8 w-8"
                                                onclick={() =>
                                                    viewServiceDetail(order.id)}
                                            >
                                                <Eye
                                                    class="h-4 w-4 text-muted-foreground"
                                                />
                                            </Button>
                                            {#if authStore.role !== "teknisi"}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    class="h-8 w-8 hover:text-red-600 hover:bg-red-50"
                                                    onclick={() =>
                                                        controller.handleDelete(
                                                            order.id,
                                                        )}
                                                    title="Hapus"
                                                >
                                                    <Trash2
                                                        class="h-4 w-4 text-muted-foreground/60"
                                                    />
                                                </Button>
                                            {/if}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            {/each}
                        {/if}
                    </TableBody>
                </Table>
            </div>

            <!-- Mobile Card List -->
            <div class="grid gap-4 md:hidden">
                {#if controller.loading}
                    <div class="text-center p-4">Loading...</div>
                {:else if controller.filteredOrders.length === 0}
                    <div
                        class="text-center p-4 text-muted-foreground border rounded-lg border-dashed"
                    >
                        Tidak ada data service.
                    </div>
                {:else}
                    {#each controller.filteredOrders as order}
                        {@const statusInfo = controller.getStatusBadge(
                            order.status,
                        )}
                        {@const nextAction = controller.getNextAction(
                            order.status,
                            !!order.technician,
                        )}
                        <div
                            class="rounded-xl border p-4 space-y-3 bg-card shadow-sm active:scale-[0.99] transition-transform"
                        >
                            <div class="flex justify-between items-start">
                                <div>
                                    <div
                                        class="font-bold text-blue-600 text-lg"
                                    >
                                        {order.no}
                                    </div>
                                    <div
                                        class="text-xs text-muted-foreground flex items-center gap-1"
                                    >
                                        <div
                                            class="h-1.5 w-1.5 rounded-full bg-muted-foreground"
                                        ></div>
                                        {new Date(
                                            order.dateIn,
                                        ).toLocaleDateString()}
                                    </div>
                                </div>
                                <Badge
                                    variant={statusInfo.variant as any}
                                    class={statusInfo.className}
                                >
                                    {statusInfo.icon}
                                </Badge>
                            </div>

                            <div
                                class="flex gap-2 text-sm bg-muted/30 p-2 rounded-lg"
                            >
                                <span class="font-medium flex-1 truncate"
                                    >{order.device.brand}
                                    {order.device.model}</span
                                >
                                <span
                                    class="text-muted-foreground text-xs border-l pl-2"
                                    >{order.device.color || "-"}</span
                                >
                            </div>

                            <div class="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <span
                                        class="text-muted-foreground block mb-0.5"
                                        >Customer</span
                                    >
                                    <span class="font-medium truncate block"
                                        >{order.customer.name}</span
                                    >
                                    {#if !order.customer.phone}
                                        <span
                                            class="text-[10px] text-orange-500 flex items-center gap-1 mt-0.5"
                                        >
                                            <AlertTriangle class="h-3 w-3" /> Missing
                                            Info
                                        </span>
                                    {/if}
                                </div>
                                <div>
                                    <span
                                        class="text-muted-foreground block mb-0.5"
                                        >Teknisi</span
                                    >
                                    <span class="font-medium truncate block"
                                        >{order.technician?.name ||
                                            "Unassigned"}</span
                                    >
                                </div>
                            </div>

                            <Separator />

                            <div class="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    class="flex-1"
                                    onclick={() => viewServiceDetail(order.id)}
                                >
                                    Detail
                                </Button>
                                {#if nextAction}
                                    <Button
                                        size="sm"
                                        class={`flex-1 ${nextAction.color}`}
                                        onclick={() =>
                                            controller.handleQuickAction(order)}
                                    >
                                        {@const IconComponent = nextAction.icon}
                                        <IconComponent
                                            class="h-3.5 w-3.5 mr-1.5"
                                        />
                                        {nextAction.label}
                                    </Button>
                                {/if}
                            </div>
                        </div>
                    {/each}
                {/if}
            </div>
        </div>
    </div>
</div>

{#if controller.selectedServiceForReassign}
    <ReassignTechnicianModal
        bind:open={controller.showReassignModal}
        serviceId={controller.selectedServiceForReassign.id}
        serviceNo={controller.selectedServiceForReassign.no}
        currentTechnician={controller.selectedServiceForReassign.technician}
        onConfirm={controller.handleReassignConfirm}
    />
{/if}

<BarcodeScannerModal
    open={controller.showScanner}
    onClose={() => (controller.showScanner = false)}
    onScan={(code) => {
        controller.searchQuery = code;
        controller.showScanner = false;
        setTimeout(() => {
            if (controller.filteredOrders.length === 1) {
                viewServiceDetail(controller.filteredOrders[0].id);
            }
        }, 100);
    }}
/>

<Dialog
    open={controller.showAssignModal}
    onOpenChange={(v) => (controller.showAssignModal = v)}
>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Assign Teknisi & Mulai Pengecekan</DialogTitle>
            <DialogDescription>
                {#if controller.selectedOrderForAction}
                    Pilih teknisi untuk service <strong
                        >{controller.selectedOrderForAction.no}</strong
                    >
                {:else}
                    Pilih teknisi yang akan mengerjakan service ini
                {/if}
            </DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-4">
            <div class="space-y-2">
                <Label>Teknisi <span class="text-red-500">*</span></Label>
                <Select
                    type="single"
                    bind:value={controller.selectedTechnicianId}
                >
                    <SelectTrigger class="w-full">
                        {controller.technicians.find(
                            (t) => t.id === controller.selectedTechnicianId,
                        )?.name || "Pilih Teknisi"}
                    </SelectTrigger>
                    <SelectContent>
                        {#each controller.technicians as tech}
                            <SelectItem value={tech.id}>{tech.name}</SelectItem>
                        {/each}
                    </SelectContent>
                </Select>
            </div>
            {#if controller.selectedOrderForAction}
                <div class="p-3 bg-muted rounded-lg text-sm">
                    <p class="text-muted-foreground">
                        Customer: <strong
                            >{controller.selectedOrderForAction.customer
                                ?.name}</strong
                        >
                    </p>
                    <p class="text-muted-foreground">
                        Device: <strong
                            >{controller.selectedOrderForAction.device?.brand}
                            {controller.selectedOrderForAction.device
                                ?.model}</strong
                        >
                    </p>
                </div>
            {/if}
        </div>
        <DialogFooter>
            <Button
                variant="outline"
                onclick={() => {
                    controller.showAssignModal = false;
                    controller.selectedOrderForAction = null;
                }}>Batal</Button
            >
            <Button
                onclick={async () => await controller.handleAssignAndStart()}
                class="bg-blue-600 hover:bg-blue-700"
            >
                <Play class="mr-2 h-4 w-4" /> Assign & Mulai Cek
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>

{#if controller.selectedOrderForAction}
    <ServicePickupWizard
        bind:open={controller.showPickupModal}
        serviceId={controller.selectedOrderForAction.id}
        serviceNo={controller.selectedOrderForAction.no || ""}
        customer={controller.selectedOrderForAction.customer}
        device={controller.selectedOrderForAction.device}
        cost={controller.selectedOrderForAction.actualCost ||
            controller.selectedOrderForAction.costEstimate ||
            0}
        serviceStatus={controller.selectedOrderForAction.status}
        onComplete={() => {
            refreshServiceList.update((n) => n + 1);
            controller.loadData();
            controller.selectedOrderForAction = null;
        }}
        onClose={() => {
            controller.showPickupModal = false;
            controller.selectedOrderForAction = null;
        }}
    />
{/if}

<Dialog
    open={controller.showDiagnosisModal}
    onOpenChange={(v) => (controller.showDiagnosisModal = v)}
>
    <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
            <DialogTitle>Input Hasil Diagnosa</DialogTitle>
            <DialogDescription
                >Input hasil pengecekan dan estimasi biaya untuk dikonfirmasi ke
                customer.</DialogDescription
            >
        </DialogHeader>
        <div class="space-y-4 py-4">
            {#if controller.selectedOrderForAction}
                <div
                    class="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm space-y-1"
                >
                    <div class="flex justify-between">
                        <span class="font-semibold text-blue-800"
                            >Service #{controller.selectedOrderForAction
                                .no}</span
                        >
                        <Badge variant="outline"
                            >{controller.selectedOrderForAction.status}</Badge
                        >
                    </div>
                    <div class="text-blue-700">
                        <p>
                            <strong>Device:</strong>
                            {controller.selectedOrderForAction.device?.brand}
                            {controller.selectedOrderForAction.device?.model}
                        </p>
                        <p>
                            <strong>IMEI:</strong>
                            {controller.selectedOrderForAction.device?.imei ||
                                "-"}
                        </p>
                        <p>
                            <strong>Keluhan:</strong>
                            {controller.selectedOrderForAction.complaint}
                        </p>
                        <p>
                            <strong>Customer:</strong>
                            {controller.selectedOrderForAction.customer?.name}
                        </p>
                    </div>
                </div>
            {/if}
            <div class="space-y-2">
                <Label
                    >Kondisi Fisik / Teknis (Ampere Meter, dll) <span
                        class="text-red-500">*</span
                    ></Label
                >
                <Textarea
                    bind:value={controller.diagnosisNotes}
                    placeholder="Contoh: Konsumsi arus 1A, tidak ada arus, fisik mulus..."
                    rows={2}
                />
            </div>
            <div class="space-y-2">
                <Label>Kemungkinan Kerusakan</Label>
                <Textarea
                    bind:value={controller.diagnosisPossibleCauses}
                    placeholder="Contoh: IC Power, CPU, Baterai..."
                    rows={2}
                />
            </div>
            <div class="space-y-2">
                <Label
                    >Estimasi Biaya (Rp) <span class="text-red-500">*</span
                    ></Label
                >
                <CurrencyInput
                    bind:value={controller.diagnosisCostEstimate}
                    class="w-full"
                />
            </div>
        </div>
        <DialogFooter>
            <Button
                variant="outline"
                onclick={() => {
                    controller.showDiagnosisModal = false;
                    controller.selectedOrderForAction = null;
                }}>Batal</Button
            >
            <Button
                onclick={async () => await controller.handleSubmitDiagnosis()}
                class="bg-yellow-600 hover:bg-yellow-700"
            >
                <ChevronRight class="mr-2 h-4 w-4" /> Simpan & Konfirmasi
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>

{#if controller.selectedOrderForAction}
    <ServiceCompletionWizard
        bind:open={controller.showCompletionModal}
        serviceId={controller.selectedOrderForAction.id}
        serviceNo={controller.selectedOrderForAction.no || ""}
        initialQC={controller.selectedOrderForAction.phone?.initialQC}
        costEstimate={controller.selectedOrderForAction.actualCost ||
            controller.selectedOrderForAction.costEstimate}
        customer={controller.selectedOrderForAction.customer}
        device={controller.selectedOrderForAction.device}
        complaint={controller.selectedOrderForAction.complaint}
        diagnosis={controller.selectedOrderForAction.diagnosis}
        onComplete={() => {
            refreshServiceList.update((n) => n + 1);
            controller.loadData();
            controller.selectedOrderForAction = null;
        }}
        onClose={() => {
            controller.showCompletionModal = false;
            controller.selectedOrderForAction = null;
        }}
    />
{/if}

<Dialog
    open={controller.showReconfirmModal}
    onOpenChange={(v) => (controller.showReconfirmModal = v)}
>
    <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
            <DialogTitle>Rekonfirmasi ke Customer</DialogTitle>
            <DialogDescription
                >Kirim ulang konfirmasi ke customer jika ada perubahan atau
                masalah baru.</DialogDescription
            >
        </DialogHeader>
        <div class="space-y-4 py-4">
            {#if controller.selectedOrderForAction}
                <div
                    class="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm space-y-1"
                >
                    <div class="flex justify-between">
                        <span class="font-semibold text-orange-800"
                            >Service #{controller.selectedOrderForAction
                                .no}</span
                        >
                        <Badge variant="outline"
                            >{controller.selectedOrderForAction.status}</Badge
                        >
                    </div>
                    <div class="text-orange-700">
                        <p>
                            <strong>Device:</strong>
                            {controller.selectedOrderForAction.device?.brand}
                            {controller.selectedOrderForAction.device?.model}
                        </p>
                        <p>
                            <strong>IMEI:</strong>
                            {controller.selectedOrderForAction.device?.imei ||
                                "-"}
                        </p>
                        <p>
                            <strong>Keluhan:</strong>
                            {controller.selectedOrderForAction.complaint}
                        </p>
                        <p>
                            <strong>Customer:</strong>
                            {controller.selectedOrderForAction.customer?.name}
                        </p>
                    </div>
                </div>
            {/if}
            <div class="space-y-2">
                <Label
                    >Alasan Rekonfirmasi <span class="text-red-500">*</span
                    ></Label
                >
                <Textarea
                    bind:value={controller.reconfirmInput.notes}
                    placeholder="Jelaskan alasan perlu rekonfirmasi ulang ke customer..."
                    rows={2}
                />
            </div>
            <div class="space-y-2">
                <Label>Komponen yang Diganti (Opsional)</Label>
                <Input
                    bind:value={controller.reconfirmInput.replacedComponent}
                    placeholder="Contoh: IC Power, Baterai, dll"
                />
            </div>
            <div class="space-y-2">
                <Label>Estimasi Biaya Baru</Label>
                <CurrencyInput
                    bind:value={controller.reconfirmInput.cost}
                    class="w-full"
                />
            </div>
        </div>
        <DialogFooter>
            <Button
                variant="outline"
                onclick={() => {
                    controller.showReconfirmModal = false;
                    controller.selectedOrderForAction = null;
                }}>Batal</Button
            >
            <Button
                onclick={async () => await controller.handleSubmitReconfirm()}
                class="bg-orange-600 hover:bg-orange-700"
            >
                <MessageSquare class="mr-2 h-4 w-4" /> Kirim Rekonfirmasi
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>

<AlertDialog.Root bind:open={controller.showConfirmDialog}>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title
                >{controller.confirmDialogConfig.title}</AlertDialog.Title
            >
            <AlertDialog.Description
                >{controller.confirmDialogConfig
                    .description}</AlertDialog.Description
            >
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel>Batal</AlertDialog.Cancel>
            <AlertDialog.Action
                class={controller.confirmDialogConfig.variant === "destructive"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-primary hover:bg-primary/90"}
                onclick={async () => {
                    controller.isProcessingAction = true;
                    try {
                        await controller.confirmDialogConfig.action();
                    } finally {
                        controller.isProcessingAction = false;
                        controller.showConfirmDialog = false;
                    }
                }}
                disabled={controller.isProcessingAction}
            >
                {#if controller.isProcessingAction}Processing...{:else}{controller
                        .confirmDialogConfig.actionLabel}{/if}
            </AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>
