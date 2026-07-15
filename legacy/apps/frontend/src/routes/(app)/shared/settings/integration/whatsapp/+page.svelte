<script lang="ts">
    import { onMount } from "svelte";
    import {
        SettingsService,
        type WhatsAppSettings,
    } from "$lib/features/settings/settings.service";
    import { Button } from "$lib/shared/components/ui/button";
    import {
        Card,
        CardContent,
        CardDescription,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { Switch } from "$lib/shared/components/ui/switch";
    import { Label } from "$lib/shared/components/ui/label";
    import { Input } from "$lib/shared/components/ui/input";
    import { Textarea } from "$lib/shared/components/ui/textarea";
    import { Separator } from "$lib/shared/components/ui/separator";
    import { toast } from "svelte-sonner";
    import { Loader2, MessageSquare, Save, AlertTriangle } from "lucide-svelte";
    import * as Select from "$lib/shared/components/ui/select";
    import * as Alert from "$lib/shared/components/ui/alert";

    let settings: WhatsAppSettings = $state({
        enabled: false,
        phoneNumber: "",
        newServiceTemplate: "",
        statusUpdateTemplate: "",
        readyForPickupTemplate: "",
        warrantyReminderTemplate: "",
        mode: "client",
        gatewayUrl: "",
        apiKey: "",
        autoSendOnNewService: false,
        autoSendOnStatusChange: false,
        autoSendOnComplete: false,
    });
    let loading = $state(true);
    let saving = $state(false);

    // Mode Options
    const MODES = [
        {
            value: "client",
            label: "Client-Side (Click-to-Chat) - AMAN & GRATIS",
        },
        { value: "server", label: "Server-Side (Gateway Otomatis) - BERISIKO" },
    ];

    onMount(async () => {
        try {
            settings = await SettingsService.getWhatsAppSettings();
        } catch (e) {
            toast.error("Gagal memuat pengaturan WhatsApp");
        } finally {
            loading = false;
        }
    });

    async function save() {
        saving = true;
        try {
            await SettingsService.setWhatsAppSettings(settings);
            toast.success("Pengaturan WhatsApp disimpan");
        } catch (e) {
            toast.error("Gagal menyimpan pengaturan");
        } finally {
            saving = false;
        }
    }
</script>

<div class="space-y-6 max-w-4xl mx-auto py-6">
    <!-- Header -->
    <div>
        <h3 class="text-2xl font-bold tracking-tight">Integrasi WhatsApp</h3>
        <p class="text-muted-foreground">
            Otomatisasi notifikasi ke pelanggan melalui WhatsApp.
        </p>
    </div>

    <Card>
        <CardHeader>
            <CardTitle class="flex items-center gap-2">
                <MessageSquare class="h-5 w-5" />
                Status Koneksi
            </CardTitle>
            <CardDescription
                >Aktifkan integrasi untuk mengirim pesan otomatis.</CardDescription
            >
        </CardHeader>
        <CardContent class="space-y-4">
            <div
                class="flex items-center justify-between p-4 border rounded-lg"
            >
                <div class="space-y-0.5">
                    <Label>Aktifkan WhatsApp Integration</Label>
                    <p class="text-sm text-muted-foreground">
                        Kirim notifikasi otomatis ke pelanggan
                    </p>
                </div>
                <Switch bind:checked={settings.enabled} />
            </div>

            {#if settings.enabled}
                <div class="space-y-4 pt-4">
                    <!-- Mode Selector -->
                    <div class="space-y-2">
                        <Label>Metode Integrasi</Label>
                        <Select.Root type="single" bind:value={settings.mode}>
                            <Select.Trigger>
                                {MODES.find((m) => m.value === settings.mode)
                                    ?.label || "Pilih Mode"}
                            </Select.Trigger>
                            <Select.Content>
                                {#each MODES as mode}
                                    <Select.Item
                                        value={mode.value}
                                        label={mode.label}
                                    >
                                        {mode.label}
                                    </Select.Item>
                                {/each}
                            </Select.Content>
                        </Select.Root>
                    </div>

                    <!-- Client Mode Content -->
                    {#if settings.mode === "client"}
                        <div
                            class="grid gap-2 border p-4 rounded-md bg-muted/20"
                        >
                            <Label
                                >Nomor WhatsApp Pengirim / API Token (Opsional)</Label
                            >
                            <Input
                                bind:value={settings.phoneNumber}
                                placeholder="081234567890 (Hanya untuk referensi)"
                            />
                            <p class="text-[12px] text-muted-foreground">
                                Mode Client-Side menggunakan WhatsApp Web yang
                                sedang dibuka di perangkat kasir. Nomor pengirim
                                mengikuti akun yang login di browser.
                            </p>
                        </div>
                    {/if}

                    <!-- Server Mode Content -->
                    {#if settings.mode === "server"}
                        <Alert.Root variant="destructive">
                            <AlertTriangle class="h-4 w-4" />
                            <Alert.Title>Peringatan Risiko Banned</Alert.Title>
                            <Alert.Description>
                                Mode Server-Side menggunakan API Gateway pihak
                                ketiga. Pihak WhatsApp dapat memblokir nomor
                                Anda jika terdeteksi spam. Gunakan <strong
                                    >Nomor Khusus (Bukan Pribadi)</strong
                                >
                                dan hindari mengirim pesan massal sekaligus.
                            </Alert.Description>
                        </Alert.Root>

                        <div class="grid gap-4 border p-4 rounded-md">
                            <div class="grid gap-2">
                                <Label>Gateway URL</Label>
                                <Input
                                    bind:value={settings.gatewayUrl}
                                    placeholder="https://api.fonnte.com/send"
                                />
                                <p class="text-[10px] text-muted-foreground">
                                    URL API Provider (Fonnte, Wabus, dll)
                                </p>
                            </div>

                            <div class="grid gap-2">
                                <Label>API Key / Token</Label>
                                <Input
                                    type="password"
                                    bind:value={settings.apiKey}
                                    placeholder="Masukkan Token API..."
                                />
                            </div>
                        </div>
                    {/if}
                </div>
            {/if}
        </CardContent>
    </Card>

    <Card>
        <CardHeader>
            <CardTitle>Template Pesan</CardTitle>
            <CardDescription
                >Sesuaikan isi pesan yang akan dikirim secara otomatis. Gunakan <code
                    >&#123;variable&#125;</code
                > untuk data dinamis.</CardDescription
            >
        </CardHeader>
        <CardContent class="space-y-6">
            <!-- New Service -->
            <div class="space-y-3">
                <div class="flex items-center justify-between">
                    <Label>Service Baru Diterima</Label>
                    <Switch bind:checked={settings.autoSendOnNewService} />
                </div>
                {#if settings.autoSendOnNewService}
                    <Textarea
                        bind:value={settings.newServiceTemplate}
                        rows={3}
                    />
                    <p class="text-xs text-muted-foreground">
                        Variables: <code>&#123;customer&#125;</code>,
                        <code>&#123;serviceNo&#125;</code>,
                        <code>&#123;device&#125;</code>
                    </p>
                {/if}
            </div>

            <Separator />

            <!-- Status Update -->
            <div class="space-y-3">
                <div class="flex items-center justify-between">
                    <Label>Update Status Service</Label>
                    <Switch bind:checked={settings.autoSendOnStatusChange} />
                </div>
                {#if settings.autoSendOnStatusChange}
                    <Textarea
                        bind:value={settings.statusUpdateTemplate}
                        rows={3}
                    />
                    <p class="text-xs text-muted-foreground">
                        Variables: <code>&#123;customer&#125;</code>,
                        <code>&#123;serviceNo&#125;</code>,
                        <code>&#123;status&#125;</code>
                    </p>
                {/if}
            </div>

            <Separator />

            <!-- Completed -->
            <div class="space-y-3">
                <div class="flex items-center justify-between">
                    <Label>Service Selesai & Siap Diambil</Label>
                    <Switch bind:checked={settings.autoSendOnComplete} />
                </div>
                {#if settings.autoSendOnComplete}
                    <Textarea
                        bind:value={settings.readyForPickupTemplate}
                        rows={3}
                    />
                    <p class="text-xs text-muted-foreground">
                        Variables: <code>&#123;customer&#125;</code>,
                        <code>&#123;serviceNo&#125;</code>,
                        <code>&#123;total&#125;</code>
                    </p>
                {/if}
            </div>

            <Separator />

            <!-- Warranty -->
            <div class="space-y-3">
                <div class="flex items-center justify-between">
                    <Label>Reminder Garansi Habis</Label>
                </div>
                <Textarea
                    bind:value={settings.warrantyReminderTemplate}
                    rows={3}
                />
                <p class="text-xs text-muted-foreground">
                    Variables: <code>&#123;customer&#125;</code>,
                    <code>&#123;serviceNo&#125;</code>,
                    <code>&#123;days&#125;</code>
                </p>
            </div>
        </CardContent>
    </Card>

    <div class="flex justify-end">
        <Button onclick={save} disabled={saving}>
            {#if saving}
                <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
            {:else}
                <Save class="mr-2 h-4 w-4" />
                Simpan Pengaturan
            {/if}
        </Button>
    </div>
</div>
