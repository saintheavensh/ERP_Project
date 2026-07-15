<script lang="ts">
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { Button } from "$lib/shared/components/ui/button";
    import {
        ShieldAlert,
        Server,
        Activity,
        Users,
        Database,
    } from "lucide-svelte";
    import { authStore } from "$lib/shared/lib/auth-store.svelte";

    const user = $derived(authStore.user);
</script>

<div class="space-y-8 animate-in fade-in-50 duration-500">
    <div class="flex flex-col gap-2">
        <h1 class="text-3xl font-bold tracking-tight text-red-600">
            Super Admin Console
        </h1>
        <p class="text-muted-foreground">
            System health, global configuration, and security monitoring.
        </p>
    </div>

    <!-- System Health -->
    <div class="grid gap-4 md:grid-cols-3">
        <Card>
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium">System Status</CardTitle>
                <Activity class="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold text-emerald-600">
                    Operational
                </div>
                <p class="text-xs text-muted-foreground">Uptime 99.9%</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium"
                    >Active Sessions</CardTitle
                >
                <Users class="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">42</div>
                <p class="text-xs text-muted-foreground">
                    Current active users
                </p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium">Database Load</CardTitle>
                <Database class="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">12%</div>
                <p class="text-xs text-muted-foreground">Optimal performance</p>
            </CardContent>
        </Card>
    </div>

    <!-- Admin Actions -->
    <div class="grid gap-6 md:grid-cols-2">
        <div class="space-y-4">
            <h3 class="text-lg font-semibold tracking-tight">
                System Configuration
            </h3>
            <div class="grid grid-cols-2 gap-3">
                <Button
                    variant="outline"
                    class="h-24 flex flex-col gap-2 hover:bg-red-50 dark:hover:bg-red-900/10"
                    href="/superadmin/tenants"
                >
                    <Server class="h-6 w-6 text-red-600" />
                    <span>Tenant Management</span>
                </Button>
                <Button
                    variant="outline"
                    class="h-24 flex flex-col gap-2"
                    href="/superadmin/audit-logs"
                >
                    <ShieldAlert class="h-6 w-6" />
                    <span>Audit Logs</span>
                </Button>
            </div>
        </div>

        <div class="space-y-4">
            <h3 class="text-lg font-semibold tracking-tight">Maintenance</h3>
            <div class="p-6 border rounded-xl bg-muted/30">
                <div class="flex items-center justify-between mb-4">
                    <div class="font-medium">Cache Status</div>
                    <div class="text-sm text-muted-foreground">
                        Last cleared: 2h ago
                    </div>
                </div>
                <Button variant="secondary" size="sm" class="w-full">
                    Clear System Cache
                </Button>
                <div class="flex items-center justify-between mt-4 mb-4">
                    <div class="font-medium">Backup Status</div>
                    <div class="text-sm text-emerald-600">Synced</div>
                </div>
                <Button variant="secondary" size="sm" class="w-full">
                    Trigger Manual Backup
                </Button>
            </div>
        </div>
    </div>
</div>
