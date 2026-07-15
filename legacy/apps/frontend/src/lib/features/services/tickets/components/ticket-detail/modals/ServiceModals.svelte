<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import * as AlertDialog from "$lib/shared/components/ui/alert-dialog";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
    } from "$lib/shared/components/ui/dialog";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/shared/components/ui/select";
    import { Textarea } from "$lib/shared/components/ui/textarea";
    import { Loader2, Play } from "lucide-svelte";
    import CurrencyInput from "$lib/shared/components/custom/currency-input.svelte";
    import DateTimePicker from "$lib/shared/components/custom/date-time-picker.svelte";
    import type { TicketDetailController } from "../../../ticket-detail.controller.svelte";

    let { controller }: { controller: TicketDetailController } = $props();

    let SvcCompletionWizard: any = $state();
    let SvcPickupWizard: any = $state();
    let SvcNotePrint: any = $state();

    $effect(() => {
        if (controller.showCompletionModal && !SvcCompletionWizard) {
            import("../../wizards/ServiceCompletionWizard.svelte").then(
                (m) => (SvcCompletionWizard = m.default),
            );
        }
        if (controller.showPickupWizard && !SvcPickupWizard) {
            import("../../wizards/ServicePickupWizard.svelte").then(
                (m) => (SvcPickupWizard = m.default),
            );
        }
        if (controller.showPrintPreview && !SvcNotePrint) {
            import("../../print/ServiceNotePrint.svelte").then(
                (m) => (SvcNotePrint = m.default),
            );
        }
    });
</script>

<!-- Modals -->

<!-- Diagnosis Modal -->
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
            <div class="space-y-2">
                <Label>Diagnosa Awal</Label>
                <Input
                    placeholder="Contoh: LCD Pecah, Baterai drop"
                    bind:value={controller.diagnosisInput.initial}
                />
            </div>
            <div class="space-y-2">
                <Label>Kemungkinan Penyebab / Kerusakan</Label>
                <Textarea
                    placeholder="Jelaskan detail kerusakan..."
                    bind:value={controller.diagnosisInput.possibleCauses}
                />
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                    <Label>Estimasi Biaya</Label>
                    <CurrencyInput
                        bind:value={controller.diagnosisInput.costEstimate}
                    />
                </div>
                <div class="space-y-2">
                    <Label>Estimasi Selesai</Label>
                    <DateTimePicker
                        bind:value={
                            controller.diagnosisInput.estimatedCompletion
                        }
                    />
                </div>
            </div>
        </div>
        <DialogFooter>
            <Button
                variant="outline"
                onclick={() => (controller.showDiagnosisModal = false)}
                >Batal</Button
            >
            <Button onclick={() => controller.submitDiagnosis()}
                >Simpan & Konfirmasi</Button
            >
        </DialogFooter>
    </DialogContent>
</Dialog>

