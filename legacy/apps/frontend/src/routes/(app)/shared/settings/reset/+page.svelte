<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import {
        Card,
        CardContent,
        CardDescription,
        CardFooter,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { SettingsService } from "$lib/features/settings/settings.service";
    import { toast } from "svelte-sonner";
    import {
        Loader2,
        Database,
        AlertTriangle,
        RefreshCcw,
        ShieldAlert,
        CircleCheck,
        ArrowRight,
    } from "lucide-svelte";

    let loading = $state(false);
    let confirmMode = $state<"data" | "full" | null>(null);
    let confirmInput = $state("");

    async function handleReset() {
        if (!confirmMode) return;
        if (confirmInput !== "RESET") {
            toast.error("Konfirmasi salah. Ketik 'RESET' dengan huruf besar.");
            return;
        }

        loading = true;
        try {
            await SettingsService.factoryReset(confirmMode);
            toast.success(
                "Factory Reset berhasil dilakukan. Sistem telah direset.",
            );
            confirmMode = null;
            confirmInput = "";
            // Optional: Reload page or logout
            setTimeout(() => (window.location.href = "/"), 1500);
        } catch (e) {
            toast.error("Gagal melakukan Factory Reset. Hubungi admin.");
            console.error(e);
        } finally {
            loading = false;
        }
    }

    function startReset(mode: "data" | "full") {
        confirmMode = mode;
        confirmInput = "";
    }

    function cancelReset() {
        confirmMode = null;
        confirmInput = "";
    }
</script>

<div class="space-y-10 max-w-4xl mx-auto py-12 animate-in fade-in duration-700">
    <!-- Premium Header -->
    <div
        class="relative overflow-hidden rounded-3xl bg-slate-900 p-8 md:p-12 text-white shadow-2xl"
    >
        <div
            class="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-red-500/20 blur-3xl"
        ></div>
        <div
            class="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl"
        ></div>

        <div class="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div
                class="p-4 bg-red-500 rounded-2xl shadow-lg shadow-red-500/50 animate-pulse"
            >
                <ShieldAlert class="h-10 w-10 text-white" />
            </div>
            <div class="text-center md:text-left">
                <h1
                    class="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 italic"
                >
                    DANGER ZONE
                </h1>
                <p class="text-slate-400 text-lg max-w-xl">
                    Factory Reset akan menghapus data secara permanen. Pastikan
                    Anda sudah membackup data penting sebelum melanjutkan.
                </p>
            </div>
        </div>
    </div>

    {#if confirmMode}
        <div
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300 transition-all"
        >
            <Card
                class="w-full max-w-lg border-2 border-red-500/50 shadow-[0_0_50px_-12px_rgba(239,68,68,0.5)] overflow-hidden rounded-3xl animate-in zoom-in duration-300"
            >
                <CardHeader class="bg-red-50 border-b border-red-100 p-6">
                    <CardTitle
                        class="text-red-700 flex items-center gap-3 text-xl"
                    >
                        <AlertTriangle class="h-6 w-6" />
                        Konfirmasi Tindakan Fatal
                    </CardTitle>
                    <CardDescription class="text-red-600/80 font-medium">
                        Anda akan melakukan {confirmMode === "full"
                            ? "Full System Reset"
                            : "Reset Data Transaksi"}
                    </CardDescription>
                </CardHeader>
                <CardContent class="p-6 space-y-6 bg-white">
                    <div
                        class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-600 leading-relaxed"
                    >
                        {#if confirmMode === "full"}
                            Tindakan ini akan menghapus <strong
                                >seluruh database</strong
                            > termasuk produk, supplier, dan user. Sistem akan kembali
                            ke status awal installasi.
                        {:else}
                            Tindakan ini akan menghapus <strong
                                >seluruh riwayat transaksi</strong
                            > (penjualan, service, hutang, piutang). Master data
                            seperti produk dan user akan tetap aman.
                        {/if}
                    </div>

                    <div class="space-y-3">
                        <Label class="text-slate-700 font-semibold"
                            >Tuliskan kata kunci untuk melanjutkan:</Label
                        >
                        <div class="relative group">
                            <Input
                                bind:value={confirmInput}
                                placeholder="Ketik RESET di sini..."
                                class="h-12 border-2 border-slate-200 focus-visible:ring-red-500 focus-visible:border-red-500 transition-all rounded-xl pl-4"
                            />
                            {#if confirmInput === "RESET"}
                                <CircleCheck
                                    class="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500 animate-in zoom-in duration-300"
                                />
                            {/if}
                        </div>
                        <p
                            class="text-[11px] text-slate-400 italic font-mono uppercase tracking-widest text-center py-2 bg-slate-100 rounded"
                        >
                            Keyword: <span class="text-red-500 font-bold"
                                >RESET</span
                            >
                        </p>
                    </div>
                </CardContent>
                <CardFooter
                    class="p-6 bg-slate-50 flex justify-between gap-4 border-t border-slate-100"
                >
                    <Button
                        variant="ghost"
                        onclick={cancelReset}
                        disabled={loading}
                        class="flex-1 rounded-xl h-12"
                    >
                        Batalkan
                    </Button>
                    <div class="flex-[2]">
                        <Button
                            variant="destructive"
                            onclick={handleReset}
                            disabled={loading || confirmInput !== "RESET"}
                            class="w-full rounded-xl h-12 font-bold shadow-lg shadow-red-500/20 active:scale-95 transition-transform"
                        >
                            {#if loading}
                                <Loader2 class="mr-2 h-5 w-5 animate-spin" />
                                Memproses...
                            {:else}
                                <RefreshCcw class="mr-2 h-5 w-5" />
                                EKSEKUSI SEKARANG
                            {/if}
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    {:else}
        <div class="grid gap-8 md:grid-cols-2">
            <!-- Data Only Reset -->
            <Card
                class="group hover:border-orange-500/30 transition-all duration-500 overflow-hidden rounded-3xl border-transparent bg-white shadow-xl hover:shadow-2xl hover:-translate-y-1 flex flex-col"
            >
                <CardHeader class="p-8 pb-4">
                    <div
                        class="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500"
                    >
                        <Database class="h-6 w-6" />
                    </div>
                    <CardTitle class="text-2xl font-bold text-slate-900 mb-2"
                        >Reset Transaksi</CardTitle
                    >
                    <CardDescription class="text-slate-500 leading-relaxed">
                        Bersihkan riwayat keuangan dan catatan transaksi untuk
                        memulai sesi pembukuan baru tanpa menghapus inventori.
                    </CardDescription>
                </CardHeader>
                <CardContent class="p-8 pt-0 flex-grow">
                    <div class="space-y-4">
                        <div
                            class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2"
                        >
                            Data Akan Terhapus
                        </div>
                        <ul class="space-y-3">
                            {#each ["Catatan Penjualan & Service", "Laporan Keuangan & Laba", "Hutang & Piutang Pelanggan", "Log Aktivitas Sistem"] as item}
                                <li
                                    class="flex items-center gap-3 text-sm text-slate-600"
                                >
                                    <div
                                        class="h-1.5 w-1.5 rounded-full bg-red-400"
                                    ></div>
                                    {item}
                                </li>
                            {/each}
                        </ul>
                        <div
                            class="mt-6 pt-6 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 px-3 py-2 rounded-lg w-fit"
                        >
                            <CircleCheck class="h-4 w-4" />
                            PRODUK & USER TETAP AMAN
                        </div>
                    </div>
                </CardContent>
                <CardFooter class="p-8 pt-0">
                    <Button
                        variant="outline"
                        class="w-full h-12 rounded-xl group-hover:bg-orange-50 group-hover:text-orange-600 group-hover:border-orange-200 transition-all duration-300"
                        onclick={() => startReset("data")}
                    >
                        Mulai Reset Data
                        <ArrowRight
                            class="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                        />
                    </Button>
                </CardFooter>
            </Card>

            <!-- Full Reset -->
            <Card
                class="group hover:border-red-500/30 transition-all duration-500 overflow-hidden rounded-3xl border-transparent bg-white shadow-xl hover:shadow-2xl hover:-translate-y-1 relative flex flex-col"
            >
                <div
                    class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"
                >
                    <AlertTriangle class="h-24 w-24 text-red-600 -rotate-12" />
                </div>
                <CardHeader class="p-8 pb-4">
                    <div
                        class="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-red-200/50"
                    >
                        <RefreshCcw class="h-6 w-6" />
                    </div>
                    <CardTitle class="text-2xl font-bold text-red-700 mb-2"
                        >Full Factory Reset</CardTitle
                    >
                    <CardDescription class="text-slate-500 leading-relaxed">
                        Kembalikan aplikasi ke status "Fresh Install". Langkah
                        terakhir untuk menghapus segalanya secara total.
                    </CardDescription>
                </CardHeader>
                <CardContent class="p-8 pt-0 flex-grow">
                    <div class="space-y-4">
                        <div
                            class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2"
                        >
                            Data Akan Terhapus
                        </div>
                        <ul class="space-y-3">
                            {#each ["SEMUA Inventori & Produk", "SEMUA Supplier & Pelanggan", "SEMUA Akun & Pengaturan", "SEMUA Riwayat Transaksi"] as item}
                                <li
                                    class="flex items-center gap-3 text-sm text-slate-600"
                                >
                                    <div
                                        class="h-1.5 w-1.5 rounded-full bg-red-600"
                                    ></div>
                                    <strong class="text-red-700/80"
                                        >{item}</strong
                                    >
                                </li>
                            {/each}
                        </ul>
                        <div
                            class="mt-6 pt-6 border-t border-slate-100 text-[10px] uppercase font-bold text-red-500 text-center tracking-widest"
                        >
                            🚨 PERINGATAN: TIDAK DAPAT DIBATALKAN 🚨
                        </div>
                    </div>
                </CardContent>
                <CardFooter class="p-8 pt-0">
                    <Button
                        variant="destructive"
                        class="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30"
                        onclick={() => startReset("full")}
                    >
                        Full Reset (Extreme)
                    </Button>
                </CardFooter>
            </Card>
        </div>
    {/if}
</div>
