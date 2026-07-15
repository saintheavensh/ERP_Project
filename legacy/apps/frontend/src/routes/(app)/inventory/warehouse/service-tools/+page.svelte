<script lang="ts">
    import { onMount, getContext } from "svelte";
    import * as Tabs from "$lib/shared/components/ui/tabs";
    import { Button } from "$lib/shared/components/ui/button";
    import * as Sheet from "$lib/shared/components/ui/sheet";
    import { Wrench, Plus, ClipboardList } from "lucide-svelte";

    import { createServiceToolsController } from "$lib/features/inventory/components/service-tools/service-tools.controller.svelte";
    import ServiceToolsTable from "$lib/features/inventory/components/service-tools/components/ServiceToolsTable.svelte";
    import ServiceToolForm from "$lib/features/inventory/components/service-tools/components/ServiceToolForm.svelte";
    import ToolRequestsTable from "$lib/features/inventory/components/service-tools/components/ToolRequestsTable.svelte";
    import ToolRequestForm from "$lib/features/inventory/components/service-tools/components/ToolRequestForm.svelte";

    import type {
        ServiceTool,
        ServiceToolRequest,
        CreateServiceToolDTO,
    } from "$lib/features/inventory/components/service-tools/types/service-tools.types";

    // In our simplified setup, we can grab the user role from local storage or context
    // Assuming context provides currentUser
    const currentUser = getContext("currentUser") as any;

    // In a real app we derive this more robustly
    const isManagerOrAdmin =
        currentUser?.role === "manager" ||
        currentUser?.role === "super_admin" ||
        currentUser?.role === "owner";
    const isTechnician = currentUser?.role === "teknisi";

    const controller = createServiceToolsController();

    let showToolForm = $state(false);
    let editingTool = $state<ServiceTool | null>(null);

    let showRequestForm = $state(false);

    onMount(() => {
        if (isTechnician) {
            controller.loadMyTools();
            controller.loadMyRequests();
        } else {
            controller.loadAllTools();
            controller.loadAllRequests();
        }
    });

    // === Tools Handlers ===
    function handleEditTool(tool: ServiceTool) {
        editingTool = tool;
        showToolForm = true;
    }

    function handleAddNewTool() {
        editingTool = null;
        showToolForm = true;
    }

    async function handleToolSubmit(data: CreateServiceToolDTO | any) {
        if (editingTool) {
            await controller.updateTool(editingTool.id, data);
        } else {
            await controller.createTool(data);
        }
        showToolForm = false;
    }

    // === Requests Handlers ===
    async function handleRequestSubmit(data: {
        toolName: string;
        justification?: string;
    }) {
        await controller.createRequest(data);
        showRequestForm = false;
    }

    async function handleUpdateCondition(
        tool: ServiceTool,
        condition: "good" | "damaged" | "lost",
    ) {
        await controller.updateToolCondition(tool.id, condition);
    }
</script>

<div class="space-y-6">
    <div
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
    >
        <div>
            <h1
                class="text-3xl font-bold tracking-tight flex items-center gap-3"
            >
                <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Wrench class="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                Service Tools
            </h1>
            <p class="text-slate-500 mt-1">
                Manage inventory for technician tools and equipment requests.
            </p>
        </div>

        <div class="flex gap-2">
            {#if isTechnician}
                <Sheet.Root bind:open={showRequestForm}>
                    <Sheet.Trigger>
                        <div
                            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 bg-green-600 text-white shadow hover:bg-green-700 h-9 px-4 py-2"
                        >
                            <ClipboardList class="h-4 w-4 mr-2" />
                            Request Needed Tool
                        </div>
                    </Sheet.Trigger>
                    <Sheet.Content
                        side="right"
                        class="w-full sm:max-w-md overflow-y-auto"
                    >
                        <Sheet.Header>
                            <Sheet.Title>Request a New Tool</Sheet.Title>
                            <Sheet.Description>
                                Submit a request to management for a tool you
                                need to perform repairs.
                            </Sheet.Description>
                        </Sheet.Header>
                        <div class="mt-6">
                            <ToolRequestForm
                                onSubmit={handleRequestSubmit}
                                onClose={() => (showRequestForm = false)}
                            />
                        </div>
                    </Sheet.Content>
                </Sheet.Root>
            {/if}

            {#if isManagerOrAdmin}
                <Sheet.Root bind:open={showToolForm}>
                    <Sheet.Trigger>
                        <button
                            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 bg-blue-600 text-white shadow hover:bg-blue-700 h-9 px-4 py-2"
                            onclick={handleAddNewTool}
                        >
                            <Plus class="h-4 w-4 mr-2" />
                            Add Tool to Inventory
                        </button>
                    </Sheet.Trigger>
                    <Sheet.Content
                        side="right"
                        class="w-full sm:max-w-md overflow-y-auto"
                    >
                        <Sheet.Header>
                            <Sheet.Title
                                >{editingTool
                                    ? "Edit Service Tool"
                                    : "Add New Service Tool"}</Sheet.Title
                            >
                            <Sheet.Description>
                                Add tools to the system and optionally assign
                                them to a technician.
                            </Sheet.Description>
                        </Sheet.Header>
                        <div class="mt-6">
                            {#if showToolForm}
                                <!-- Force re-render for clean state when editing null -->
                                <ServiceToolForm
                                    tool={editingTool}
                                    onSubmit={handleToolSubmit}
                                    onClose={() => (showToolForm = false)}
                                />
                            {/if}
                        </div>
                    </Sheet.Content>
                </Sheet.Root>
            {/if}
        </div>
    </div>

    <!-- Main Content Tabs -->
    <Tabs.Root value="tools-db" class="w-full">
        <Tabs.List class="grid w-full grid-cols-2 lg:w-[400px]">
            <Tabs.Trigger value="tools-db">Tools Database</Tabs.Trigger>
            <Tabs.Trigger value="requests">
                Tool Requests
                {#if isManagerOrAdmin && controller.requests.filter((r) => r.status === "pending").length > 0}
                    <span
                        class="ml-2 inline-flex items-center justify-center bg-red-100 text-red-600 dark:bg-red-900 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    >
                        {controller.requests.filter(
                            (r) => r.status === "pending",
                        ).length}
                    </span>
                {/if}
            </Tabs.Trigger>
        </Tabs.List>

        <div class="mt-6">
            <Tabs.Content
                value="tools-db"
                class="m-0 focus-visible:outline-none"
            >
                <div
                    class="bg-white dark:bg-slate-950 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden"
                >
                    <ServiceToolsTable
                        tools={isTechnician
                            ? controller.myTools
                            : controller.tools}
                        canEdit={isManagerOrAdmin}
                        onEdit={handleEditTool}
                        onDelete={(tool) => controller.deleteTool(tool.id)}
                        onUpdateCondition={handleUpdateCondition}
                    />
                </div>
            </Tabs.Content>

            <Tabs.Content
                value="requests"
                class="m-0 focus-visible:outline-none"
            >
                <div
                    class="bg-white dark:bg-slate-950 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden"
                >
                    <ToolRequestsTable
                        requests={isTechnician
                            ? controller.myRequests
                            : controller.requests}
                        canApprove={isManagerOrAdmin}
                        onUpdateStatus={(req, status) =>
                            controller.updateRequestStatus(req.id, status)}
                    />
                </div>
            </Tabs.Content>
        </div>
    </Tabs.Root>
</div>
