<script lang="ts">
    import { ChevronDown, ChevronRight, Calculator } from "lucide-svelte";
    import { cn } from "$lib/shared/lib/utils";
    import { Separator } from "$lib/shared/components/ui/separator";
    import { Badge } from "$lib/shared/components/ui/badge";
    import type { AccountMappingSettings } from "$lib/features/settings/settings.service";
    import type { ProfitAndLoss } from "$lib/features/finance/reports/reports.service";

    let {
        accountTree = [],
        profitLoss,
        mappingSettings,
    } = $props<{
        accountTree: any[];
        profitLoss: ProfitAndLoss | null;
        mappingSettings: AccountMappingSettings | null;
    }>();

    // Expanded nodes state
    let expandedNodes = $state<Set<string>>(new Set());

    function toggleNode(id: string) {
        if (expandedNodes.has(id)) expandedNodes.delete(id);
        else expandedNodes.add(id);
        expandedNodes = new Set(expandedNodes); // Trigger reactivity
    }

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(val);

    // Recursive function to calculate values and build the display tree
    function buildDisplayTree(nodes: any[]): any[] {
        return (
            nodes
                .map((node) => {
                    // Determine value for this node
                    let value = 0;
                    let potentialValue = 0; // For pending/unrealized

                    // 1. Assign value if this account is mapped
                    if (mappingSettings && profitLoss) {
                        const mappings = mappingSettings.mappings;
                        // Check if this node.id matches any mapping
                        for (const m of mappings) {
                            if (m.accountId === node.id) {
                                if (m.type === "sales_revenue")
                                    value += profitLoss.revenue.sales;
                                else if (m.type === "service_revenue") {
                                    value += profitLoss.revenue.services;
                                    potentialValue +=
                                        profitLoss.revenue.servicesPending;
                                } else if (m.type === "cogs_sales")
                                    value += profitLoss.cogs.sales;
                                else if (m.type === "cogs_service") {
                                    value += profitLoss.cogs.services;
                                    potentialValue +=
                                        profitLoss.cogs.servicesPending;
                                } else if (m.type === "operational_expense")
                                    value += profitLoss.expenses.operational;
                                else if (m.type === "commission_expense") {
                                    value += profitLoss.expenses.commissions;
                                    potentialValue +=
                                        profitLoss.expenses.commissionsPending;
                                } else if (m.type === "depreciation_expense") {
                                    // Add deprec expense if available in P&L (not yet passed but placeholder)
                                }
                            }
                        }
                    }

                    // 2. Process children
                    const children = node.children
                        ? buildDisplayTree(node.children)
                        : [];

                    // 3. Add children values to self (Aggregation)
                    const childrenValue = children.reduce(
                        (sum: number, c: any) => sum + c.totalValue,
                        0,
                    );
                    const childrenPotential = children.reduce(
                        (sum: number, c: any) => sum + c.totalPotential,
                        0,
                    );

                    const totalValue = value + childrenValue;
                    const totalPotential = potentialValue + childrenPotential;

                    // Auto-expand if has value
                    if (
                        (totalValue !== 0 || totalPotential !== 0) &&
                        children.length > 0
                    ) {
                        // We can't set state directly during render easily without side effects,
                        // but we can initialize expandedNodes elsewhere if needed.
                        // For now, let's keep it manual or expanded by default.
                    }

                    return {
                        ...node,
                        selfValue: value,
                        selfPotential: potentialValue,
                        totalValue,
                        totalPotential,
                        children,
                    };
                })
                // Filter: Only show Revenue (Type 4) and Expense (Type 5) branches for P&L
                // But we might want to traverse everything first to get sums, then filter top level.
                // Actually, we should filter top level BEFORE returning.
                .filter((node) => {
                    // Include if it has value OR it is a relevant root type (4=Revenue, 5=Expense)
                    // Assuming typeId "REVENUE" and "EXPENSE" are used.
                    // Need to check account type IDs.
                    // Usually standard types: REVENUE, EXPENSE.
                    // Check if totalValue != 0 to hide empty branches? Maybe optional.
                    return true;
                })
        );
    }

    // Filter top level to only show P&L relevant types
    let displayTree = $derived.by(() => {
        if (!accountTree || !profitLoss) return [];
        const tree = buildDisplayTree(accountTree);
        return tree.filter(
            (n) =>
                [
                    "REVENUE",
                    "EXPENSE",
                    "HPP",
                    "OTHER_REVENUE",
                    "OTHER_EXPENSE",
                ].includes(n.typeId) || n.totalValue !== 0, // Also show if it has value (fallback)
        );
    });

    // Calculate Net Profit from the tree (Revenue - Expense)
    // Note: In accounting, Revenue is Credit (negative in some systems, positive in others)
    // Here we assume all values are absolute numbers.
    // Net Profit = Total Revenue - Total Expense
    let netProfit = $derived.by(() => {
        if (!displayTree) return 0;
        let revenue = 0;
        let expense = 0;
        for (const node of displayTree) {
            if (node.typeId === "REVENUE" || node.typeId === "OTHER_REVENUE")
                revenue += node.totalValue;
            if (
                node.typeId === "EXPENSE" ||
                node.typeId === "HPP" ||
                node.typeId === "OTHER_EXPENSE"
            )
                expense += node.totalValue;
        }
        return revenue - expense;
    });

    // Helper for recursion is handled by snippet below
    // No external import needed
