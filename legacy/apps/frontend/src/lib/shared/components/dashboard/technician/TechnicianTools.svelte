<script lang="ts">
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { Badge } from "$lib/shared/components/ui/badge";
    import { Button } from "$lib/shared/components/ui/button";
    import { Hammer, Plus, Send, ChevronRight, Loader2 } from "lucide-svelte";
    import * as Dialog from "$lib/shared/components/ui/dialog";
    import { Label } from "$lib/shared/components/ui/label";
    import { Input } from "$lib/shared/components/ui/input";
    import { Textarea } from "$lib/shared/components/ui/textarea";
    import { goto } from "$app/navigation";
    import { cn } from "$lib/shared/lib/utils";

    let {
        myTools = [],
        myRequests = [],
        isRequestDialogOpen = $bindable(false),
        isSubmittingRequest = false,
        requestForm = $bindable({ toolName: "", justification: "" }),
        handleRequestTool,
    } = $props();

    function getReqStatusColor(status: string) {
        const colors: Record<string, string> = {
            pending: "bg-amber-100 text-amber-700 border-amber-200",
            approved: "bg-green-100 text-green-700 border-green-200",
            rejected: "bg-red-100 text-red-700 border-red-200",
        };
        return colors[status] || "bg-gray-100 text-gray-700";
    }
</script>

<div class="space-y-6">
    <!-- My Tools -->
    <Card class="border-none shadow-xl bg-white/80 backdrop-blur-md">
        <CardHeader
            class="pb-3 flex flex-row items-center justify-between space-y-0"
        >
            <CardTitle class="flex items-center gap-2 text-xl">
                <Hammer class="h-5 w-5 text-indigo-500" />
                Alat Saya
            </CardTitle>
            <Dialog.Root bind:open={isRequestDialogOpen}>
                <Dialog.Trigger>
                    <Button
                        size="sm"
                        variant="ghost"
                        class="h-8 w-8 p-0 rounded-full hover:bg-indigo-50 hover:text-indigo-600"
                    >
                        <Plus class="h-5 w-5" />
                    </Button>
                </Dialog.Trigger>
                <Dialog.Content class="sm:max-w-[425px]">
                    <Dialog.Header>
                        <Dialog.Title>Request Alat Baru</Dialog.Title>
                        <Dialog.Description>
                            Ajukan permintaan alat service baru dengan alasan
                            yang jelas.
                        </Dialog.Description>
                    </Dialog.Header>
                    <div class="grid gap-4 py-4">
                        <div class="grid gap-2">
                            <Label for="tool-name">Nama Alat</Label>
                            <Input
                                id="tool-name"
                                placeholder="Contoh: Solder JBC, Multimeter, dll"
                                bind:value={requestForm.toolName}
                            />
                        </div>
                        <div class="grid gap-2">
                            <Label for="justification"
                                >Justifikasi / Alasan</Label
                            >
                            <Textarea
                                id="justification"
                                placeholder="Jelaskan mengapa Anda membutuhkan alat ini..."
                                rows={4}
                                bind:value={requestForm.justification}
                            />
                        </div>
                    </div>
                    <Dialog.Footer>
                        <Button
                            type="submit"
                            class="w-full bg-indigo-600 hover:bg-indigo-700"
                            disabled={isSubmittingRequest}
                            onclick={handleRequestTool}
                        >
                            {#if isSubmittingRequest}
                                <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                                Mengirim...
                            {:else}
                                <Send class="mr-2 h-4 w-4" />
                                Kirim Permintaan
                            {/if}
                        </Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Root>
        </CardHeader>
        <CardContent>
            {#if myTools?.length}
                <div class="space-y-4">
                    {#each myTools as tool}
                        <div class="flex items-center justify-between group">
                            <div class="flex items-center gap-3">
                                <div
                                    class="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors"
                                >
                                    <Hammer class="h-5 w-5" />
                                </div>
                                <div>
                                    <p
                                        class="text-sm font-bold text-slate-900 leading-none"
                                    >
                                        {tool.name}
                                    </p>
                                    {#if tool.brand}
                                        <p class="text-xs text-slate-500 mt-1">
                                            {tool.brand}
                                        </p>
                                    {/if}
                                </div>
                            </div>
                            <Badge
                                class="bg-indigo-50 text-indigo-600 border-indigo-100 font-medium"
                            >
                                x{tool.qty}
                            </Badge>
                        </div>
                    {/each}
                </div>
                <div class="mt-6 pt-4 border-t">
                    <Button
                        variant="outline"
                        class="w-full text-indigo-600 border-indigo-100 hover:bg-indigo-50 hover:text-indigo-700 font-semibold"
                        onclick={() => goto("/service-tools")}
                    >
                        Kelola & Lapor Alat
                        <ChevronRight class="ml-2 h-4 w-4" />
                    </Button>
                </div>
            {:else}
                <div
                    class="flex flex-col items-center justify-center py-6 text-center"
                >
                    <p class="text-sm text-slate-500">
                        Belum ada alat yang ditugaskan.
                    </p>
                    <Button
                        variant="link"
                        class="text-indigo-600 font-semibold p-0 h-auto mt-1"
                        onclick={() => (isRequestDialogOpen = true)}
                    >
                        Minta alat sekarang
                    </Button>
                </div>
            {/if}
        </CardContent>
    </Card>

    <!-- Tool Requests -->
    {#if myRequests?.length}
        <Card class="border-none shadow-xl bg-white/80 backdrop-blur-md">
            <CardHeader class="pb-3">
                <CardTitle class="flex items-center gap-2 text-lg">
                    <Send class="h-4 w-4 text-slate-500" />
                    Riwayat Permintaan
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div class="space-y-4">
                    {#each myRequests as req}
                        <div
                            class="p-3 rounded-xl border border-slate-50 bg-slate-50/30"
                        >
                            <div class="flex items-center justify-between mb-2">
                                <p class="text-sm font-bold text-slate-900">
                                    {req.toolName}
                                </p>
                                <Badge
                                    class={cn(
                                        "text-[10px] uppercase tracking-wider border",
                                        getReqStatusColor(req.status),
                                    )}
                                >
                                    {req.status}
                                </Badge>
                            </div>
                            <p
                                class="text-xs text-slate-500 line-clamp-2 italic"
                            >
                                "{req.justification}"
                            </p>
                        </div>
                    {/each}
                </div>
            </CardContent>
        </Card>
    {/if}
</div>
