<script lang="ts">
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { Badge } from "$lib/shared/components/ui/badge";
    import { Button } from "$lib/shared/components/ui/button";
    import { Wrench, ListTodo, Clock, User, ChevronRight } from "lucide-svelte";
    import { goto } from "$app/navigation";
    import { cn } from "$lib/shared/lib/utils";

    let { myJobs = [], queue = [] } = $props();

    function getStatusColor(status: string) {
        const colors: Record<string, string> = {
            antrian: "bg-gray-100 text-gray-700",
            dicek: "bg-blue-100 text-blue-700",
            konfirmasi: "bg-amber-100 text-amber-700",
            dikerjakan: "bg-purple-100 text-purple-700",
            "re-konfirmasi": "bg-orange-100 text-orange-700",
        };
        return colors[status] || "bg-gray-100 text-gray-700";
    }
</script>

<div class="space-y-6">
    <!-- My Jobs -->
    <Card class="border-none shadow-xl bg-white/80 backdrop-blur-md">
        <CardHeader class="pb-3 flex flex-row items-center justify-between">
            <CardTitle class="flex items-center gap-2 text-xl">
                <Wrench class="h-5 w-5 text-blue-500" />
                Job Saya
            </CardTitle>
            <Badge
                variant="outline"
                class="bg-blue-50 text-blue-600 border-blue-100"
            >
                {myJobs.length} Aktif
            </Badge>
        </CardHeader>
        <CardContent>
            {#if myJobs?.length}
                <div class="space-y-3">
                    {#each myJobs as job}
                        <button
                            onclick={() => goto(`/service/${job.id}`)}
                            class="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 hover:border-blue-200 hover:shadow-md transition-all text-left group"
                        >
                            <div class="flex items-center gap-4">
                                <div
                                    class="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors"
                                >
                                    <User
                                        class="h-6 w-6 text-slate-400 group-hover:text-blue-500"
                                    />
                                </div>
                                <div>
                                    <p class="font-bold text-slate-900">
                                        {job.no}
                                    </p>
                                    <p
                                        class="text-sm text-slate-500 flex items-center gap-1.5"
                                    >
                                        <span class="font-medium text-slate-700"
                                            >{job.customer?.name ||
                                                "Customer"}</span
                                        >
                                        <span class="text-slate-300">•</span>
                                        <span
                                            >{job.device?.brand || ""}
                                            {job.device?.model || ""}</span
                                        >
                                    </p>
                                </div>
                            </div>
                            <div class="flex items-center gap-4">
                                <Badge
                                    class={cn(
                                        "px-2.5 py-0.5 rounded-full font-medium capitalize",
                                        getStatusColor(job.status),
                                    )}
                                >
                                    {job.status}
                                </Badge>
                                <div
                                    class="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 group-hover:bg-blue-500 group-hover:text-white transition-all text-slate-400"
                                >
                                    <ChevronRight class="h-5 w-5" />
                                </div>
                            </div>
                        </button>
                    {/each}
                </div>
            {:else}
                <div
                    class="flex flex-col items-center justify-center py-12 px-4 text-center"
                >
                    <div
                        class="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4"
                    >
                        <Wrench class="h-8 w-8 text-slate-300" />
                    </div>
                    <h3 class="font-semibold text-slate-900">
                        Tidak ada job aktif
                    </h3>
                    <p class="text-sm text-slate-500 max-w-[240px] mt-1">
                        Semua pekerjaan telah selesai. Silakan ambil job baru
                        dari antrian tersedia.
                    </p>
                </div>
            {/if}
        </CardContent>
    </Card>

    <!-- Queue -->
    <Card class="border-none shadow-xl bg-white/80 backdrop-blur-md">
        <CardHeader class="pb-3 flex flex-row items-center justify-between">
            <CardTitle class="flex items-center gap-2 text-xl">
                <ListTodo class="h-5 w-5 text-amber-500" />
                Antrian Tersedia
            </CardTitle>
        </CardHeader>
        <CardContent>
            {#if queue?.length}
                <div class="space-y-3">
                    {#each queue as job}
                        <div
                            class="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-amber-200 transition-all text-left"
                        >
                            <div class="flex items-center gap-4">
                                <div
                                    class="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center"
                                >
                                    <Clock class="h-6 w-6 text-slate-400" />
                                </div>
                                <div>
                                    <p class="font-bold text-slate-900">
                                        {job.no}
                                    </p>
                                    <p
                                        class="text-sm text-slate-500 leading-relaxed max-w-[400px]"
                                    >
                                        <span class="font-medium text-slate-700"
                                            >{job.device?.brand || ""}
                                            {job.device?.model || ""}</span
                                        >
                                        <span class="text-slate-300">•</span>
                                        <span>{job.complaint}</span>
                                    </p>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                class="rounded-full border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700 font-semibold px-5"
                                onclick={() => goto(`/service/${job.id}`)}
                            >
                                Cek Job
                            </Button>
                        </div>
                    {/each}
                </div>
            {:else}
                <div
                    class="flex flex-col items-center justify-center py-12 px-4 text-center"
                >
                    <div
                        class="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4"
                    >
                        <Clock class="h-8 w-8 text-slate-300" />
                    </div>
                    <h3 class="font-semibold text-slate-900">Antrian kosong</h3>
                    <p class="text-sm text-slate-500 mt-1">
                        Belum ada kiriman service baru yang masuk ke antrian.
                    </p>
                </div>
            {/if}
        </CardContent>
    </Card>
</div>