<!-- Completion Wizard -->
{#if SvcCompletionWizard}
    <SvcCompletionWizard
        bind:open={controller.showCompletionModal}
        serviceId={controller.serviceId}
        serviceNo={controller.serviceOrder?.no || ""}
        initialQC={null}
        costEstimate={controller.completionInput.actualCost}
        diagnosis={controller.serviceOrder?.diagnosis &&
        typeof controller.serviceOrder.diagnosis === "string" &&
        !controller.serviceOrder.diagnosis.startsWith("{")
            ? controller.serviceOrder.diagnosis
            : ""}
        onComplete={() => {
            controller.showCompletionModal = false;
            controller.loadData();
        }}
        onClose={() => (controller.showCompletionModal = false)}
    />
{/if}

<!-- Assign Technician Modal -->
<Dialog
    open={controller.showAssignModal}
    onOpenChange={(v) => (controller.showAssignModal = v)}
>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Assign Teknisi</DialogTitle>
            <DialogDescription
                >Pilih teknisi yang akan mengerjakan service ini.</DialogDescription
            >
        </DialogHeader>
        <div class="space-y-4 py-4">
            <div class="space-y-2">
                <Label>Teknisi</Label>
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
        </div>
        <DialogFooter>
            <Button
                variant="outline"
                onclick={() => (controller.showAssignModal = false)}
                >Batal</Button
            >
            <Button
                onclick={() => controller.handleAssignTechnician()}
                class="bg-blue-600 hover:bg-blue-700"
            >
                Simpan & Assign
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>

<!-- Parts Modal -->
<Dialog
    open={controller.showPartsModal}
    onOpenChange={(v) => (controller.showPartsModal = v)}
>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Tambah Sparepart</DialogTitle>
        </DialogHeader>
        <div class="space-y-4 py-4">
            <div class="space-y-2">
                <Label>Nama Part</Label>
                <Input
                    placeholder="Contoh: LCD Samsung A50"
                    bind:value={controller.newPart.name}
                />
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                    <Label>Sumber</Label>
                    <Select
                        type="single"
                        bind:value={controller.newPart.source}
                    >
                        <SelectTrigger>
                            {controller.newPart.source === "stok"
                                ? "Stok Toko"
                                : controller.newPart.source === "beli"
                                  ? "Beli Baru"
                                  : "Pilih Sumber"}
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="stok">Stok Toko</SelectItem>
                            <SelectItem value="beli">Beli Baru</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div class="space-y-2">
                    <Label>Qty</Label>
                    <Input
                        type="number"
                        min="1"
                        bind:value={controller.newPart.qty}
                    />
                </div>
            </div>
            <div class="space-y-2">
                <Label>Harga Satuan</Label>
                <CurrencyInput bind:value={controller.newPart.price} />
            </div>
        </div>
        <DialogFooter>
            <Button
                variant="outline"
                onclick={() => (controller.showPartsModal = false)}
                >Batal</Button
            >
            <Button onclick={() => controller.addPart()}>Tambah Part</Button>
        </DialogFooter>
    </DialogContent>
</Dialog>

<!-- Reconfirm Modal -->
<Dialog
    open={controller.showReconfirmModal}
    onOpenChange={(v) => (controller.showReconfirmModal = v)}
>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Re-konfirmasi ke Customer</DialogTitle>
            <DialogDescription
                >Update harga/estimasi dan minta persetujuan ulang customer.</DialogDescription
            >
        </DialogHeader>
        <div class="space-y-4 py-4">
            <div class="space-y-2">
                <Label>Biaya Baru (Total)</Label>
                <CurrencyInput bind:value={controller.reconfirmInput.cost} />
                <p class="text-xs text-muted-foreground">
                    Biaya lama: Rp {controller.serviceOrder.costEstimate?.toLocaleString(
                        "id-ID",
                    )}
                </p>
            </div>
            <div class="space-y-2">
                <Label>Alasan / Catatan Tambahan</Label>
                <Textarea
                    placeholder="Contoh: Ternyata IC Power juga kena..."
                    bind:value={controller.reconfirmInput.notes}
                />
            </div>
            <div class="space-y-2">
                <Label>Sparepart Tambahan (Opsional)</Label>
                <Input
                    placeholder="Contoh: IC Power"
                    bind:value={controller.reconfirmInput.replacedComponent}
                />
            </div>
        </div>
        <DialogFooter>
            <Button
                variant="outline"
                onclick={() => (controller.showReconfirmModal = false)}
                >Batal</Button
            >
            <Button onclick={() => controller.submitReconfirm()}
                >Kirim Konfirmasi</Button
            >
        </DialogFooter>
    </DialogContent>
</Dialog>

<!-- Pickup Wizard -->
{#if controller.serviceOrder && SvcPickupWizard}
    <SvcPickupWizard
        bind:open={controller.showPickupWizard}
        serviceId={controller.serviceId}
        serviceNo={controller.serviceOrder?.no || ""}
        customer={controller.serviceOrder.customer}
        device={controller.serviceOrder.device}
        cost={controller.serviceOrder.actualCost ||
            controller.serviceOrder.costEstimate ||
            0}
        serviceStatus={controller.serviceOrder.status}
        onComplete={() => {
            controller.loadData();
        }}
        onClose={() => (controller.showPickupWizard = false)}
    />
{/if}

<!-- Print Preview -->
{#if controller.serviceOrder && SvcNotePrint}
    <SvcNotePrint
        bind:open={controller.showPrintPreview}
        serviceId={controller.serviceId}
        onClose={() => (controller.showPrintPreview = false)}
        serviceOrder={{
            ...controller.serviceOrder,
            technicianName: controller.serviceOrder.technician?.name,
        }}
        mode={controller.printMode}
    />
{/if}

<!-- Cancel Confirm -->
<AlertDialog.Root
    open={controller.showCancelModal}
    onOpenChange={(v) => (controller.showCancelModal = v)}
>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>Batalkan Service?</AlertDialog.Title>
            <AlertDialog.Description>
                Tindakan ini tidak dapat dibatalkan.
            </AlertDialog.Description>
        </AlertDialog.Header>
        <div class="py-2">
            <Label>Alasan Pembatalan</Label>
            <Input
                placeholder="Contoh: Biaya terlalu mahal"
                bind:value={controller.cancelReason}
            />
        </div>
        <AlertDialog.Footer>
            <AlertDialog.Cancel>Batal</AlertDialog.Cancel>
            <AlertDialog.Action
                class="bg-red-600 hover:bg-red-700"
                onclick={() => controller.handleCancel()}
            >
                Ya, Batalkan Service
            </AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>

<!-- Delete Confirm -->
<AlertDialog.Root
    open={controller.showDeleteConfirm}
    onOpenChange={(v) => (controller.showDeleteConfirm = v)}
>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>Hapus Data Service?</AlertDialog.Title>
            <AlertDialog.Description>
                Data yang dihapus tidak dapat dikembalikan.
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel>Batal</AlertDialog.Cancel>
            <Button
                variant="destructive"
                onclick={() => controller.processDelete()}
                disabled={controller.isProcessingAction}
            >
                {#if controller.isProcessingAction}
                    <Loader2 class="h-4 w-4 animate-spin mr-2" />
                {/if}
                Hapus Permanen
            </Button>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>

<!-- Start Work Confirm -->
<AlertDialog.Root
    open={controller.showStartWorkConfirm}
    onOpenChange={(v) => (controller.showStartWorkConfirm = v)}
>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>Mulai Pengerjaan?</AlertDialog.Title>
            <AlertDialog.Description>
                Status akan berubah menjadi <strong>Dikerjakan</strong>.
                Pastikan customer sudah setuju dengan biaya estimasi.
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel>Batal</AlertDialog.Cancel>
            <AlertDialog.Action
                class="bg-blue-600 hover:bg-blue-700"
                onclick={() => controller.processStartWork()}
            >
                <Play class="h-4 w-4 mr-2" /> Mulai Kerjakan
            </AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>

<!-- Complete Confirm -->
<AlertDialog.Root
    open={controller.showCompleteConfirm}
    onOpenChange={(v) => (controller.showCompleteConfirm = v)}
>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>Selesaikan Service?</AlertDialog.Title>
            <AlertDialog.Description>
                Status akan berubah menjadi <strong>Selesai</strong>. Pastikan
                semua pengecekan sudah dilakukan.
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel>Batal</AlertDialog.Cancel>
            <AlertDialog.Action
                class="bg-green-600 hover:bg-green-700"
                onclick={() => controller.processComplete()}
            >
                Ya, Selesai
            </AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>

<!-- Liquidate Confirm -->
<AlertDialog.Root
    open={controller.showLiquidateConfirm}
    onOpenChange={(v) => (controller.showLiquidateConfirm = v)}
>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title
                >Likuidasi Barang {controller.liquidationType === "resell"
                    ? "Jual Kembali"
                    : "Kanibal Part"}?</AlertDialog.Title
            >
            <AlertDialog.Description>
                Barang akan ditandai sebagai diambil oleh Toko. Stok {controller.liquidationType ===
                "resell"
                    ? "Unit Second"
                    : "Sparepart Copotan"} akan bertambah otomatis.
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel>Batal</AlertDialog.Cancel>
            <Button
                onclick={() => controller.processLiquidation()}
                disabled={controller.isProcessingAction}
                class="bg-purple-600 hover:bg-purple-700"
            >
                {#if controller.isProcessingAction}
                    <Loader2 class="h-4 w-4 animate-spin mr-2" />
                {/if}
                Proses Likuidasi
            </Button>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>
