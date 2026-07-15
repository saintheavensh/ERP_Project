<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import {
        CheckCircle,
        FileText,
        RefreshCw,
        Trash2,
        User,
        Wrench,
        XCircle,
    } from "lucide-svelte";
    import type { TicketDetailController } from "../../ticket-detail.controller.svelte";

    let { controller }: { controller: TicketDetailController } = $props();
</script>

{#if !controller.isReadOnly}
    <div
        class="flex flex-col-reverse md:flex-row gap-3 justify-end bg-card rounded-2xl shadow-sm border p-4 sticky bottom-4 z-10"
    >
        <!-- Cancel -->
        <Button
            variant="outline"
            onclick={() => {
                controller.cancelReason = "";
                controller.showCancelModal = true;
            }}
            class="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
            <XCircle class="mr-2 h-4 w-4" /> Batalkan
        </Button>

        <!-- Workflow Buttons -->
        {#if controller.serviceOrder.status === "antrian"}
            {#if controller.isTeknisi && !controller.serviceOrder.technicianId}
                <Button
                    onclick={() => controller.handleSelfAssign()}
                    class="bg-green-600 hover:bg-green-700"
                >
                    <User class="mr-2 h-4 w-4" /> Ambil Job Ini
                </Button>
            {/if}
            {#if controller.serviceOrder.technicianId}
                <Button
                    onclick={() => controller.updateStatus("dicek")}
                    class="bg-blue-600 hover:bg-blue-700"
                >
                    <CheckCircle class="mr-2 h-4 w-4" /> Mulai Pengecekan
                </Button>
            {:else if controller.isAdmin}
                <p class="text-sm text-amber-600 italic">
                    Assign teknisi terlebih dahulu
                </p>
            {/if}
        {/if}

        {#if controller.serviceOrder.status === "dicek"}
            {#if controller.canEditWorkflow}
                <Button
                    onclick={() => (controller.showDiagnosisModal = true)}
                    class="bg-blue-600 hover:bg-blue-700"
                >
                    <FileText class="mr-2 h-4 w-4" /> Simpan Diagnosa & Konfirmasi
                </Button>
            {/if}
        {:else if controller.serviceOrder.status === "konfirmasi"}
            {#if controller.canEditWorkflow}
                <Button
                    onclick={() => (controller.showStartWorkConfirm = true)}
                    class="bg-purple-600 hover:bg-purple-700"
                >
                    <Wrench class="mr-2 h-4 w-4" /> Mulai Pengerjaan (Customer Setuju)
                </Button>
            {/if}
        {:else if controller.serviceOrder.status === "dikerjakan"}
            {#if controller.canEditWorkflow}
                <Button
                    onclick={() => (controller.showCompletionModal = true)}
                    class="bg-green-600 hover:bg-green-700"
                >
                    <CheckCircle class="mr-2 h-4 w-4" /> Selesai Pengerjaan
                </Button>
                <!-- Only show if reconfirmation hasn't happened yet -->
                {#if (controller.serviceOrder.reconfirmationCount || 0) === 0}
                    <Button
                        variant="outline"
                        onclick={() => {
                            controller.reconfirmInput.cost =
                                controller.serviceOrder.costEstimate || 0;
                            controller.reconfirmInput.notes =
                                controller.serviceOrder.notes || "";
                            controller.showReconfirmModal = true;
                        }}
                        class="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    >
                        <RefreshCw class="mr-2 h-4 w-4" /> Minta Re-konfirmasi
                    </Button>
                {/if}
            {/if}
        {:else if controller.serviceOrder.status === "re-konfirmasi"}
            {#if controller.canProcessPayment}
                <Button
                    onclick={() => controller.updateStatus("dikerjakan")}
                    class="bg-purple-600 hover:bg-purple-700"
                >
                    <CheckCircle class="mr-2 h-4 w-4" /> Setuju & Lanjutkan
                </Button>
            {/if}
        {:else if controller.serviceOrder.status === "selesai"}
            {#if controller.canProcessPayment}
                <Button
                    onclick={() => (controller.showPickupWizard = true)}
                    class="bg-teal-600 hover:bg-teal-700"
                >
                    <CheckCircle class="mr-2 h-4 w-4" /> Konfirmasi Diambil
                </Button>
            {/if}
        {/if}
    </div>
{:else}
    <div class="bg-muted/50 rounded-2xl p-4 text-center">
        <p class="text-muted-foreground italic mb-4">
            Service status <span class="font-medium"
                >{controller.serviceOrder.status}</span
            > - Data terkunci
        </p>
        {#if controller.canAssignTechnician}
            <Button
                variant="outline"
                class="text-red-500 border-red-200 hover:bg-red-50"
                onclick={() => (controller.showDeleteConfirm = true)}
            >
                <Trash2 class="mr-2 h-4 w-4" /> Hapus Data
            </Button>
        {/if}
    </div>
{/if}
