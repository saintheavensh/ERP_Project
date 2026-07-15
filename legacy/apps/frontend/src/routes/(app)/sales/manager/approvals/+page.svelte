<script lang="ts">
    import { onMount } from "svelte";
    import {
        Tabs,
        TabsContent,
        TabsList,
        TabsTrigger,
    } from "$lib/shared/components/ui/tabs";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import {
        AlertCircle,
        CheckCircle2,
        Clock,
        DollarSign,
    } from "lucide-svelte";
    import { createApprovalsController } from "$lib/features/approvals/approvals.controller.svelte";
    import PendingApprovalsTable from "$lib/features/approvals/components/PendingApprovalsTable.svelte";
    import ApprovalHistoryTable from "$lib/features/approvals/components/ApprovalHistoryTable.svelte";
    import ApprovalDetailModal from "$lib/features/approvals/components/ApprovalDetailModal.svelte";

    const controller = createApprovalsController();

    onMount(() => {
        controller.loadPendingApprovals();
        controller.loadApprovalHistory();
        controller.loadStats();
    });

    function formatCurrency(amount: number) {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount || 0);
    }
</script>

<div class="space-y-6">
    <div>
        <h1
            class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
        >
            Approvals Management
        </h1>
        <p class="text-slate-500">
            Review and authorize sensitive transactions and requests.
        </p>
    </div>

    <!-- Stats Cards -->
    <div class="grid gap-4 md:grid-cols-4">
        <Card class="bg-white dark:bg-slate-950 shadow-sm">
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium text-slate-500"
                    >Pending</CardTitle
                >
                <Clock class="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold text-slate-900 dark:text-white">
                    {controller.stats.pending}
                </div>
            </CardContent>
        </Card>

        <Card class="bg-white dark:bg-slate-950 shadow-sm">
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium text-slate-500"
                    >Approved</CardTitle
                >
                <CheckCircle2 class="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold text-slate-900 dark:text-white">
                    {controller.stats.approved}
                </div>
            </CardContent>
        </Card>

        <Card class="bg-white dark:bg-slate-950 shadow-sm">
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium text-slate-500"
                    >Rejected</CardTitle
                >
                <AlertCircle class="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold text-slate-900 dark:text-white">
                    {controller.stats.rejected}
                </div>
            </CardContent>
        </Card>

        <Card
            class="bg-white dark:bg-slate-950 shadow-sm border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/20"
        >
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle
                    class="text-sm font-medium text-blue-700 dark:text-blue-400"
                    >Total Value Processed</CardTitle
                >
                <DollarSign class="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
                <div
                    class="text-2xl font-bold text-blue-700 dark:text-blue-400"
                >
                    {formatCurrency(controller.stats.totalAmount)}
                </div>
            </CardContent>
        </Card>
    </div>

    <div
        class="bg-white dark:bg-slate-950 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6"
    >
        <Tabs value="pending" class="w-full">
            <TabsList class="grid w-full grid-cols-2 md:w-[400px]">
                <TabsTrigger value="pending">
                    Pending ({controller.pendingApprovals.length})
                </TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" class="mt-6">
                <PendingApprovalsTable
                    approvals={controller.pendingApprovals}
                    loading={controller.loading}
                    onApprove={controller.approve}
                    onReject={controller.reject}
                    onViewDetail={controller.setSelectedApproval}
                />
            </TabsContent>

            <TabsContent value="history" class="mt-6">
                <ApprovalHistoryTable
                    approvals={controller.filteredHistory}
                    typeFilter={controller.typeFilter}
                    onTypeFilterChange={(value) =>
                        (controller.typeFilter = value)}
                    onViewDetail={controller.setSelectedApproval}
                />
            </TabsContent>
        </Tabs>
    </div>
</div>

{#if controller.selectedApproval}
    <ApprovalDetailModal
        approval={controller.selectedApproval}
        onClose={() => controller.setSelectedApproval(null)}
        onApprove={controller.approve}
        onReject={controller.reject}
    />
{/if}
