<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogTrigger,
    } from "$lib/shared/components/ui/dialog";
    import {
        Plus,
        Briefcase,
        Tag,
        Package,
        Calendar,
        Wallet,
        HelpCircle,
        ShieldQuestion,
        Calculator,
        Activity,
        ChevronRight,
        Loader2,
        Map as MapIcon,
    } from "lucide-svelte";
    import { formatCurrency } from "./assets.utils";
    import type { AssetsController } from "../assets.controller.svelte";

    let { controller }: { controller: AssetsController } = $props();
    let showAccountingHelp = $state(false);
</script>

<Dialog bind:open={controller.showAddDialog}>
    <DialogTrigger>
        <Button
            class="gap-2"
            onclick={() => {
                controller.editingId = null;
                controller.form = {
                    name: "",
                    category: "tool",
                    purchaseDate: new Date().toISOString().slice(0, 10),
                    purchaseCost: 0,
                    salvageValue: 0,
                    usefulLifeMonths: 24,
                    notes: "",
                    sourceAccountId: "1-1001",
                    accountId: "1-4001",
                };
            }}
        >
            <Plus class="h-4 w-4" />
            Tambah Aset
        </Button>
    </DialogTrigger>
    <DialogContent
        class="max-w-4xl p-0 border-none shadow-2xl rounded-3xl group max-h-[90vh] flex flex-col gap-0"
    >
        <!-- Decorative Top Bar -->
        <div
            class="h-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 shrink-0"
        ></div>

        <DialogHeader class="px-8 pt-8 outline-none shrink-0">
            <div class="flex items-center gap-4">
                <div
                    class="p-3 bg-blue-50 rounded-2xl text-blue-600 shadow-sm group-hover:scale-110 transition-transform duration-500"
                >
                    <Briefcase class="h-6 w-6" />
                </div>
                <div>
                    <DialogTitle
                        class="text-2xl font-extrabold tracking-tight text-slate-900"
                    >
                        {controller.editingId
                            ? "Perbarui Aset"
                            : "Registrasi Aset Baru"}
                    </DialogTitle>
                    <p class="text-slate-500 text-sm">
                        Kelola aset tetap dan pantau penyusutan otomatis setiap
                        bulan.
                    </p>
                </div>
            </div>
        </DialogHeader>

        <div class="overflow-y-auto p-8 pt-6">
            <form
                onsubmit={(e) => {
                    e.preventDefault();
                    controller.handleSubmit();
                }}
                class="space-y-6"
            >
                <div class="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-8">
                    <!-- Left Column: Data Entry -->
                    <div class="space-y-8">
                        <!-- Section 1: Identitas Aset -->
                        <div
                            class="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm space-y-6"
                        >
                            <div class="flex items-center gap-3 mb-2">
                                <div
                                    class="h-8 w-1 bg-blue-500 rounded-full"
                                ></div>
                                <h3
                                    class="text-sm font-black text-slate-900 uppercase tracking-wider italic"
                                >
                                    Identitas Aset
                                </h3>
                            </div>

                            <div class="space-y-2">
                                <Label
                                    class="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"
                                >
                                    <Tag class="h-3.5 w-3.5" /> Nama Aset
                                </Label>
                                <Input
                                    bind:value={controller.form.name}
                                    placeholder="Nama resmi aset..."
                                    class="h-12 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 rounded-2xl transition-all font-medium text-slate-900"
                                    required
                                />
                            </div>

                            <div class="grid grid-cols-2 gap-6">
                                <div class="space-y-2">
                                    <Label
                                        class="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"
                                    >
                                        <Package class="h-3.5 w-3.5" /> Kategori
                                    </Label>
                                    <div class="relative">
                                        <select
                                            bind:value={
                                                controller.form.category
                                            }
                                            class="w-full h-12 pl-4 pr-10 border border-slate-200 rounded-2xl bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all appearance-none cursor-pointer font-medium text-slate-700"
                                            onchange={controller.handleCategoryChange}
                                        >
                                            <option value="tool"
                                                >Alat Service</option
                                            >
                                            <option value="equipment"
                                                >Peralatan</option
                                            >
                                            <option value="furniture"
                                                >Furniture</option
                                            >
                                            <option value="vehicle"
                                                >Kendaraan</option
                                            >
                                            <option value="property"
                                                >Properti (Tanah & Bangunan)</option
                                            >
                                            <option value="other"
                                                >Lainnya</option
                                            >
                                        </select>
                                        <ChevronRight
                                            class="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 rotate-90 pointer-events-none"
                                        />
                                    </div>
                                </div>

                                <div class="space-y-2">
                                    <Label
                                        class="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"
                                    >
                                        <Calendar class="h-3.5 w-3.5" />
                                        Tgl Akuisisi
                                    </Label>
                                    <Input
                                        type="date"
                                        bind:value={
                                            controller.form.purchaseDate
                                        }
                                        class="h-12 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 rounded-2xl transition-all font-medium text-slate-700 bg-slate-50/50 focus:bg-white"
                                        required
                                    />
                                </div>
                            </div>

                            <!-- Account Selection -->
                            {#if controller.accounts.length > 0}
                                <div
                                    class="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-700 delay-100"
                                >
                                    <div class="space-y-2">
                                        <Label
                                            class="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"
                                        >
                                            <Briefcase class="h-3.5 w-3.5" /> Akun
                                            Aset (Debit)
                                        </Label>
                                        <div class="relative">
                                            <select
                                                bind:value={
                                                    controller.form.accountId
                                                }
                                                class="w-full h-12 pl-4 pr-10 border border-slate-200 rounded-2xl bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all appearance-none cursor-pointer font-medium text-slate-700"
                                            >
                                                <option value="" disabled
                                                    >Pilih Akun Aset</option
                                                >
                                                {#each controller.allAssetAccounts as account}
                                                    <option value={account.id}
                                                        >{account.code} - {account.name}</option
                                                    >
                                                {/each}
                                            </select>
                                            <ChevronRight
                                                class="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 rotate-90 pointer-events-none"
                                            />
                                        </div>
                                    </div>

                                    <div class="space-y-2">
                                        <Label
                                            class="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"
                                        >
                                            <Wallet class="h-3.5 w-3.5" /> Sumber
                                            Dana (Kredit)
                                        </Label>
                                        <div class="relative">
                                            <select
                                                bind:value={
                                                    controller.form
                                                        .sourceAccountId
                                                }
                                                class="w-full h-12 pl-4 pr-10 border border-slate-200 rounded-2xl bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all appearance-none cursor-pointer font-medium text-slate-700"
                                            >
                                                <option value="" disabled
                                                    >Pilih Sumber Dana</option
                                                >
                                                {#each controller.sourceAccounts as account}
                                                    <option value={account.id}
                                                        >{account.code} - {account.name}</option
                                                    >
                                                {/each}
                                            </select>
                                            <ChevronRight
                                                class="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 rotate-90 pointer-events-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            {/if}

                            {#if controller.form.category === "property"}
                                <div
                                    class="pt-2 animate-in fade-in slide-in-from-top-2 duration-500"
                                >
                                    <div
                                        class="flex flex-col gap-1 p-4 border border-blue-100 bg-blue-50/50 rounded-2xl"
                                    >
                                        <span
                                            class="text-xs font-black text-blue-900 uppercase tracking-tight"
                                            >Mode Properti Gabungan</span
                                        >
                                        <span
                                            class="text-[10px] text-blue-600/70 font-medium"
                                            >Sistem akan otomatis memisahkan
                                            nilai Tanah dan Bangunan menjadi dua
                                            aset terpisah.</span
                                        >
                                    </div>
                                </div>
                            {/if}
                        </div>

                        <!-- Section 2: Sumber Dana -->
                        <div
                            class="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm space-y-6"
                        >
                            <div
                                class="flex items-center justify-between gap-3 mb-2"
                            >
                                <div class="flex items-center gap-3">
                                    <div
                                        class="h-8 w-1 bg-indigo-500 rounded-full"
                                    ></div>
                                    <h3
                                        class="text-sm font-black text-slate-900 uppercase tracking-wider italic"
                                    >
                                        Pembiayaan
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onclick={() =>
                                        (showAccountingHelp =
                                            !showAccountingHelp)}
                                    class="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors flex items-center gap-1.5 border border-indigo-100"
                                >
                                    <HelpCircle class="h-3 w-3" /> Panduan
                                </button>
                            </div>

                            {#if showAccountingHelp}
                                <div
                                    class="p-5 bg-slate-900 text-slate-300 rounded-3xl text-[11px] leading-relaxed shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-800 space-y-3"
                                >
                                    <div
                                        class="flex items-center gap-2 text-white font-bold"
                                    >
                                        <ShieldQuestion
                                            class="h-4 w-4 text-indigo-400"
                                        />
                                        Logika Akuntansi
                                    </div>
                                    <div
                                        class="grid grid-cols-1 gap-2 opacity-90"
                                    >
                                        <div
                                            class="flex items-start gap-2 p-2 rounded-xl bg-white/5 border border-white/10"
                                        >
                                            <span
                                                class="text-blue-400 font-bold w-12 shrink-0"
                                                >ASET:</span
                                            >
                                            <span
                                                >Uang langsung keluar dari
                                                kas/bank.</span
                                            >
                                        </div>
                                        <div
                                            class="flex items-start gap-2 p-2 rounded-xl bg-white/5 border border-white/10"
                                        >
                                            <span
                                                class="text-orange-400 font-bold w-12 shrink-0"
                                                >HUTANG:</span
                                            >
                                            <span
                                                >Cicilan atau bon tempo ke pihak
                                                lain.</span
                                            >
                                        </div>
                                        <div
                                            class="flex items-start gap-2 p-2 rounded-xl bg-white/5 border border-white/10"
                                        >
                                            <span
                                                class="text-green-400 font-bold w-12 shrink-0"
                                                >MODAL:</span
                                            >
                                            <span
                                                >Uang pribadi atau setoran awal
                                                pemilik.</span
                                            >
                                        </div>
                                    </div>
                                </div>
                            {/if}
                        </div>

                        <!-- Section 3: Catatan -->
                        <div
                            class="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm space-y-4"
                        >
                            <div class="flex items-center gap-3">
                                <div
                                    class="h-8 w-1 bg-slate-300 rounded-full"
                                ></div>
                                <h3
                                    class="text-sm font-black text-slate-900 uppercase tracking-wider italic"
                                >
                                    Informasi Tambahan
                                </h3>
                            </div>
                            <textarea
                                bind:value={controller.form.notes}
                                placeholder="Tuliskan detail lain (lokasi, SN, dll)..."
                                class="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50/20 focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-500/5 outline-none transition-all h-24 text-sm font-medium text-slate-600 italic placeholder:not-italic"
                            ></textarea>
                        </div>
                    </div>

                    <!-- Right Column: Financial Calculation Card -->
                    <div class="space-y-6">
                        <div
                            class="p-8 bg-slate-900 rounded-[2.5rem] shadow-2xl space-y-8 relative overflow-hidden border border-slate-800"
                        >
                            <!-- Background Accents -->
                            <div
                                class="absolute -top-20 -right-20 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px]"
                            ></div>

                            <div class="relative z-10 space-y-6 text-white">
                                <!-- Price -->
                                <div class="space-y-3">
                                    <Label
                                        class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]"
                                    >
                                        {controller.splitProperty
                                            ? "Total Transaksi"
                                            : "Harga Perolehan"}
                                    </Label>
                                    <div class="relative group/input">
                                        <div
                                            class="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2"
                                        >
                                            <div
                                                class="h-4 w-0.5 bg-blue-500/50 rounded-full"
                                            ></div>
                                            <span
                                                class="text-slate-400 font-black text-xs"
                                                >RP</span
                                            >
                                        </div>
                                        <Input
                                            type="number"
                                            bind:value={
                                                controller.form.purchaseCost
                                            }
                                            class="pl-16 h-14 bg-white/5 border-white/10 focus:border-blue-500/50 focus:ring-0 rounded-2xl text-xl font-black text-white hover:bg-white/[0.07] transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <!-- Split Property Logic -->
                                {#if controller.splitProperty}
                                    <div
                                        class="space-y-3 animate-in slide-in-from-right-4 duration-500"
                                    >
                                        <Label
                                            class="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]"
                                            >Porsi Harga Tanah</Label
                                        >
                                        <div class="relative group/input">
                                            <div
                                                class="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 font-black text-xs text-blue-400"
                                            >
                                                <MapIcon class="h-3 w-3" /> RP
                                            </div>
                                            <Input
                                                type="number"
                                                bind:value={
                                                    controller.landPortion
                                                }
                                                class="pl-16 h-14 bg-blue-500/10 border-blue-500/30 focus:border-blue-500 focus:ring-0 rounded-2xl text-xl font-black text-blue-400 hover:bg-blue-500/20 transition-all"
                                                required
                                            />
                                        </div>
                                        <div class="flex justify-between px-2">
                                            <span
                                                class="text-[10px] text-slate-500 font-bold uppercase italic"
                                                >Nilai Bangunan:</span
                                            >
                                            <span
                                                class="text-[10px] text-white font-black"
                                                >{formatCurrency(
                                                    controller.form
                                                        .purchaseCost -
                                                        controller.landPortion,
                                                )}</span
                                            >
                                        </div>
                                    </div>
                                {/if}

                                <!-- Residual & Life -->
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="space-y-3">
                                        <div class="flex items-center h-5">
                                            <Label
                                                class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]"
                                                >Nilai Residu</Label
                                            >
                                        </div>
                                        <div class="relative">
                                            <Input
                                                type="number"
                                                bind:value={
                                                    controller.form.salvageValue
                                                }
                                                class="h-12 bg-white/5 border-white/10 focus:border-slate-500 rounded-2xl text-sm font-bold text-white transition-all text-center"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div class="space-y-3">
                                        <div
                                            class="flex justify-between items-center h-5"
                                        >
                                            <Label
                                                class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]"
                                                >Masa Pakai</Label
                                            >
                                        </div>
                                        <div class="relative">
                                            <Input
                                                type="number"
                                                bind:value={
                                                    controller.form
                                                        .usefulLifeMonths
                                                }
                                                class="h-12 bg-white/5 border-white/10 focus:border-slate-500 rounded-2xl text-sm font-bold text-white transition-all text-center"
                                                min="1"
                                                required
                                            />
                                            <span
                                                class="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-500 uppercase tracking-tighter"
                                                >Bulan</span
                                            >
                                        </div>
                                    </div>
                                </div>

                                <!-- Depreciation -->
                                <div class="pt-6 border-t border-white/5">
                                    <div
                                        class="flex items-center justify-between mb-4"
                                    >
                                        <div class="flex items-center gap-2">
                                            <div
                                                class="p-2 bg-blue-500/20 rounded-xl"
                                            >
                                                <Calculator
                                                    class="h-4 w-4 text-blue-400"
                                                />
                                            </div>
                                            <div>
                                                <p
                                                    class="text-[10px] font-black text-white uppercase tracking-widest"
                                                >
                                                    Estimasi Penyusutan
                                                </p>
                                                <p
                                                    class="text-[9px] text-slate-500 font-bold uppercase"
                                                >
                                                    Garis Lurus (Straight Line)
                                                </p>
                                            </div>
                                        </div>

                                        <div
                                            class="flex bg-slate-800 rounded-lg p-1 border border-slate-700"
                                        >
                                            <button
                                                type="button"
                                                class="px-2 py-1 text-[9px] font-bold rounded-md transition-all {controller.depreciationMode ===
                                                'auto'
                                                    ? 'bg-blue-500 text-white shadow-sm'
                                                    : 'text-slate-400 hover:text-slate-300'}"
                                                onclick={() =>
                                                    (controller.depreciationMode =
                                                        "auto")}
                                            >
                                                AUTO
                                            </button>
                                            <button
                                                type="button"
                                                class="px-2 py-1 text-[9px] font-bold rounded-md transition-all {controller.depreciationMode ===
                                                'manual'
                                                    ? 'bg-blue-500 text-white shadow-sm'
                                                    : 'text-slate-400 hover:text-slate-300'}"
                                                onclick={() => {
                                                    controller.depreciationMode =
                                                        "manual";
                                                    controller.manualMonthlyDepr =
                                                        controller.monthlyDepr;
                                                }}
                                            >
                                                MANUAL
                                            </button>
                                        </div>
                                    </div>

                                    <div
                                        class="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group"
                                    >
                                        <div
                                            class="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"
                                        ></div>
                                        <p
                                            class="text-[10px] text-blue-100 font-bold uppercase tracking-wider mb-1"
                                        >
                                            Beban per Bulan
                                        </p>

                                        {#if controller.depreciationMode === "auto"}
                                            <h2
                                                class="text-3xl font-black text-white italic tracking-tighter drop-shadow-lg animate-in slide-in-from-bottom-2"
                                            >
                                                {formatCurrency(
                                                    controller.monthlyDepr,
                                                )}
                                            </h2>
                                        {:else}
                                            <div
                                                class="relative animate-in slide-in-from-bottom-2"
                                            >
                                                <span
                                                    class="absolute left-0 top-1/2 -translate-y-1/2 text-blue-200 font-bold text-lg"
                                                    >Rp</span
                                                >
                                                <input
                                                    type="number"
                                                    bind:value={
                                                        controller.manualMonthlyDepr
                                                    }
                                                    oninput={controller.handleManualDeprChange}
                                                    class="w-full bg-transparent border-b-2 border-white/20 focus:border-white text-3xl font-black text-white italic tracking-tighter outline-none pl-8 py-1 placeholder-white/30"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <p
                                                class="text-[9px] text-blue-200 mt-2 font-medium"
                                            >
                                                <span
                                                    class="text-white font-bold underline"
                                                    >{controller.form
                                                        .usefulLifeMonths} Bulan</span
                                                > (Otomatis)
                                            </p>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Validation Card -->
                        <div
                            class="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-3"
                        >
                            <div class="flex items-center gap-2 text-slate-500">
                                <Activity class="h-3 w-3" />
                                <span
                                    class="text-[10px] font-bold uppercase tracking-widest leading-none pt-0.5"
                                    >Status Validasi</span
                                >
                            </div>
                            <p
                                class="text-[11px] text-slate-500 font-medium leading-relaxed"
                            >
                                Data ini akan diposting ke Buku Besar secara
                                otomatis. Pastikan nominal dan tgl akuisisi
                                sudah sesuai dengan bukti bayar/invoice.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Footer Guides & Actions -->
                <div
                    class="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4"
                >
                    <div
                        class="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-100 animate-pulse"
                    >
                        <ShieldQuestion class="h-3.5 w-3.5 text-green-600" />
                        <span
                            class="text-[10px] font-bold text-green-600 uppercase tracking-wide"
                            >Data Terdistribusi ke Jurnal Umum</span
                        >
                    </div>

                    <div class="flex gap-3 w-full sm:w-auto">
                        <Button
                            type="button"
                            variant="ghost"
                            class="flex-1 sm:flex-none rounded-xl h-11 text-slate-500 hover:bg-slate-50"
                            onclick={() => {
                                controller.showAddDialog = false;
                                controller.editingId = null;
                                controller.form = {
                                    name: "",
                                    category: "tool" as any,
                                    purchaseDate: new Date()
                                        .toISOString()
                                        .slice(0, 10),
                                    purchaseCost: 0,
                                    salvageValue: 0,
                                    usefulLifeMonths: 24,
                                    notes: "",
                                    sourceAccountId: "1-1001",
                                    accountId: "1-4001",
                                };
                                controller.splitProperty = false;
                                controller.landPortion = 0;
                            }}
                        >
                            Batalkan
                        </Button>
                        <Button
                            type="submit"
                            disabled={controller.submitting}
                            class="flex-1 sm:flex-none h-11 px-8 rounded-xl bg-slate-900 border-none hover:bg-slate-800 shadow-lg shadow-slate-200"
                        >
                            {#if controller.submitting}
                                <Loader2 class="h-4 w-4 animate-spin mr-2" />
                                Menyimpan...
                            {:else}
                                Selesaikan Registrasi
                            {/if}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    </DialogContent>
</Dialog>
