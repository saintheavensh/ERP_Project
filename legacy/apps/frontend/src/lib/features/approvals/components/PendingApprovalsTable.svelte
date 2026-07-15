<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import { Badge } from "$lib/shared/components/ui/badge";
    import { CheckCircle2, XCircle, Eye, AlertCircle } from "lucide-svelte";
    import type { Approval } from "../types/approvals.types";

    let {
        approvals,
        loading = false,
        onApprove,
        onReject,
        onViewDetail,
    }: {
        approvals: Approval[];
        loading?: boolean;
        onApprove: (id: string, notes?: string) => void;
        onReject: (id: string, reason: string) => void;
        onViewDetail: (approval: Approval) => void;
    } = $props();

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
</script>

<div
    class="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-800"
>
    <table class="w-full text-sm text-left">
        <thead
            class="text-xs text-slate-500 bg-slate-50 dark:bg-slate-900/50 uppercase border-b border-slate-200 dark:border-slate-800"
        >
            <tr>
                <th class="px-6 py-4 font-medium">Date requested</th>
                <th class="px-6 py-4 font-medium">Type & Reference</th>
                <th class="px-6 py-4 font-medium">Reason</th>
                <th class="px-6 py-4 font-medium">Amount</th>
                <th class="px-6 py-4 font-medium">Requested By</th>
                <th class="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
        </thead>
        <tbody
            class="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950"
        >
            {#if loading}
                <tr>
                    <td
                        colspan="6"
                        class="px-6 py-12 text-center text-slate-500"
                    >
                        <div class="flex flex-col items-center justify-center">
                            <span
                                class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"
                            ></span>
                            <p>Loading pending approvals...</p>
                        </div>
                    </td>
                </tr>
            {:else if approvals.length === 0}
                <tr>
                    <td
                        colspan="6"
                        class="px-6 py-12 text-center text-slate-500"
                    >
                        <div class="flex flex-col items-center justify-center">
                            <AlertCircle
                                class="h-12 w-12 text-slate-300 mb-4"
                            />
                            <p>No pending approvals at the moment.</p>
                        </div>
                    </td>
                </tr>
            {:else}
                {#each approvals as approval}
                    <tr
                        class="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group"
                    >
                        <td class="px-6 py-4 whitespace-nowrap text-slate-500">
                            {formatDate(approval.requestedAt)}
                        </td>
                        <td class="px-6 py-4">
                            <div class="flex flex-col gap-1">
                                <span
                                    class="font-medium text-slate-900 dark:text-white"
                                >
                                    {approval.type.replace("_", " ")}
                                </span>
                                <span class="text-xs text-slate-500 font-mono">
                                    {approval.referenceNumber}
                                </span>
                            </div>
                        </td>
                        <td
                            class="px-6 py-4 text-slate-600 dark:text-slate-400 max-w-[200px] truncate"
                            title={approval.reason}
                        >
                            {approval.reason}
                        </td>
                        <td
                            class="px-6 py-4 font-bold text-slate-900 dark:text-white"
                        >
                            {formatCurrency(approval.amount)}
                        </td>
                        <td class="px-6 py-4">
                            <div class="flex flex-col">
                                <span class="text-sm font-medium"
                                    >{approval.requestedByName}</span
                                >
                                <span class="text-xs text-slate-500"
                                    >{approval.requestedBy}</span
                                >
                            </div>
                        </td>
                        <td class="px-6 py-4 text-right">
                            <div
                                class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Button
                                    variant="outline"
                                    size="sm"
                                    title="View Detail"
                                    onclick={() => onViewDetail(approval)}
                                >
                                    <Eye class="h-4 w-4" />
                                </Button>
                            </div>
                        </td>
                    </tr>
                {/each}
            {/if}
        </tbody>
    </table>
</div>
