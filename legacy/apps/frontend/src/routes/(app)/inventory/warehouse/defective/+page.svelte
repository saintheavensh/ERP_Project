<script lang="ts">
    import { onMount } from "svelte";
    import * as Tabs from "$lib/shared/components/ui/tabs";
    import { Button } from "$lib/shared/components/ui/button";
    import * as Sheet from "$lib/shared/components/ui/sheet";
    import { Plus, XCircle } from "lucide-svelte";
    import { createDefectiveItemsController } from "$lib/features/inventory/components/defective-items/defective-items.controller.svelte";
    import DefectiveItemsTable from "$lib/features/inventory/components/defective-items/components/DefectiveItemsTable.svelte";
    import DefectiveItemForm from "$lib/features/inventory/components/defective-items/components/DefectiveItemForm.svelte";
    import type { CreateDefectiveItemDTO } from "$lib/features/inventory/components/defective-items/types/defective-items.types";

    const controller = createDefectiveItemsController();
    let showForm = false;

    onMount(() => {
        controller.loadItems();
    });

    async function handleCreate(data: CreateDefectiveItemDTO) {
        await controller.createItem(data);
        showForm = false;
    }

    async function handleProcessReturn(ids: string[], notes?: string) {
        await controller.processReturn(ids, notes);
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
                <div class="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                    <XCircle class="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                Defective Items
            </h1>
            <p class="text-slate-500 mt-1">
                Manage damaged products, factory defects, and process returns to
                suppliers.
            </p>
        </div>

        <Sheet.Root bind:open={showForm}>
            <Sheet.Trigger>
                <div
                    class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-primary-foreground shadow hover:bg-blue-700 h-9 px-4 py-2"
                >
                    <Plus class="h-4 w-4 mr-2" />
                    Report Defective
                </div>
            </Sheet.Trigger>
            <Sheet.Content
                side="right"
                class="w-full sm:max-w-md overflow-y-auto"
            >
                <Sheet.Header>
                    <Sheet.Title>Report Defective Item</Sheet.Title>
                    <Sheet.Description>
                        Record severely damaged or defective stock. This will
                        remove it from your healthy inventory.
                    </Sheet.Description>
                </Sheet.Header>
                <div class="mt-6">
                    <DefectiveItemForm
                        onSubmit={handleCreate}
                        onClose={() => (showForm = false)}
                    />
                </div>
            </Sheet.Content>
        </Sheet.Root>
    </div>

    <Tabs.Root value="pending" class="w-full">
        <Tabs.List class="grid w-full grid-cols-2 lg:w-[400px]">
            <Tabs.Trigger value="pending">
                Pending Returns
                {#if controller.pendingItems.length > 0}
                    <span
                        class="ml-2 inline-flex items-center justify-center bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    >
                        {controller.pendingItems.length}
                    </span>
                {/if}
            </Tabs.Trigger>
            <Tabs.Trigger value="processed">
                Processed ({controller.processedItems.length})
            </Tabs.Trigger>
        </Tabs.List>

        <div class="mt-6">
            <Tabs.Content
                value="pending"
                class="m-0 focus-visible:outline-none"
            >
                <div
                    class="bg-white dark:bg-slate-950 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden"
                >
                    <DefectiveItemsTable
                        items={controller.pendingItems}
                        selectedItems={controller.selectedItems}
                        onToggleSelect={controller.toggleSelect}
                        onSelectAllPending={controller.selectAllPending}
                        onProcessReturn={handleProcessReturn}
                        type="pending"
                    />
                </div>
            </Tabs.Content>

            <Tabs.Content
                value="processed"
                class="m-0 focus-visible:outline-none"
            >
                <div
                    class="bg-white dark:bg-slate-950 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden"
                >
                    <DefectiveItemsTable
                        items={controller.processedItems}
                        selectedItems={[]}
                        onToggleSelect={() => {}}
                        onSelectAllPending={() => {}}
                        onProcessReturn={() => {}}
                        type="processed"
                    />
                </div>
            </Tabs.Content>
        </div>
    </Tabs.Root>
</div>
