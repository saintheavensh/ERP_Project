import { ServiceToolsAPI } from './services/service-tools.service';
import type {
    ServiceTool,
    ServiceToolRequest,
    CreateServiceToolDTO,
    UpdateServiceToolDTO,
    CreateToolRequestDTO,
    ToolCondition,
    RequestStatus
} from './types/service-tools.types';
import { toast } from 'svelte-sonner';

export function createServiceToolsController() {
    let tools = $state<ServiceTool[]>([]);
    let requests = $state<ServiceToolRequest[]>([]);
    let myTools = $state<ServiceTool[]>([]);
    let myRequests = $state<ServiceToolRequest[]>([]);

    let loading = $state(false);
    let error = $state<string | null>(null);

    // Tools CRUD
    async function loadAllTools() {
        loading = true;
        try {
            tools = await ServiceToolsAPI.getAll();
        } catch (e: any) {
            error = e.message || "Failed to load tools";
            toast.error(error || "Failed to load tools");
        } finally {
            loading = false;
        }
    }

    async function loadMyTools() {
        loading = true;
        try {
            myTools = await ServiceToolsAPI.getMyTools();
        } catch (e: any) {
            error = e.message || "Failed to load your tools";
            toast.error(error || "Failed to load your tools");
        } finally {
            loading = false;
        }
    }

    async function createTool(data: CreateServiceToolDTO) {
        loading = true;
        try {
            await ServiceToolsAPI.create(data);
            toast.success("Tool created successfully");
            await loadAllTools();
        } catch (e: any) {
            error = e.message || "Failed to create tool";
            toast.error(error || "Failed to create tool");
        } finally {
            loading = false;
        }
    }

    async function updateTool(id: string, data: UpdateServiceToolDTO) {
        loading = true;
        try {
            await ServiceToolsAPI.update(id, data);
            toast.success("Tool updated successfully");
            await loadAllTools();
        } catch (e: any) {
            error = e.message || "Failed to update tool";
            toast.error(error || "Failed to update tool");
        } finally {
            loading = false;
        }
    }

    async function updateToolCondition(id: string, condition: ToolCondition) {
        loading = true;
        try {
            await ServiceToolsAPI.updateCondition(id, condition);
            toast.success(`Tool condition updated to ${condition}`);
            await loadAllTools();
            await loadMyTools();
        } catch (e: any) {
            error = e.message || "Failed to update condition";
            toast.error(error || "Failed to update condition");
        } finally {
            loading = false;
        }
    }

    async function deleteTool(id: string) {
        loading = true;
        try {
            await ServiceToolsAPI.delete(id);
            toast.success("Tool deleted successfully");
            await loadAllTools();
        } catch (e: any) {
            error = e.message || "Failed to delete tool";
            toast.error(error || "Failed to delete tool");
        } finally {
            loading = false;
        }
    }

    // Requests
    async function loadAllRequests() {
        loading = true;
        try {
            requests = await ServiceToolsAPI.getAllRequests();
        } catch (e: any) {
            error = e.message || "Failed to load requests";
            toast.error(error || "Failed to load requests");
        } finally {
            loading = false;
        }
    }

    async function loadMyRequests() {
        loading = true;
        try {
            myRequests = await ServiceToolsAPI.getMyRequests();
        } catch (e: any) {
            error = e.message || "Failed to load your requests";
            toast.error(error || "Failed to load your requests");
        } finally {
            loading = false;
        }
    }

    async function createRequest(data: CreateToolRequestDTO) {
        loading = true;
        try {
            await ServiceToolsAPI.createRequest(data);
            toast.success("Tool request submitted successfully");
            await loadMyRequests();
        } catch (e: any) {
            error = e.message || "Failed to submit request";
            toast.error(error || "Failed to submit request");
        } finally {
            loading = false;
        }
    }

    async function updateRequestStatus(id: string, status: RequestStatus) {
        loading = true;
        try {
            await ServiceToolsAPI.updateRequestStatus(id, status);
            toast.success(`Request ${status} successfully`);
            await loadAllRequests();
        } catch (e: any) {
            error = e.message || "Failed to update request status";
            toast.error(error || "Failed to update request status");
        } finally {
            loading = false;
        }
    }

    return {
        get tools() { return tools; },
        get requests() { return requests; },
        get myTools() { return myTools; },
        get myRequests() { return myRequests; },
        get loading() { return loading; },
        get error() { return error; },

        loadAllTools,
        loadMyTools,
        createTool,
        updateTool,
        updateToolCondition,
        deleteTool,

        loadAllRequests,
        loadMyRequests,
        createRequest,
        updateRequestStatus
    };
}
