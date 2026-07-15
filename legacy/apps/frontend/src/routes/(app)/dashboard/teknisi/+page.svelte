<script lang="ts">
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { Button } from "$lib/shared/components/ui/button";
    import { Wrench, ClipboardList, Clock } from "lucide-svelte";
    import { authStore } from "$lib/shared/lib/auth-store.svelte";

    const user = $derived(authStore.user);
</script>

<div class="space-y-6">
    <div class="flex flex-col gap-2">
        <h1 class="text-3xl font-bold tracking-tight">Dashboard Teknisi</h1>
        <p class="text-muted-foreground">
            Selamat datang kembali, {user?.name || "Teknisi"}.
        </p>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
        <Card>
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium"
                    >Service Menunggu</CardTitle
                >
                <Clock class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">4</div>
                <p class="text-xs text-muted-foreground">
                    Perlu tindakan segera
                </p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium"
                    >Dalam Pengerjaan</CardTitle
                >
                <Wrench class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">2</div>
                <p class="text-xs text-muted-foreground">Sedang diproses</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium"
                    >Selesai Hari Ini</CardTitle
                >
                <ClipboardList class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">5</div>
                <p class="text-xs text-muted-foreground">+2 dari kemarin</p>
            </CardContent>
        </Card>
    </div>

    <!-- Quick Actions -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Button
            size="lg"
            class="h-auto py-4 flex flex-col gap-2"
            variant="outline"
            href="/service/jobs"
        >
            <Wrench class="h-6 w-6" />
            <span>Lihat Pekerjaan</span>
        </Button>
    </div>
</div>
