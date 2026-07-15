<script lang="ts">
    import { Badge } from "$lib/shared/components/ui/badge";
    import { Button } from "$lib/shared/components/ui/button";
    import { ClipboardList, CheckCircle, XCircle } from "lucide-svelte";
    import type {
        ServiceToolRequest,
        RequestStatus,
    } from "../types/service-tools.types";

    let {
        requests,
        canApprove = false,
        onUpdateStatus,
    }: {
        requests: ServiceToolRequest[];
        canApprove?: boolean;
        onUpdateStatus?: (
            request: ServiceToolRequest,
            status: RequestStatus,
        ) => void;
    } = $props();

    function formatDate(date: string | Date) {
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
            case "approved":
                return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-400";
            case "rejected":
                return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-400";
            case "pending":
                return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-400";
            default:
                return "bg-slate-100 text-slate-700";
        }
    }
</script>

<div class="overflow-x-auto">
    <table class="w-full text-sm text-left">
        <thead
            class="text-xs text-slate-500 bg-slate-50 dark:bg-slate-900/50 uppercase border-b border-slate-200 dark:border-slate-800"
        >
            <tr>
                <th class="px-6 py-4 font-medium">Date</th>
                <th class="px-6 py-4 font-medium">Technician</th>
                <th class="px-6 py-4 font-medium">Requested Tool</th>
                <th class="px-6 py-4 font-medium">Justification</th>
                <th class="px-6 py-4 font-medium">Status</th>
                {#if canApprove}
                    <th class="px-6 py-4 font-medium text-right">Actions</th>
                {/if}
            </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
            {#if requests.length === 0}
                <tr>
                    <td
                        colspan={canApprove ? 6 : 5}
                        class="px-6 py-12 text-center text-slate-500"
                    >
                        <div class="flex flex-col items-center justify-center">
                            <ClipboardList
                                class="h-12 w-12 text-slate-300 mb-4"
                            />
                            <p>No tool requests pending at the moment.</p>
                        </div>
                    </td>
                </tr>
            {:else}
                {#each requests as req}
                    <tr
                        class="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group"
                    >
                        <td class="px-6 py-4 text-slate-500 whitespace-nowrap">
                            {formatDate(req.createdAt)}
                        </td>
                        <td
                            class="px-6 py-4 font-medium text-slate-900 dark:text-slate-100"
                        >
                            {req.userId}
                            <!-- Normally we would resolve the name here -->
                        </td>
                        <td
                            class="px-6 py-4 font-bold text-slate-800 dark:text-slate-200"
                        >
                            {req.toolName}
                        </td>
                        <td
                            class="px-6 py-4 text-slate-600 dark:text-slate-400 max-w-xs truncate"
                        >
                            {req.justification || "-"}
                        </td>
                        <td class="px-6 py-4">
                            <Badge
                                class="{getStatusColor(
                                    req.status,
                                )} border-0 shadow-none hover:bg-opacity-80"
                            >
                                {req.status.toUpperCase()}
                            </Badge>
                        </td>
                        {#if canApprove}
                            <td class="px-6 py-4 text-right">
                                {#if req.status === "pending"}
                                    <div
                                        class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            class="text-green-600 hover:text-green-700 hover:bg-green-50"
                                            onclick={() =>
                                                onUpdateStatus?.(
                                                    req,
                                                    "approved",
                                                )}
                                        >
                                            <CheckCircle class="h-4 w-4 mr-1" />
                                            Approve
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            class="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onclick={() =>
                                                onUpdateStatus?.(
                                                    req,
                                                    "rejected",
                                                )}
                                        >
                                            <XCircle class="h-4 w-4 mr-1" /> Reject
                                        </Button>
                                    </div>
                                {/if}
                            </td>
                        {/if}
                    </tr>
                {/each}
            {/if}
        </tbody>
    </table>
</div>
