<script lang="ts">
    import { api } from "$lib/shared/lib/api-client";
    import { onMount } from "svelte";
    import { Button } from "$lib/shared/components/ui/button";
    import { Badge } from "$lib/shared/components/ui/badge";
    import { Check, X, Clock, AlertCircle, Loader2 } from "lucide-svelte";
    import { toast } from "svelte-sonner";
    import { formatCurrency } from "$lib/shared/lib/utils";

    let approvals = $state<any[]>([]);
    let loading = $state(true);

    async function fetchPending() {
        try {
            loading = true;
            const res = await api.get("/approvals/pending");
            approvals = res.data.data;
        } catch (e) {
            console.error("Failed to fetch approvals", e);
        } finally {
            loading = false;
        }
    }

    async function handleAction(id: string, action: "APPROVED" | "REJECTED") {
        try {
            await api.post(`/approvals/${id}/approve`, { status: action });
            toast.success(`Request ${action.toLowerCase()} successfully`);
            fetchPending();
        } catch (e: any) {
            toast.error(
                e.response?.data?.message || "Failed to process approval",
            );
        }
    }

    onMount(fetchPending);
</script>

<div class="space-y-4">
    {#if loading}
        <div class="flex items-center justify-center p-8">
            <Loader2 class="h-8 w-8 animate-spin text-primary" />
        </div>
    {:else if approvals.length === 0}
        <div
            class="text-center p-8 text-muted-foreground bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700"
        >
            <Check class="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>No pending approvals</p>
        </div>
    {:else}
        <div class="grid gap-3">
            {#each approvals as req}
                <div
                    class="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                >
                    <div class="flex items-start gap-3">
                        <div
                            class="mt-1 p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full"
                        >
                            <Clock class="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="font-bold">{req.requestType}</span>
                                <Badge variant="outline" class="text-[10px]"
                                    >{req.id}</Badge
                                >
                            </div>
                            <p class="text-sm text-muted-foreground mt-0.5">
                                Requester: {req.requesterId} • {new Date(
                                    req.createdAt,
                                ).toLocaleTimeString()}
                            </p>
                            {#if req.metadata?.discountAmount}
                                <div
                                    class="mt-2 text-sm bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg inline-block border border-slate-100 dark:border-slate-700"
                                >
                                    Discount: <span
                                        class="font-bold text-red-600"
                                        >{formatCurrency(
                                            req.metadata.discountAmount,
                                        )}</span
                                    >
                                </div>
                            {/if}
                        </div>
                    </div>

                    <div class="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            class="h-10 w-10 p-0 text-red-600 hover:bg-red-50"
                            onclick={() => handleAction(req.id, "REJECTED")}
                        >
                            <X class="h-5 w-5" />
                        </Button>
                        <Button
                            size="sm"
                            class="h-10 w-10 p-0 bg-emerald-600 hover:bg-emerald-700"
                            onclick={() => handleAction(req.id, "APPROVED")}
                        >
                            <Check class="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>
