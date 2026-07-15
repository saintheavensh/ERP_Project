<script lang="ts">
    import { onMount } from "svelte";
    import { api } from "$lib/shared/lib/api-client";
    import {
        Card,
        CardContent,
        CardDescription,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { Badge } from "$lib/shared/components/ui/badge";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/shared/components/ui/table";
    import { Shield, KeyRound, Loader2, ChevronRight } from "lucide-svelte";
    import { authStore, ROLE_CONFIG } from "$lib/shared/lib/auth-store.svelte";

    let roles = $state<any[]>([]);
    let loading = $state(true);

    onMount(async () => {
        try {
            const res = await api.get("/auth/roles");
            roles = res.data.data || [];
        } catch (e) {
            console.error("Failed to fetch roles", e);
        } finally {
            loading = false;
        }
    });

    function getRoleIcon(id: string) {
        return ROLE_CONFIG[id]?.icon || "👤";
    }

    function getRoleLabel(id: string) {
        return ROLE_CONFIG[id]?.label || id;
    }
</script>

<div class="space-y-6 animate-in fade-in duration-500 pb-10">
    <div class="flex items-center justify-between">
        <div>
            <div class="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <span class="hover:text-blue-600 cursor-pointer"
                    >Pengaturan</span
                >
                <ChevronRight class="h-4 w-4" />
                <span class="text-slate-900 font-medium">Akses & Roles</span>
            </div>
            <h1 class="text-3xl font-bold tracking-tight text-slate-900">
                Manajemen Akses
            </h1>
            <p class="text-slate-500 mt-1">
                Daftar peran sistem dan hak akses yang tersedia.
            </p>
        </div>
    </div>

    {#if loading}
        <div class="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 class="h-10 w-10 animate-spin text-blue-600" />
            <p class="text-slate-500 animate-pulse">Memuat data peran...</p>
        </div>
    {:else}
        <div class="grid gap-6">
            <Card class="border-0 shadow-lg rounded-2xl overflow-hidden">
                <TableHeader class="bg-slate-50">
                    <TableRow>
                        <TableHead class="w-16"></TableHead>
                        <TableHead>Nama Peran</TableHead>
                        <TableHead>ID Sistem</TableHead>
                        <TableHead>Izin / Permissions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {#each roles as role}
                        <TableRow
                            class="hover:bg-slate-50/50 transition-colors"
                        >
                            <TableCell class="text-center text-xl">
                                {getRoleIcon(role.id)}
                            </TableCell>
                            <TableCell class="font-bold text-slate-700">
                                {getRoleLabel(role.id)}
                            </TableCell>
                            <TableCell>
                                <code
                                    class="bg-slate-100 px-1.5 py-0.5 rounded text-xs text-blue-700 font-mono"
                                >
                                    {role.id}
                                </code>
                            </TableCell>
                            <TableCell>
                                <div class="flex flex-wrap gap-1.5">
                                    {#each role.permissions || [] as perm}
                                        <Badge
                                            variant="outline"
                                            class="bg-blue-50/50 text-blue-700 border-blue-100 text-[10px] font-medium"
                                        >
                                            {perm}
                                        </Badge>
                                    {:else}
                                        <span
                                            class="text-slate-400 text-xs italic"
                                            >Tidak ada izin khusus</span
                                        >
                                    {/each}
                                </div>
                            </TableCell>
                        </TableRow>
                    {/each}
                </TableBody>
            </Card>

            <div
                class="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex gap-4"
            >
                <div
                    class="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0"
                >
                    <Shield class="h-5 w-5 text-amber-600" />
                </div>
                <div>
                    <h3 class="font-bold text-amber-900 mb-1 text-lg">
                        Catatan Penting
                    </h3>
                    <p class="text-amber-800 text-sm leading-relaxed">
                        Data peran (Roles) bersifat sistem dan hanya dapat
                        dimodifikasi melalui konfigurasi backend atau seeder
                        untuk memastikan stabilitas akses. Jika Anda memerlukan
                        peran baru, silakan hubungi tim pengembang.
                    </p>
                </div>
            </div>
        </div>
    {/if}
</div>
