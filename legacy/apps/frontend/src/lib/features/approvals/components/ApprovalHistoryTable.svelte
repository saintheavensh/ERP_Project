<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import { Badge } from "$lib/shared/components/ui/badge";
    import { Eye, History } from "lucide-svelte";
    import type { Approval, ApprovalType } from "../types/approvals.types";

    let {
        approvals,
        typeFilter,
        onTypeFilterChange,
        onViewDetail,
    }: {
        approvals: Approval[];
        typeFilter: ApprovalType | "ALL";
        onTypeFilterChange: (type: ApprovalType | "ALL") => void;
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

    function getStatusColor(status: string) {
        switch (status) {
            case "APPROVED":
                return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-400";
            case "REJECTED":
                return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-400";
            default:
                return "bg-slate-100 text-slate-700";
        }
    }
</script>

<div class="mb-4 flex items-center justify-between">
    <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-slate-500">Filter Type:</span>
        <select
            class="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950"
            value={typeFilter}
            onchange={(e) => onTypeFilterChange(e.currentTarget.value as any)}
        >
            <option value="ALL">All Approvals</option>
            <option value="DISCOUNT">Discount</option>
            <option value="REFUND">Refund</option>
            <option value="PURCHASE_ORDER">Purchase Order</option>
            <option value="VOID">Void</option>
        </select>
    </div>
</div>

<div
    class="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-800"
>
    <table class="w-full text-sm text-left">
        <thead
            class="text-xs text-slate-500 bg-slate-50 dark:bg-slate-900/50 uppercase border-b border-slate-200 dark:border-slate-800"
        >
            <tr>
                <th class="px-6 py-4 font-medium">Date</th>
                <th class="px-6 py-4 font-medium">Type & Reference</th>
                <th class="px-6 py-4 font-medium">Amount</th>
                <th class="px-6 py-4 font-medium">Requested By</th>
                <th class="px-6 py-4 font-medium">Status & Approver</th>
                <th class="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
        </thead>
        <tbody
            class="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950"
        >
            {#if approvals.length === 0}
                <tr>
                    <td
                        colspan="6"
                        class="px-6 py-12 text-center text-slate-500"
                    >
                        <div class="flex flex-col items-center justify-center">
                            <History class="h-12 w-12 text-slate-300 mb-4" />
                            <p>No approval history found.</p>
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
                            class="px-6 py-4 font-bold text-slate-900 dark:text-white"
                        >
                            {formatCurrency(approval.amount)}
                        </td>
                        <td class="px-6 py-4">
                            <div class="flex flex-col">
                                <span class="text-sm font-medium"
                                    >{approval.requestedByName}</span
                                >
                            </div>
                        </td>
                        <td class="px-6 py-4">
                            <div class="flex flex-col gap-1 items-start">
                                <Badge
                                    class="{getStatusColor(
                                        approval.status,
                                    )} border-0 shadow-none hover:bg-opacity-80"
                                >
                                    {approval.status}
                                </Badge>
                                {#if approval.approvedByName}
                                    <span class="text-xs text-slate-500"
                                        >{approval.approvedByName}</span
                                    >
                                {/if}
                            </div>
                        </td>
                        <td class="px-6 py-4 text-right">
                            <div
                                class="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity"
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
