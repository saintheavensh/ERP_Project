<script lang="ts">
    import { Card, CardContent } from "$lib/shared/components/ui/card";
    import { DollarSign, Wrench, CheckCircle2, XCircle } from "lucide-svelte";

    let { loading, stats } = $props();
</script>

<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <!-- Profit -->
    <Card class="border-l-4 border-l-green-500 overflow-hidden relative group">
        <CardContent class="pt-6">
            <div class="flex items-center justify-between">
                <div>
                    <p
                        class="text-sm text-muted-foreground uppercase tracking-wider font-semibold"
                    >
                        Keuntungan Bulan Ini
                    </p>
                    <p class="text-2xl font-bold text-green-600 mt-1">
                        {loading
                            ? "..."
                            : `Rp ${(stats?.profit || 0).toLocaleString("id-ID")}`}
                    </p>
                </div>
                <div
                    class="p-3 rounded-xl bg-green-50 group-hover:scale-110 transition-transform"
                >
                    <DollarSign class="h-6 w-6 text-green-500" />
                </div>
            </div>
        </CardContent>
    </Card>

    <!-- Total Service -->
    <Card class="border-l-4 border-l-blue-500 overflow-hidden relative group">
        <CardContent class="pt-6">
            <div class="flex items-center justify-between">
                <div>
                    <p
                        class="text-sm text-muted-foreground uppercase tracking-wider font-semibold"
                    >
                        Total Service
                    </p>
                    <p class="text-2xl font-bold text-blue-600 mt-1">
                        {loading ? "..." : stats?.total || 0}
                    </p>
                </div>
                <div
                    class="p-3 rounded-xl bg-blue-50 group-hover:scale-110 transition-transform"
                >
                    <Wrench class="h-6 w-6 text-blue-500" />
                </div>
            </div>
        </CardContent>
    </Card>

    <!-- Success -->
    <Card class="border-l-4 border-l-indigo-500 overflow-hidden relative group">
        <CardContent class="pt-6">
            <div class="flex items-center justify-between">
                <div>
                    <p
                        class="text-sm text-muted-foreground uppercase tracking-wider font-semibold"
                    >
                        Sukses (Selesai)
                    </p>
                    <p class="text-2xl font-bold text-indigo-600 mt-1">
                        {loading ? "..." : stats?.success || 0}
                    </p>
                </div>
                <div
                    class="p-3 rounded-xl bg-indigo-50 group-hover:scale-110 transition-transform"
                >
                    <CheckCircle2 class="h-6 w-6 text-indigo-500" />
                </div>
            </div>
        </CardContent>
    </Card>

    <!-- Failed -->
    <Card class="border-l-4 border-l-red-500 overflow-hidden relative group">
        <CardContent class="pt-6">
            <div class="flex items-center justify-between">
                <div>
                    <p
                        class="text-sm text-muted-foreground uppercase tracking-wider font-semibold"
                    >
                        Gagal (Batal)
                    </p>
                    <p class="text-2xl font-bold text-red-600 mt-1">
                        {loading ? "..." : stats?.failed || 0}
                    </p>
                </div>
                <div
                    class="p-3 rounded-xl bg-red-50 group-hover:scale-110 transition-transform"
                >
                    <XCircle class="h-6 w-6 text-red-500" />
                </div>
            </div>
        </CardContent>
    </Card>
</div>
