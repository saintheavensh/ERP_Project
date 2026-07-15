import { defectiveItemsService } from './services/defective-items.service';
import type { CreateDefectiveItemDTO, DefectiveItem, DefectiveItemStatus } from './types/defective-items.types';
import { toast } from 'svelte-sonner';

export function createDefectiveItemsController() {
    let pendingItems = $state<DefectiveItem[]>([]);
    let processedItems = $state<DefectiveItem[]>([]);
    let loading = $state(false);
    let error = $state<string | null>(null);
    let selectedItems = $state<string[]>([]);

    let pagination = $state({
        page: 1,
        limit: 20,
        total: 0
    });

    // We separately fetch pending and processed because backend has separate endpoints
    async function loadItems() {
        loading = true;
        error = null;
        try {
            const [pendingData, processedData] = await Promise.all([
                defectiveItemsService.getPendingItems(),
                defectiveItemsService.getProcessedItems()
            ]);

            pendingItems = pendingData;
            processedItems = processedData;

            // Adjust pagination total if needed (backend doesn't return total right now on these endpoints, array length)
            pagination.total = pendingItems.length + processedItems.length;
        } catch (e: any) {
            error = e.message || "Failed to load defective items";
            toast.error(error || "Failed to load defective items");
        } finally {
            loading = false;
        }
    }

    async function createItem(data: CreateDefectiveItemDTO) {
        loading = true;
        try {
            await defectiveItemsService.createItem(data);
            toast.success("Defective item reported successfully");
            await loadItems(); // refresh list
        } catch (e: any) {
            error = e.message || "Failed to create defective item";
            toast.error(error || "Failed to create defective item");
        } finally {
            loading = false;
        }
    }

    async function processReturn(ids: string[], notes?: string) {
        if (!ids || ids.length === 0) return;

        loading = true;
        try {
            await defectiveItemsService.processMultipleReturns(ids, notes);
            selectedItems = [];
            toast.success(`Successfully processed ${ids.length} defective item(s)`);
            await loadItems();
        } catch (e: any) {
            error = e.message || "Failed to process return";
            toast.error(error || "Failed to process return");
        } finally {
            loading = false;
        }
    }

    function toggleSelect(id: string) {
        if (selectedItems.includes(id)) {
            selectedItems = selectedItems.filter(i => i !== id);
        } else {
            selectedItems = [...selectedItems, id];
        }
    }

    function selectAllPending() {
        if (selectedItems.length === pendingItems.length) {
            selectedItems = [];
        } else {
            selectedItems = pendingItems.map(i => i.id);
        }
    }

    return {
        get items() { return [...pendingItems, ...processedItems]; },
        get pendingItems() { return pendingItems; },
        get processedItems() { return processedItems; },
        get loading() { return loading; },
        get error() { return error; },
        get selectedItems() { return selectedItems; },
        get pagination() { return pagination; },
        loadItems,
        createItem,
        processReturn,
        toggleSelect,
        selectAllPending
    };
}
