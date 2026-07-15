<script lang="ts">
    import { onMount } from "svelte";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { Button } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/shared/components/ui/table";
    import {
        ClipboardList,
        ChevronRight,
        Loader2,
        Search,
        User,
        FileText,
        Plus,
        Pencil,
        Trash2,
        CreditCard,
        Lock,
    } from "lucide-svelte";
    import { api } from "$lib/shared/lib/api-client";

    let loading = $state(true);
    let logs = $state<any[]>([]);
    let searchQuery = $state("");
    let filterAction = $state("");

    async function fetchLogs() {
        try {
            loading = true;
            const params: any = { limit: 100 };
            if (filterAction) params.action = filterAction;
            const res = await api.get("/accounting/audit-logs", { params });
            logs = res.data;
        } catch (e) {
            console.error("Failed to fetch audit logs", e);
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        fetchLogs();
    });

    const formatDateTime = (date: string) =>
        new Date(date).toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

    function getActionIcon(action: string) {
        switch (action) {
            case "CREATE":
                return Plus;
            case "UPDATE":
                return Pencil;
            case "DELETE":
                return Trash2;
            case "PAY":
                return CreditCard;
            case "VOID":
                return Trash2;
            case "CLOSE":
                return Lock;
            default:
                return FileText;
        }
    }

    function getActionColor(action: string) {
        switch (action) {
            case "CREATE":
                return "bg-green-100 text-green-700";
            case "UPDATE":
                return "bg-blue-100 text-blue-700";
            case "DELETE":
                return "bg-red-100 text-red-700";
            case "PAY":
                return "bg-purple-100 text-purple-700";
            case "VOID":
                return "bg-orange-100 text-orange-700";
            case "CLOSE":
                return "bg-slate-100 text-slate-700";
            default:
                return "bg-slate-100 text-slate-700";
        }
    }

    function formatDescription(desc: string) {
        try {
            // Check if looks like JSON
            if (
                desc &&
                (desc.trim().startsWith("{") || desc.trim().startsWith("["))
            ) {
                const parsed = JSON.parse(desc);
                // Humanize common patterns
                if (
                    parsed.monthlyTotal !== undefined &&
                    parsed.dailyTarget !== undefined
                ) {
                    return `Updated targets: Monthly ${parsed.monthlyTotal}, Daily ${parsed.dailyTarget}`;
                }
                const keys = Object.keys(parsed).join(", ");
                return `Updated: ${keys}`;
            }
            return desc;
        } catch (e) {
            return desc;
        }
    }

    let filteredLogs = $derived.by(() => {
        if (!searchQuery) return logs;
        const q = searchQuery.toLowerCase();
        return logs.filter(
            (log) =>
                log.entityType?.toLowerCase().includes(q) ||
                log.entityId?.toLowerCase().includes(q) ||
                log.tableName?.toLowerCase().includes(q),
        );
    });
</script>

<div class="space-y-6 animate-in fade-in duration-500 pb-10">
    <!-- Header -->
    <div
        class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
    >
        <div>
            <div class="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <a href="/accounting" class="hover:text-blue-600">Akuntansi</a>
                <ChevronRight class="h-4 w-4" />
                <span class="text-slate-900 font-medium">Audit Log</span>
            </div>
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
                Riwayat Perubahan
            </h1>
        </div>

        <div class="flex items-center gap-3">
            <div class="relative">
                <Search
                    class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                />
                <Input
                    bind:value={searchQuery}
                    placeholder="Cari..."
                    class="pl-9 w-48"
                />
            </div>
            <select
                bind:value={filterAction}
                onchange={() => fetchLogs()}
                class="px-3 py-2 border rounded-md text-sm"
            >
                <option value="">Semua Aksi</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="PAY">Pay</option>
                <option value="VOID">Void</option>
                <option value="CLOSE">Close</option>
            </select>
        </div>
    </div>

    <!-- Logs List -->
    {#if loading}
        <div class="flex items-center justify-center py-20">
            <Loader2 class="h-8 w-8 animate-spin text-blue-600" />
        </div>
    {:else}
        <Card class="border-0 shadow-lg rounded-2xl overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow class="bg-slate-50">
                        <TableHead class="w-40">Waktu</TableHead>
                        <TableHead class="w-20">Aksi</TableHead>
                        <TableHead>Entitas</TableHead>
                        <TableHead class="w-32">User</TableHead>
                        <TableHead>Detail</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {#each filteredLogs as log}
                        {@const ActionIcon = getActionIcon(log.action)}
                        <TableRow class="hover:bg-slate-50">
                            <TableCell class="text-sm text-slate-500">
                                {formatDateTime(log.createdAt)}
                            </TableCell>
                            <TableCell>
                                <span
                                    class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full {getActionColor(
                                        log.action,
                                    )}"
                                >
                                    <ActionIcon class="h-3 w-3" />
                                    {log.action}
                                </span>
                            </TableCell>
                            <TableCell>
                                <div>
                                    <p class="font-medium">{log.entityType}</p>
                                    <p class="text-xs text-slate-500 font-mono">
                                        {log.entityId}
                                    </p>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div class="flex items-center gap-2">
                                    <div
                                        class="p-1.5 bg-slate-100 rounded-full"
                                    >
                                        <User class="h-3 w-3 text-slate-500" />
                                    </div>
                                    <span class="text-sm"
                                        >{log.userId || "System"}</span
                                    >
                                </div>
                            </TableCell>
                            <TableCell
                                class="text-sm text-slate-500 max-w-xs truncate"
                            >
                                {#if log.description}
                                    {formatDescription(log.description)}
                                {:else if log.reason}
                                    {log.reason}
                                {:else if log.newValues}
                                    {formatDescription(
                                        JSON.stringify(log.newValues),
                                    )}
                                {:else}
                                    -
                                {/if}
                            </TableCell>
                        </TableRow>
                    {:else}
                        <TableRow>
                            <TableCell
                                colspan={5}
                                class="text-center py-10 text-slate-500"
                            >
                                Tidak ada log audit
                            </TableCell>
                        </TableRow>
                    {/each}
                </TableBody>
            </Table>
        </Card>
    {/if}
</div>
