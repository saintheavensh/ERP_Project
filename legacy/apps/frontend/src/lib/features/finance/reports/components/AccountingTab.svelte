<script lang="ts">
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
        CardDescription,
    } from "$lib/shared/components/ui/card";
    import {
        Calculator,
        ClipboardList,
        Briefcase,
        Package,
        DollarSign,
    } from "lucide-svelte";
    import ProfitLossTree from "./ProfitLossTree.svelte";
    import type { ProfitAndLoss } from "$lib/features/finance/reports/reports.service";

    interface Props {
        profitLoss: ProfitAndLoss | null;
        accountTree: any[];
        mappingSettings: any;
    }

    let { profitLoss, accountTree, mappingSettings }: Props = $props();
</script>

<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    <!-- Quick Links Card -->
    <Card
        class="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20"
    >
        <CardHeader>
            <CardTitle
                class="flex items-center gap-2 text-purple-700 dark:text-purple-300"
            >
                <Calculator class="h-5 w-5" />
                Modul Akuntansi
            </CardTitle>
            <CardDescription>Akses fitur akuntansi profesional</CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
            <a
                href="/accounting/accounts"
                class="flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-zinc-800/60 hover:bg-white dark:hover:bg-zinc-800 transition-all border border-purple-100 dark:border-purple-800"
            >
                <div
                    class="p-2 rounded-lg bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300"
                >
                    <ClipboardList class="h-4 w-4" />
                </div>
                <div>
                    <p class="font-semibold text-sm">Chart of Accounts</p>
                    <p class="text-xs text-muted-foreground">
                        Kelola daftar akun
                    </p>
                </div>
            </a>
            <a
                href="/accounting/journals"
                class="flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-zinc-800/60 hover:bg-white dark:hover:bg-zinc-800 transition-all border border-purple-100 dark:border-purple-800"
            >
                <div
                    class="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                >
                    <Briefcase class="h-4 w-4" />
                </div>
                <div>
                    <p class="font-semibold text-sm">Jurnal Umum</p>
                    <p class="text-xs text-muted-foreground">
                        Lihat entri jurnal
                    </p>
                </div>
            </a>
            <a
                href="/accounting/assets"
                class="flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-zinc-800/60 hover:bg-white dark:hover:bg-zinc-800 transition-all border border-purple-100 dark:border-purple-800"
            >
                <div
                    class="p-2 rounded-lg bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300"
                >
                    <Package class="h-4 w-4" />
                </div>
                <div>
                    <p class="font-semibold text-sm">Aset Tetap</p>
                    <p class="text-xs text-muted-foreground">
                        Kelola & penyusutan
                    </p>
                </div>
            </a>
            <a
                href="/settings/accounting"
                class="flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-zinc-800/60 hover:bg-white dark:hover:bg-zinc-800 transition-all border border-purple-100 dark:border-purple-800"
            >
                <div
                    class="p-2 rounded-lg bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300"
                >
                    <DollarSign class="h-4 w-4" />
                </div>
                <div>
                    <p class="font-semibold text-sm">Mapping Akun</p>
                    <p class="text-xs text-muted-foreground">
                        Konfigurasi akun default
                    </p>
                </div>
            </a>
        </CardContent>
    </Card>

    <!-- P&L Summary Card (Pro) -->
    <div class="lg:col-span-2">
        <ProfitLossTree {profitLoss} {accountTree} {mappingSettings} />
    </div>
</div>

