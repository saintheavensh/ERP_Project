<script lang="ts">
    import { onMount } from "svelte";
    import { fly } from "svelte/transition";
    import { toast } from "svelte-sonner";
    import { SettingsService, type TaxSettings, type SystemSettings } from "$lib/features/settings/settings.service";
    import { Button } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import { Switch } from "$lib/shared/components/ui/switch";
    import { Separator } from "$lib/shared/components/ui/separator";
    import {
        Card,
        CardContent,
        CardDescription,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { Coins, Globe, Percent, Save, Settings } from "lucide-svelte";

    let saving = $state(false);
    let taxSettings = $state<TaxSettings>({
        enabled: false,
        rate: 11,
        label: "PPN",
        inclusive: false,
    });
    let systemSettings = $state<SystemSettings>({
        currencySymbol: "Rp",
        dateFormat: "dd/MM/yyyy",
        timezone: "Asia/Jakarta",
    });

    onMount(async () => {
        try {
            const [tax, system] = await Promise.all([
                SettingsService.getTaxSettings(),
                SettingsService.getSystemSettings(),
            ]);
            taxSettings = tax;
            systemSettings = system;
        } catch (e) {
            console.error(e);
            toast.error("Gagal memuat pengaturan");
        }
    });

    async function save() {
        saving = true;
        try {
            await Promise.all([
                SettingsService.setTaxSettings(taxSettings),
                SettingsService.setSystemSettings(systemSettings),
            ]);
            toast.success("Pengaturan berhasil disimpan");
        } catch (e) {
            console.error(e);
            toast.error("Gagal menyimpan pengaturan");
        } finally {
            saving = false;
        }
    }
</script>

<div class="max-w-4xl mx-auto space-y-8 pb-20" in:fly={{ y: 20, duration: 300 }}>
    <!-- Header -->
    <div class="space-y-2">
        <h1
            class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-indigo-400"
        >
            Pengaturan Umum
        </h1>
        <p class="text-muted-foreground text-sm font-medium">
            Konfigurasi pajak, mata uang, dan preferensi sistem.
        </p>
    </div>

    <div class="grid gap-6">
        <!-- Tax Settings -->
        <Card class="border-slate-200/60 shadow-sm overflow-hidden">
            <CardHeader class="bg-slate-50/50 border-b border-slate-100 pb-4">
                <div class="flex items-center gap-2">
                    <div class="p-2 rounded-lg bg-blue-100/50 text-blue-600">
                        <Percent class="w-5 h-5" />
                    </div>
                    <div>
                        <CardTitle class="text-lg">Pajak (PPN/VAT)</CardTitle>
                        <CardDescription>
                            Konfigurasi pajak yang dikenakan pada transaksi.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent class="p-6 space-y-6">
                <div class="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div class="space-y-0.5">
                        <Label class="text-base font-semibold">Aktifkan Pajak</Label>
                        <p class="text-sm text-muted-foreground">
                            Hitung pajak otomatis saat transaksi.
                        </p>
                    </div>
                    <Switch bind:checked={taxSettings.enabled} />
                </div>

                {#if taxSettings.enabled}
                    <div class="grid gap-6 md:grid-cols-2" in:fly={{ y: -10, duration: 200 }}>
                        <div class="space-y-2">
                            <Label>Label Pajak</Label>
                            <Input bind:value={taxSettings.label} placeholder="PPN" />
                            <p class="text-[11px] text-muted-foreground">
                                Nama yang muncul di struk (Misal: PPN, VAT, Tax).
                            </p>
                        </div>
                        <div class="space-y-2">
                            <Label>Tarif Pajak (%)</Label>
                            <div class="relative">
                                <Input
                                    type="number"
                                    bind:value={taxSettings.rate}
                                    placeholder="11"
                                    class="pr-8"
                                />
                                <div class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                    %
                                </div>
                            </div>
                        </div>
                        <div class="col-span-2 flex items-center justify-between p-4 rounded-xl bg-white border border-slate-100">
                            <div class="space-y-0.5">
                                <Label>Harga Termasuk Pajak (Inclusive)</Label>
                                <p class="text-xs text-muted-foreground">
                                    Jika aktif, harga produk dianggap sudah termasuk pajak.
                                    <br>
                                    Jika mati, pajak akan ditambahkan di atas harga produk.
                                </p>
                            </div>
                            <Switch bind:checked={taxSettings.inclusive} />
                        </div>
                    </div>
                {/if}
            </CardContent>
        </Card>

        <!-- System Settings -->
        <Card class="border-slate-200/60 shadow-sm overflow-hidden">
            <CardHeader class="bg-slate-50/50 border-b border-slate-100 pb-4">
                <div class="flex items-center gap-2">
                    <div class="p-2 rounded-lg bg-indigo-100/50 text-indigo-600">
                        <Globe class="w-5 h-5" />
                    </div>
                    <div>
                        <CardTitle class="text-lg">Preferensi Sistem</CardTitle>
                        <CardDescription>
                            Format tampilan mata uang dan tanggal.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent class="p-6 space-y-6">
                <div class="grid gap-6 md:grid-cols-2">
                    <div class="space-y-2">
                        <Label>Simbol Mata Uang</Label>
                        <Input bind:value={systemSettings.currencySymbol} placeholder="Rp" />
                    </div>
                    <div class="space-y-2">
                        <Label>Format Tanggal</Label>
                        <Input bind:value={systemSettings.dateFormat} placeholder="dd/MM/yyyy" />
                        <p class="text-[11px] text-muted-foreground">
                            Format tampilan tanggal di seluruh aplikasi.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>

        <!-- Save Button -->
        <div class="sticky bottom-4 flex justify-end">
            <Button size="lg" onclick={save} disabled={saving} class="shadow-lg">
                <Save class="w-4 h-4 mr-2" />
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
        </div>
    </div>
</div>
