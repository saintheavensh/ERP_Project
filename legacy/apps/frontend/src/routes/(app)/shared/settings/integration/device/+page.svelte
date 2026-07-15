<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import { Label } from "$lib/shared/components/ui/label";
    import { Switch } from "$lib/shared/components/ui/switch";
    import {
        Card,
        CardContent,
        CardDescription,
        CardFooter,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { SettingsService } from "$lib/features/settings/settings.service";
    import { settingsStore } from "$lib/features/settings/settings-store.svelte";
    import { toast } from "svelte-sonner";
    import { Loader2, Save, Smartphone } from "lucide-svelte";
    import { onMount } from "svelte";

    let enabled = $state(true);
    let saving = $state(false);
    let loading = $state(true);

    onMount(async () => {
        try {
            const val = await SettingsService.get<boolean>(
                "device_feature_enabled",
            );
            enabled = val ?? true;
        } catch (e) {
            console.error(e);
            toast.error("Gagal memuat pengaturan");
        } finally {
            loading = false;
        }
    });

    async function save() {
        saving = true;
        try {
            await SettingsService.set("device_feature_enabled", enabled);
            toast.success("Pengaturan berhasil disimpan");

            // Refresh global store to update sidebar immediately
            await settingsStore.refresh();
        } catch (e) {
            toast.error("Gagal menyimpan pengaturan");
        } finally {
            saving = false;
        }
    }
</script>

<div class="space-y-6 max-w-3xl mx-auto py-8">
    <div>
        <h3 class="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Smartphone class="h-6 w-6" /> Integrasi Device
        </h3>
        <p class="text-muted-foreground">
            Konfigurasi fitur database device dan pencarian spesifikasi HP.
        </p>
    </div>

    <Card>
        <CardHeader>
            <CardTitle>Fitur Device Database</CardTitle>
            <CardDescription>
                Aktifkan fitur ini untuk menggunakan database spesifikasi HP,
                pencarian otomatis, dan fitur scraping.
            </CardDescription>
        </CardHeader>
        <CardContent class="space-y-6">
            {#if loading}
                <div class="flex justify-center py-4">
                    <Loader2
                        class="h-6 w-6 animate-spin text-muted-foreground"
                    />
                </div>
            {:else}
                <div
                    class="flex items-center justify-between space-x-2 border p-4 rounded-lg"
                >
                    <div class="space-y-0.5">
                        <Label class="text-base">Aktifkan Fitur Device</Label>
                        <p class="text-sm text-muted-foreground">
                            Jika dinonaktifkan, menu "Devices" akan
                            disembunyikan dari sidebar dan pencarian device
                            tidak akan tersedia di form produk/service.
                        </p>
                    </div>
                    <Switch bind:checked={enabled} />
                </div>
            {/if}
        </CardContent>
        <CardFooter class="flex justify-end">
            <Button onclick={save} disabled={saving || loading}>
                {#if saving}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                {:else}
                    <Save class="mr-2 h-4 w-4" />
                    Simpan Perubahan
                {/if}
            </Button>
        </CardFooter>
    </Card>
</div>
