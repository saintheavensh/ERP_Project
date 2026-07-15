<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import * as Dialog from "$lib/shared/components/ui/dialog";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import { Textarea } from "$lib/shared/components/ui/textarea";
    import { Badge } from "$lib/shared/components/ui/badge";
    import type { Approval } from "../types/approvals.types";

    let {
        approval,
        onClose,
        onApprove,
        onReject,
    }: {
        approval: Approval;
        onClose: () => void;
        onApprove: (id: string, notes?: string) => void;
        onReject: (id: string, reason: string) => void;
    } = $props();

    let notes = $state("");
    let rejectReason = $state("");
    let isRejecting = $state(false);

    function formatCurrency(amount: number) {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    }

    function formatDate(date: string) {
        if (!date) return "-";
        return new Date(date).toLocaleString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function handleApprove() {
        onApprove(approval.id, notes);
    }

    function handleReject() {
        if (!rejectReason) {
            // Focus or show error
            document.getElementById("rejectReasonInput")?.focus();
            return;
        }
        onReject(approval.id, rejectReason);
    }
</script>

<Dialog.Root open={true} onOpenChange={(v) => !v && onClose()}>
    <Dialog.Content class="sm:max-w-[500px]">
        <Dialog.Header>
            <Dialog.Title>Approval Detail</Dialog.Title>
            <Dialog.Description>
                Review transaction details before making an approval decision.
            </Dialog.Description>
        </Dialog.Header>

        <div class="space-y-4 py-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <span class="text-xs font-medium text-slate-500 uppercase"
                        >Type</span
                    >
                    <p class="font-medium mt-1">
                        {approval.type.replace("_", " ")}
                    </p>
                </div>
                <div>
                    <span class="text-xs font-medium text-slate-500 uppercase"
                        >Status</span
                    >
                    <div class="mt-1">
                        <Badge
                            variant={approval.status === "PENDING"
                                ? "secondary"
                                : approval.status === "APPROVED"
                                  ? "default"
                                  : "destructive"}
                        >
                            {approval.status}
                        </Badge>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <span class="text-xs font-medium text-slate-500 uppercase"
                        >Requested By</span
                    >
                    <p class="font-medium mt-1">{approval.requestedByName}</p>
                    <p class="text-xs text-slate-500">{approval.requestedBy}</p>
                </div>
                <div>
                    <span class="text-xs font-medium text-slate-500 uppercase"
                        >Date Requested</span
                    >
                    <p class="font-medium mt-1">
                        {formatDate(approval.requestedAt)}
                    </p>
                </div>
            </div>

            <div
                class="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 space-y-3"
            >
                <div class="flex justify-between items-center">
                    <span class="text-xs font-medium text-slate-500 uppercase"
                        >Reference Number</span
                    >
                    <span
                        class="font-mono text-sm font-bold bg-white dark:bg-slate-950 px-2 py-1 rounded border shadow-sm"
                    >
                        {approval.referenceNumber}
                    </span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs font-medium text-slate-500 uppercase"
                        >Amount Involved</span
                    >
                    <span
                        class="text-lg font-bold text-slate-900 dark:text-white"
                    >
                        {formatCurrency(approval.amount)}
                    </span>
                </div>
                <div>
                    <span class="text-xs font-medium text-slate-500 uppercase"
                        >Reason / Description</span
                    >
                    <p
                        class="mt-1 text-sm bg-white dark:bg-slate-950 p-2 rounded border border-slate-100 dark:border-slate-800"
                    >
                        {approval.reason}
                    </p>
                </div>
            </div>

            {#if approval.status === "PENDING"}
                {#if isRejecting}
                    <div
                        class="space-y-2 border-t pt-4 border-red-100 dark:border-red-900/30"
                    >
                        <Label for="rejectReason" class="text-red-600"
                            >Rejection Reason *</Label
                        >
                        <Textarea
                            id="rejectReasonInput"
                            bind:value={rejectReason}
                            placeholder="Please provide a reason for rejection..."
                            rows={3}
                            class="border-red-200 focus-visible:ring-red-500"
                        />
                    </div>
                {:else}
                    <div class="space-y-2 border-t pt-4">
                        <Label for="notes">Approval Notes (Optional)</Label>
                        <Input
                            id="notes"
                            bind:value={notes}
                            placeholder="Add any notes here..."
                        />
                    </div>
                {/if}
            {:else}
                <!-- Readonly info for non-pending -->
                <div
                    class="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 space-y-2"
                >
                    <div>
                        <span
                            class="text-xs font-medium text-slate-500 uppercase"
                            >Processed By</span
                        >
                        <p class="font-medium text-sm mt-1">
                            {approval.approvedByName}
                            <span class="text-xs text-slate-400"
                                >({formatDate(approval.approvedAt!)})</span
                            >
                        </p>
                    </div>
                    {#if approval.status === "REJECTED" && approval.rejectedReason}
                        <div>
                            <span
                                class="text-xs font-medium text-red-500 uppercase"
                                >Rejection Reason</span
                            >
                            <p
                                class="mt-1 text-sm text-red-700 bg-red-50 p-2 rounded border border-red-100"
                            >
                                {approval.rejectedReason}
                            </p>
                        </div>
                    {/if}
                    {#if approval.notes}
                        <div>
                            <span
                                class="text-xs font-medium text-slate-500 uppercase"
                                >Notes</span
                            >
                            <p class="mt-1 text-sm italic">
                                "{approval.notes}"
                            </p>
                        </div>
                    {/if}
                </div>
            {/if}
        </div>

        <Dialog.Footer class="gap-2 sm:gap-0">
            <Button variant="outline" onclick={onClose}>
                {approval.status === "PENDING" ? "Cancel" : "Close"}
            </Button>

            {#if approval.status === "PENDING"}
                {#if isRejecting}
                    <Button
                        variant="ghost"
                        onclick={() => (isRejecting = false)}>Back</Button
                    >
                    <Button variant="destructive" onclick={handleReject}
                        >Confirm Reject</Button
                    >
                {:else}
                    <Button
                        variant="destructive"
                        onclick={() => (isRejecting = true)}>Reject</Button
                    >
                    <Button
                        class="bg-green-600 hover:bg-green-700 text-white"
                        onclick={handleApprove}>Approve</Button
                    >
                {/if}
            {/if}
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