</script>

{#snippet treeNode(node: any, level: number)}
    <div class="select-none">
        <div
            class={cn(
                "flex items-center py-2 px-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer",
                level === 0 &&
                    "bg-slate-50/50 dark:bg-slate-900/50 font-semibold mb-1",
            )}
            onclick={() => toggleNode(node.id)}
            style="padding-left: {level * 16 + 8}px"
            role="button"
            tabindex="0"
            onkeydown={(e) => e.key === "Enter" && toggleNode(node.id)}
        >
            <!-- Toggle Icon -->
            <div
                class={cn(
                    "mr-1 transition-transform duration-200",
                    expandedNodes.has(node.id) && "rotate-90",
                )}
            >
                {#if node.children && node.children.length > 0}
                    <ChevronRight class="h-4 w-4 text-slate-400" />
                {:else}
                    <div class="w-4 h-4"></div>
                {/if}
            </div>

            <!-- Account Name & Code -->
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                    <span
                        class={cn(
                            "font-medium",
                            level === 0
                                ? "text-slate-900 dark:text-slate-100"
                                : "text-slate-700 dark:text-slate-300",
                        )}
                    >
                        {node.name}
                        <span class="text-slate-400 text-xs font-normal ml-1"
                            >#{node.code}</span
                        >
                    </span>
                    {#if node.selfValue > 0 && node.children.length > 0}
                        <!-- Indicator that this node has direct value + children value -->
                        <Badge
                            variant="outline"
                            class="text-[10px] h-5 px-1 bg-slate-100 border-none text-slate-500"
                            >Direct: {formatCurrency(node.selfValue)}</Badge
                        >
                    {/if}
                </div>
            </div>

            <!-- Values -->
            <div class="text-right">
                <div
                    class={cn(
                        "font-medium tabular-nums",
                        node.typeId === "REVENUE"
                            ? "text-green-700 dark:text-green-400"
                            : "text-slate-700 dark:text-slate-300",
                    )}
                >
                    {formatCurrency(node.totalValue)}
                </div>
                {#if node.totalPotential > 0}
                    <div class="text-[10px] text-slate-500 tabular-nums">
                        + {formatCurrency(node.totalPotential)} pending
                    </div>
                {/if}
            </div>
        </div>

        <!-- Children -->
        {#if expandedNodes.has(node.id) && node.children}
            <div class="animate-in slide-in-from-top-1 duration-200">
                {#each node.children as child}
                    {@render treeNode(child, level + 1)}
                {/each}
            </div>
        {/if}
    </div>
{/snippet}

<div
    class="bg-white dark:bg-gray-950 rounded-xl border shadow-sm overflow-hidden"
>
    <div class="p-4 border-b bg-slate-50/50 flex justify-between items-center">
        <h3 class="font-bold flex items-center gap-2">
            <Calculator class="h-4 w-4 text-purple-600" />
            Laporan Laba Rugi (Hierarchical)
        </h3>
        <div
            class="bg-white px-3 py-1 rounded-full border text-sm font-bold shadow-sm"
        >
            Net Profit:
            <span class={netProfit >= 0 ? "text-green-600" : "text-red-600"}>
                {formatCurrency(netProfit)}
            </span>
        </div>
    </div>

    <div class="p-2 space-y-1">
        {#if displayTree.length > 0}
            {#each displayTree as node}
                {@render treeNode(node, 0)}
            {/each}
        {:else}
            <div class="py-8 text-center text-slate-500 text-sm">
                Belum ada data akun yang sesuai. Pastikan konfigurasi mapping
                akun sudah benar.
            </div>
        {/if}
    </div>
</div>

