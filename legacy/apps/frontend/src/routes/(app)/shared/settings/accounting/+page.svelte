<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import { Label } from "$lib/shared/components/ui/label";
    import {
        SettingsService,
        type AccountMappingSettings,
        type AccountMapping,
    } from "$lib/features/settings/settings.service";
    import { api } from "$lib/shared/lib/api-client";
    import { toast } from "svelte-sonner";
    import {
        Loader2,
        Save,
        Calculator,
        RotateCcw,
        Briefcase,
        TrendingDown,
        Wallet,
        DollarSign,
        Package,
        ChevronRight,
        Info,
        Wrench,
        Monitor,
        Sofa,
        Car,
        Building,
        Map as MapIcon,
    } from "lucide-svelte";
    import { onMount } from "svelte";

    // State
    let mappings = $state<AccountMapping[]>([]);
    let accounts = $state<any[]>([]);
    let saving = $state(false);
    let loading = $state(true);

    // Grouping for UI
    const MAPPING_GROUPS = [
        {
            id: "assets",
            label: "Aset Tetap",
            icon: Briefcase,
            color: "blue",
            types: [
                "asset_tool",
                "asset_equipment",
                "asset_furniture",
                "asset_vehicle",
                "asset_building",
                "asset_land",
                "asset_other",
            ],
        },
        {
            id: "depreciation",
            label: "Penyusutan",
            icon: TrendingDown,
            color: "orange",
            types: ["depreciation_expense", "accumulated_depreciation"],
        },
        {
            id: "revenue",
            label: "Pendapatan",
            icon: DollarSign,
            color: "green",
            types: ["sales_revenue", "service_revenue"],
        },
        {
            id: "cogs",
            label: "Harga Pokok",
            icon: Package,
            color: "red",
            types: ["cogs_sales", "cogs_service"],
        },
        {
            id: "defaults",
            label: "Akun Default",
            icon: Wallet,
            color: "purple",
            types: [
                "default_cash",
                "owner_equity",
                "accounts_payable",
                "accounts_receivable",
            ],
        },
    ];

    const TYPE_ICONS: Record<string, any> = {
        asset_tool: Wrench,
        asset_equipment: Monitor,
        asset_furniture: Sofa,
        asset_vehicle: Car,
        asset_building: Building,
        asset_land: MapIcon,
        asset_other: Package,
    };

    onMount(async () => {
        try {
            const [mappingsData, accountsRes] = await Promise.all([
                SettingsService.getAccountMappings(),
                api.get("/accounting/accounts"),
            ]);
            mappings = mappingsData.mappings || [];
            accounts = accountsRes.data.data || [];
        } catch (e) {
            console.error(e);
            toast.error("Gagal memuat pengaturan akun");
        } finally {
            loading = false;
        }
    });

    async function saveSettings() {
        saving = true;
        try {
            await SettingsService.setAccountMappings({ mappings });
            toast.success("Pengaturan akun berhasil disimpan");
        } catch (e) {
            toast.error("Gagal menyimpan pengaturan akun");
        } finally {
            saving = false;
        }
    }

    async function resetToDefaults() {
        if (
            !confirm(
                "Reset semua mapping ke default? Perubahan yang belum disimpan akan hilang.",
            )
        )
            return;
        loading = true;
        try {
            // Delete and refetch to get defaults
            await api.put("/settings/account-mappings", { mappings: [] });
            const data = await SettingsService.getAccountMappings();
            mappings = data.mappings || [];
            toast.success("Mapping di-reset ke default");
        } catch (e) {
            toast.error("Gagal reset mapping");
        } finally {
            loading = false;
        }
    }

    function getMappingByType(type: string): AccountMapping | undefined {
        return mappings.find((m) => m.type === type);
    }

    function updateMapping(type: string, accountId: string) {
        const idx = mappings.findIndex((m) => m.type === type);
        if (idx >= 0) {
            mappings[idx].accountId = accountId;
        }
    }

    function getColorClasses(color: string): string {
        const classes: Record<string, string> = {
            blue: "bg-blue-50 text-blue-600 border-blue-100",
            orange: "bg-orange-50 text-orange-600 border-orange-100",
            green: "bg-green-50 text-green-600 border-green-100",
            red: "bg-red-50 text-red-600 border-red-100",
            purple: "bg-purple-50 text-purple-600 border-purple-100",
        };
        return classes[color] || classes.blue;
    }
</script>

