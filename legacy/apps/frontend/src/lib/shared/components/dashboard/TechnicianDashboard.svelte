<script lang="ts">
    import { onMount } from "svelte";
    import { api } from "$lib/shared/lib/api-client";
    import {
        ServiceToolsService,
        type ServiceTool,
        type ServiceToolRequest,
    } from "$lib/features/services/services/service-tools.service";
    import { toast } from "svelte-sonner";
    import { Loader2, XCircle } from "lucide-svelte";
    import { Card, CardContent } from "$lib/shared/components/ui/card";

    import TechnicianStats from "./technician/TechnicianStats.svelte";
    import TechnicianJobs from "./technician/TechnicianJobs.svelte";
    import TechnicianTools from "./technician/TechnicianTools.svelte";

    let loading = $state(true);
    let stats = $state<any>(null);
    let myJobs = $state<any[]>([]);
    let queue = $state<any[]>([]);
    let myTools = $state<ServiceTool[]>([]);
    let myRequests = $state<ServiceToolRequest[]>([]);
    let error = $state<string | null>(null);
    let userId = $state("");

    // Request Tool State
    let isRequestDialogOpen = $state(false);
    let isSubmittingRequest = $state(false);
    let requestForm = $state({
        toolName: "",
        justification: "",
    });

    async function fetchData() {
        try {
            loading = true;
            error = null;

            if (!userId && typeof window !== "undefined") {
                const u = JSON.parse(localStorage.getItem("user") || "{}");
                userId = u.id;
            }

            const [statsRes, jobsRes, queueRes, tools, requests] =
                await Promise.all([
                    api.get("/service/stats"),
                    api.get(`/service?technicianId=${userId}`),
                    api.get("/service?status=antrian"),
                    ServiceToolsService.getMyTools(),
                    ServiceToolsService.getMyRequests(),
                ]);

            stats = statsRes.data.data;
            myTools = tools;
            myRequests = requests;

            const allMyServices = jobsRes.data.data || [];
            myJobs = allMyServices.filter(
                (s: any) => !["selesai", "batal", "diambil"].includes(s.status),
            );

            queue = queueRes.data.data || [];
        } catch (e: any) {
            console.error("Failed to fetch technician dashboard", e);
            error = e.response?.data?.message || e.message || "Failed to load";
        } finally {
            loading = false;
        }
    }

    async function handleRequestTool() {
        if (!requestForm.toolName || !requestForm.justification) {
            toast.error("Mohon isi semua field");
            return;
        }

        try {
            isSubmittingRequest = true;
            await ServiceToolsService.createRequest(requestForm);
            toast.success("Permintaan alat telah dikirim");
            isRequestDialogOpen = false;
            requestForm = { toolName: "", justification: "" };
            fetchData();
        } catch (e: any) {
            toast.error(
                e.response?.data?.message || "Gagal mengirim permintaan",
            );
        } finally {
            isSubmittingRequest = false;
        }
    }

    onMount(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000); // 1 min refresh
        return () => clearInterval(interval);
    });
</script>

<div class="space-y-6 pb-12">
    <!-- Stats Cards -->
    <TechnicianStats {loading} {stats} />

    {#if loading}
        <div class="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 class="h-10 w-10 animate-spin text-blue-500" />
            <p class="text-sm text-slate-500 animate-pulse">
                Memuat Dashboard...
            </p>
        </div>
    {:else if error}
        <Card class="border-red-200 bg-red-50/50 backdrop-blur-sm">
            <CardContent class="pt-6">
                <div class="flex items-center gap-3 text-red-600 font-medium">
                    <XCircle class="h-5 w-5" />
                    <p>{error}</p>
                </div>
            </CardContent>
        </Card>
    {:else}
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <!-- Left Column: Jobs -->
            <div class="lg:col-span-8 space-y-6">
                <TechnicianJobs {myJobs} {queue} />
            </div>

            <!-- Right Column: Tools -->
            <div class="lg:col-span-4 space-y-6">
                <TechnicianTools
                    {myTools}
                    {myRequests}
                    bind:isRequestDialogOpen
                    {isSubmittingRequest}
                    bind:requestForm
                    {handleRequestTool}
                />
            </div>
        </div>
    {/if}
</div>

<style>
    :global(.animate-in) {
        animation: fadeIn 0.5s ease-out;
    }
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>
