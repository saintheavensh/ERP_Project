<script lang="ts">
    import { Badge } from "$lib/shared/components/ui/badge";
    import { Button } from "$lib/shared/components/ui/button";
    import { Wrench, Edit, Trash2, ShieldAlert } from "lucide-svelte";
    import type { ServiceTool } from "../types/service-tools.types";

    let {
        tools,
        canEdit = false,
        onEdit,
        onDelete,
        onUpdateCondition,
    }: {
        tools: ServiceTool[];
        canEdit?: boolean;
        onEdit?: (tool: ServiceTool) => void;
        onDelete?: (tool: ServiceTool) => void;
        onUpdateCondition?: (
            tool: ServiceTool,
            condition: "good" | "damaged" | "lost",
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

    function getConditionColor(condition: string) {
        switch (condition) {
            case "good":
                return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-400";
            case "damaged":
                return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-400";
            case "lost":
                return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-400";
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
                <th class="px-6 py-4 font-medium">Tool Info</th>
                <th class="px-6 py-4 font-medium">Quantity</th>
                <th class="px-6 py-4 font-medium">Condition</th>
                <th class="px-6 py-4 font-medium">Assigned To</th>
                <th class="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
            {#if tools.length === 0}
                <tr>
                    <td
                        colspan="5"
                        class="px-6 py-12 text-center text-slate-500"
                    >
                        <div class="flex flex-col items-center justify-center">
                            <Wrench class="h-12 w-12 text-slate-300 mb-4" />
                            <p>No service tools found matching criteria.</p>
                        </div>
                    </td>
                </tr>
            {:else}
                {#each tools as tool}
                    <tr
                        class="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group"
                    >
                        <td class="px-6 py-4">
                            <div class="flex items-center gap-3">
                                <div
                                    class="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg shrink-0"
                                >
                                    <Wrench
                                        class="h-5 w-5 text-blue-600 dark:text-blue-400"
                                    />
                                </div>
                                <div>
                                    <p
                                        class="font-medium text-slate-900 dark:text-white"
                                    >
                                        {tool.name}
                                    </p>
                                    {#if tool.brand}
                                        <p class="text-xs text-slate-500">
                                            {tool.brand}
                                        </p>
                                    {/if}
                                </div>
                            </div>
                        </td>
                        <td
                            class="px-6 py-4 font-mono font-bold text-slate-700 dark:text-slate-300"
                        >
                            {tool.qty}
                        </td>
                        <td class="px-6 py-4">
                            <div class="flex flex-col gap-2">
                                <Badge
                                    class="{getConditionColor(
                                        tool.condition,
                                    )} border-0 hover:bg-opacity-80"
                                >
                                    {tool.condition.toUpperCase()}
                                </Badge>
                                {#if onUpdateCondition}
                                    <select
                                        class="text-xs border rounded px-1 py-1 bg-white cursor-pointer"
                                        onchange={(e) =>
                                            onUpdateCondition(
                                                tool,
                                                e.currentTarget.value as any,
                                            )}
                                        value={tool.condition}
                                    >
                                        <option value="good">Set Good</option>
                                        <option value="damaged"
                                            >Set Damaged</option
                                        >
                                        <option value="lost">Set Lost</option>
                                    </select>
                                {/if}
                            </div>
                        </td>
                        <td class="px-6 py-4">
                            {#if tool.userId}
                                <span
                                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700"
                                >
                                    {tool.userId}
                                </span>
                            {:else}
                                <span class="text-xs text-slate-400 italic"
                                    >Unassigned (HQ)</span
                                >
                            {/if}
                        </td>
                        <td class="px-6 py-4 text-right">
                            {#if canEdit}
                                <div
                                    class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onclick={() => onEdit?.(tool)}
                                    >
                                        <Edit class="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        class="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onclick={() => onDelete?.(tool)}
                                    >
                                        <Trash2 class="h-4 w-4" />
                                    </Button>
                                </div>
                            {/if}
                        </td>
                    </tr>
                {/each}
            {/if}
        </tbody>
    </table>
</div>