<div class="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
    <!-- Header -->
    <div
        class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-sm"
    >
        <div class="flex items-center gap-4">
            <div
                class="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg shadow-indigo-500/20"
            >
                <Calculator class="h-8 w-8" />
            </div>
            <div>
                <div
                    class="flex items-center gap-2 text-slate-500 text-sm mb-1"
                >
                    <a href="/settings" class="hover:text-indigo-600"
                        >Pengaturan</a
                    >
                    <ChevronRight class="h-4 w-4" />
                    <span class="text-slate-900 font-medium"
                        >Mapping Akuntansi</span
                    >
                </div>
                <h1
                    class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-600 dark:from-indigo-400 dark:to-purple-400"
                >
                    Konfigurasi Akun
                </h1>
                <p class="text-muted-foreground text-sm font-medium">
                    Atur mapping akun default untuk transaksi otomatis.
                </p>
            </div>
        </div>
        <div class="flex gap-3">
            <Button
                variant="outline"
                onclick={resetToDefaults}
                disabled={saving || loading}
                class="rounded-xl"
            >
                <RotateCcw class="mr-2 h-4 w-4" />
                Reset Default
            </Button>
            <Button
                onclick={saveSettings}
                disabled={saving || loading}
                size="lg"
                class="rounded-xl shadow-lg shadow-indigo-500/20 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
                {#if saving}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                {:else}
                    <Save class="mr-2 h-4 w-4" />
                    Simpan Perubahan
                {/if}
            </Button>
        </div>
    </div>

    {#if loading}
        <div class="flex justify-center py-20">
            <Loader2 class="h-10 w-10 animate-spin text-indigo-500" />
        </div>
    {:else}
        <!-- Info Banner -->
        <div
            class="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex gap-3"
        >
            <Info class="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
            <div class="text-sm text-indigo-800">
                <p class="font-semibold">Apa itu Account Mapping?</p>
                <p class="text-indigo-600/80">
                    Mapping akun memungkinkan sistem untuk secara otomatis
                    memilih akun debit/kredit yang benar saat mencatat
                    transaksi. Akuntan dapat menyesuaikan kode akun di sini
                    untuk menyesuaikan struktur Chart of Accounts yang
                    diinginkan.
                </p>
            </div>
        </div>

        <!-- Mapping Groups -->
        <div class="space-y-6">
            {#each MAPPING_GROUPS as group}
                {@const GroupIcon = group.icon}
                <div
                    class="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/20 shadow-sm overflow-hidden"
                >
                    <!-- Group Header -->
                    <div
                        class="px-6 py-4 border-b border-slate-100 flex items-center gap-3"
                    >
                        <div
                            class="p-2 rounded-lg {getColorClasses(
                                group.color,
                            )}"
                        >
                            <GroupIcon class="h-5 w-5" />
                        </div>
                        <h3 class="font-bold text-lg text-foreground">
                            {group.label}
                        </h3>
                    </div>

                    <!-- Mappings -->
                    <div class="divide-y divide-slate-100">
                        {#each group.types as type}
                            {@const mapping = getMappingByType(type)}
                            {#if mapping}
                                <div
                                    class="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-slate-50/50 transition-colors"
                                >
                                    <div
                                        class="flex items-center gap-3 flex-1 min-w-0"
                                    >
                                        {#if TYPE_ICONS[type]}
                                            {@const TypeIcon = TYPE_ICONS[type]}
                                            <TypeIcon
                                                class="h-4 w-4 text-slate-400 shrink-0"
                                            />
                                        {:else}
                                            <div
                                                class="w-4 h-4 rounded-full bg-slate-200"
                                            ></div>
                                        {/if}
                                        <div class="min-w-0">
                                            <Label
                                                class="text-sm font-semibold text-foreground block"
                                            >
                                                {mapping.label}
                                            </Label>
                                            {#if mapping.description}
                                                <p
                                                    class="text-xs text-muted-foreground truncate"
                                                >
                                                    {mapping.description}
                                                </p>
                                            {/if}
                                        </div>
                                    </div>
                                    <div class="sm:w-72">
                                        <select
                                            value={mapping.accountId}
                                            onchange={(e) =>
                                                updateMapping(
                                                    type,
                                                    (
                                                        e.target as HTMLSelectElement
                                                    ).value,
                                                )}
                                            class="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        >
                                            <option value="" disabled
                                                >Pilih Akun</option
                                            >
                                            {#each accounts as account}
                                                <option value={account.id}>
                                                    {account.code} - {account.name}
                                                </option>
                                            {/each}
                                        </select>
                                    </div>
                                </div>
                            {/if}
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>
