<script lang="ts">
    import { Badge } from "$lib/shared/components/ui/badge";
    import { Button } from "$lib/shared/components/ui/button";
    import { Wrench, Plus, CheckCircle, Package } from "lucide-svelte";
    import {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogDescription,
        DialogFooter,
    } from "$lib/shared/components/ui/dialog";
    import { Label } from "$lib/shared/components/ui/label";
    import { Input } from "$lib/shared/components/ui/input";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/shared/components/ui/select";
    import type { TicketDetailController } from "../../../ticket-detail.controller.svelte";
    import { ServiceService } from "$lib/features/services/services/service.service";
    import { toast } from "svelte-sonner";
    import { onMount } from "svelte";

    let { controller }: { controller: TicketDetailController } = $props();

    let serviceTypes = $state<any[]>([]);
    let showAddItemModal = $state(false);
    let showAddPartModal = $state(false);
    let currentItemId = $state<string | null>(null);

    // Form states
    let newItem = $state({
        serviceTypeId: "",
        description: "",
        estimatedCost: 0,
        technicianId: "",
    });

    let newPart = $state({
        source: "stok",
        name: "", // used for external or searching
        variantBatchId: "",
        quantity: 1,
        sellingPrice: 0,
        buyPrice: 0,
    });

    onMount(async () => {
        try {
            serviceTypes = await ServiceService.getServiceTypes();
        } catch (e) {
            console.error(e);
        }
    });

    async function handleAddItem() {
        if (!newItem.serviceTypeId) return toast.error("Pilih tipe service");
        if (!newItem.technicianId && !controller.currentUser?.id)
            return toast.error("Teknisi harus diisi");

        try {
            await ServiceService.createServiceItem({
                serviceId: controller.serviceId,
                serviceTypeId: newItem.serviceTypeId,
                technicianId:
                    newItem.technicianId || controller.currentUser?.id,
                description: newItem.description,
                estimatedCost: newItem.estimatedCost,
                status: "PENDING",
            });
            toast.success("Item service ditambahkan");
            showAddItemModal = false;
            controller.loadData();
        } catch (e) {
            toast.error("Gagal menambahkan item service");
        }
    }

    async function handleAddPart() {
        if (!currentItemId) return;
        if (newPart.quantity <= 0)
            return toast.error("Quantity harus lebih dari 0");

        try {
            await ServiceService.createServicePart(currentItemId, {
                variantBatchId:
                    newPart.source === "stok"
                        ? newPart.variantBatchId
                        : undefined,
                quantity: newPart.quantity,
                sellingPrice: newPart.sellingPrice,
                notes: newPart.source !== "stok" ? newPart.name : undefined,
            });
            toast.success("Sparepart ditambahkan");
            showAddPartModal = false;
            controller.loadData();
        } catch (e) {
            toast.error("Gagal menambahkan sparepart");
        }
    }

    async function handleCompleteItem(itemId: string) {
        try {
            await ServiceService.completeServiceItem(itemId);
            toast.success("Item service diselesaikan");
            controller.loadData();
        } catch (e) {
            toast.error("Gagal menyelesaikan item service");
        }
    }
</script>

<div class="bg-card rounded-[2rem] shadow-lg border-2 border-slate-100 p-8">
    <div class="flex justify-between items-center mb-6">
        <h3 class="font-bold text-xl flex items-center gap-3">
            <div class="p-2 bg-slate-100 rounded-xl">
                <Wrench class="h-6 w-6 text-slate-500" />
            </div>
            Daftar Pekerjaan & Sparepart
        </h3>

        {#if !controller.isReadOnly}
            <Button size="sm" onclick={() => (showAddItemModal = true)}>
                <Plus class="h-4 w-4 mr-2" /> Tambah Pekerjaan
            </Button>
        {/if}
    </div>

    <div class="space-y-4">
        {#if !controller.serviceOrder?.items?.length}
            <div
                class="p-8 text-center text-slate-400 border-2 border-dashed rounded-2xl"
            >
                Belum ada pekerjaan service yang ditambahkan.
            </div>
        {:else}
            {#each controller.serviceOrder.items as item}
                <div
                    class="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50"
                >
                    <div
                        class="flex justify-between items-center p-4 bg-white border-b"
                    >
                        <div class="flex items-center gap-3">
                            <div>
                                <h4 class="font-bold text-slate-800">
                                    {item.serviceType?.name || "Service Umum"}
                                </h4>
                                <p class="text-xs text-slate-500">
                                    {item.description}
                                </p>
                            </div>
                            <Badge variant="secondary" class="ml-2">
                                {item.status}
                            </Badge>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="font-black text-blue-600"
                                >Rp {(
                                    item.actualCost ||
                                    item.estimatedCost ||
                                    0
                                ).toLocaleString("id-ID")}</span
                            >
                            {#if !controller.isReadOnly && item.status !== "COMPLETED"}
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onclick={() => {
                                        currentItemId = item.id;
                                        showAddPartModal = true;
                                    }}
                                >
                                    <Package class="h-4 w-4 mr-2" /> + Part
                                </Button>
                                <Button
                                    size="sm"
                                    class="bg-green-600 hover:bg-green-700 text-white"
                                    onclick={() => handleCompleteItem(item.id)}
                                >
                                    <CheckCircle class="h-4 w-4" />
                                </Button>
                            {/if}
                        </div>
                    </div>

                    {#if item.parts?.length}
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="border-b bg-slate-100/50">
                                    <th
                                        class="text-left py-2 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400"
                                        >Nama Part</th
                                    >
                                    <th
                                        class="text-center py-2 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400"
                                        >Qty</th
                                    >
                                    <th
                                        class="text-right py-2 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400"
                                        >Harga</th
                                    >
                                </tr>
                            </thead>
                            <tbody>
                                {#each item.parts as part}
                                    <tr
                                        class="border-b border-slate-100 last:border-none hover:bg-white transition-colors"
                                    >
                                        <td
                                            class="py-2 px-6 font-medium text-slate-700"
                                        >
                                            {part.variantBatchId
                                                ? "Part Stok"
                                                : part.notes ||
                                                  "Part Eksternal"}
                                        </td>
                                        <td
                                            class="py-2 px-6 text-center font-mono font-bold text-slate-400"
                                            >{part.quantity}x</td
                                        >
                                        <td
                                            class="py-2 px-6 text-right font-bold text-slate-800"
                                        >
                                            Rp {(
                                                part.sellingPrice *
                                                part.quantity
                                            ).toLocaleString("id-ID")}
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    {/if}
                </div>
            {/each}
        {/if}
    </div>
</div>

<Dialog bind:open={showAddItemModal}>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Tambah Pekerjaan Service</DialogTitle>
        </DialogHeader>
        <div class="space-y-4 py-4">
            <div class="space-y-2">
                <Label>Tipe Service</Label>
                <select
                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                    bind:value={newItem.serviceTypeId}
                >
                    <option value="" disabled selected
                        >Pilih Tipe Service</option
                    >
                    {#each serviceTypes as type}
                        <option value={type.id}>{type.name}</option>
                    {/each}
                </select>
            </div>
            <div class="space-y-2">
                <Label>Deskripsi / Keluhan Spesifik</Label>
                <Input
                    bind:value={newItem.description}
                    placeholder="Mati total, IC Power, dll"
                />
            </div>
            <div class="space-y-2">
                <Label>Estimasi Biaya Jasa (Rp)</Label>
                <Input type="number" bind:value={newItem.estimatedCost} />
            </div>
            <div class="space-y-2">
                <Label>Teknisi</Label>
                <select
                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                    bind:value={newItem.technicianId}
                >
                    <option value="" disabled selected>Pilih Teknisi</option>
                    {#each controller.technicians as tech}
                        <option value={tech.id}>{tech.name}</option>
                    {/each}
                </select>
            </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onclick={() => (showAddItemModal = false)}
                >Batal</Button
            >
            <Button onclick={handleAddItem}>Simpan Pekerjaan</Button>
        </DialogFooter>
    </DialogContent>
</Dialog>

<Dialog bind:open={showAddPartModal}>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Tambah Sparepart</DialogTitle>
            <DialogDescription
                >Tambahkan part yang digunakan untuk pekerjaan ini.</DialogDescription
            >
        </DialogHeader>
        <div class="space-y-4 py-4">
            <div class="space-y-2">
                <Label>Sumber Part</Label>
                <select
                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                    bind:value={newPart.source}
                >
                    <option value="stok">Dari Stok Inventory</option>
                    <option value="external">Part External / Beli Luar</option>
                </select>
            </div>

            {#if newPart.source === "external"}
                <div class="space-y-2">
                    <Label>Nama Part</Label>
                    <Input
                        bind:value={newPart.name}
                        placeholder="Nama part external"
                    />
                </div>
            {/if}

            <!-- In a full implementation, we'd have an Inventory Selector here for stok source. -->
            {#if newPart.source === "stok"}
                <div class="p-4 bg-amber-50 rounded-lg text-amber-800 text-sm">
                    Fitur pencarian inventori akan menyusul. Untuk saat ini,
                    ganti ke "Part External" untuk input manual.
                </div>
            {/if}

            <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                    <Label>Qty</Label>
                    <Input
                        type="number"
                        bind:value={newPart.quantity}
                        min="1"
                    />
                </div>
                <div class="space-y-2">
                    <Label>Harga Jual (Rp/Pcs)</Label>
                    <Input type="number" bind:value={newPart.sellingPrice} />
                </div>
            </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onclick={() => (showAddPartModal = false)}
                >Batal</Button
            >
            <Button onclick={handleAddPart} disabled={newPart.source === "stok"}
                >Simpan Part</Button
            >
        </DialogFooter>
    </DialogContent>
</Dialog>
