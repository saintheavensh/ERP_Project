<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogDescription,
    } from "$lib/shared/components/ui/dialog";
    import { Label } from "$lib/shared/components/ui/label";
    import { AlertTriangle, Check, ArrowRight } from "lucide-svelte";
    import {
        SettingsService,
        type GeneralSettings,
    } from "$lib/features/settings/settings.service";
    import { api } from "$lib/shared/lib/api-client";
    import { toast } from "svelte-sonner";

    interface Props {
        open: boolean;
        onClose: () => void;
        onComplete: () => void;
    }

    let { open = $bindable(), onClose, onComplete }: Props = $props();

    let configChoice = $state<"default" | "custom">("default");
    let saving = $state(false);

    async function handleContinue() {
        // Both options now directly enable Pro Mode
        await enableProMode();
    }

    async function enableProMode() {
        try {
            saving = true;

            if (configChoice === "default") {
                // Seed standard accounts when using Default configuration
                const seedResult = await api.post("/accounting/accounts/seed");
                if (seedResult?.data?.created > 0) {
                    toast.success(
                        `${seedResult.data.created} akun standar berhasil dibuat!`,
                    );
                }
            } else {
                // Custom: Reset all accounts and redirect to Chart of Accounts
                const resetResult = await api.delete(
                    "/accounting/accounts/reset",
                );
                if (resetResult?.data?.deleted > 0) {
                    toast.info(
                        `${resetResult.data.deleted} akun lama dihapus. Silakan buat akun baru.`,
                    );
                }
            }

            // Enable Pro Mode
            const settings: GeneralSettings = {
                accountingMode: "professional",
                accountingSetupComplete: true,
            };
            await SettingsService.setGeneralSettings(settings);

            toast.success("Mode Profesional berhasil diaktifkan!");
            onComplete();

            // If custom, redirect to Chart of Accounts page after a short delay
            if (configChoice === "custom") {
                setTimeout(() => {
                    window.location.href = "/accounting/accounts";
                }, 500);
            }
        } catch (e) {
            console.error("Failed to enable Pro Mode", e);
            toast.error("Gagal mengaktifkan Mode Profesional");
        } finally {
            saving = false;
        }
    }

    function handleClose() {
        configChoice = "default";
        onClose();
    }
</script>

<Dialog bind:open onOpenChange={(isOpen) => !isOpen && handleClose()}>
    <DialogContent class="max-w-lg">
        <DialogHeader>
            <div class="flex items-center gap-3">
                <div class="p-2.5 rounded-xl bg-amber-100 text-amber-600">
                    <AlertTriangle class="h-5 w-5" />
                </div>
                <div>
                    <DialogTitle class="text-lg">Mode Profesional</DialogTitle>
                    <DialogDescription class="mt-0.5">
                        Fitur akuntansi lengkap
                    </DialogDescription>
                </div>
            </div>
        </DialogHeader>

        <div class="space-y-4 py-4">
            <div
                class="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800"
            >
                <p class="font-semibold mb-2">
                    ⚠️ Mode ini membutuhkan pemahaman akuntansi dasar.
                </p>
                <ul class="list-disc list-inside space-y-1 text-amber-700">
                    <li>Chart of Accounts & Jurnal Umum</li>
                    <li>Neraca & Laporan Arus Kas</li>
                    <li>Penyusutan Aset Otomatis</li>
                </ul>
            </div>

            <div class="space-y-3">
                <Label
                    class="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                    Pilih Konfigurasi Akun
                </Label>

                <button
                    type="button"
                    class="w-full p-4 rounded-xl border-2 transition-all text-left {configChoice ===
                    'default'
                        ? 'border-blue-500 bg-blue-50/50'
                        : 'border-slate-200 hover:border-slate-300'}"
                    onclick={() => (configChoice = "default")}
                >
                    <div class="flex items-center gap-3">
                        <div
                            class="h-5 w-5 rounded-full border-2 flex items-center justify-center {configChoice ===
                            'default'
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-slate-300'}"
                        >
                            {#if configChoice === "default"}
                                <Check class="h-3 w-3 text-white" />
                            {/if}
                        </div>
                        <div>
                            <p class="font-semibold text-sm">Gunakan Default</p>
                            <p class="text-xs text-muted-foreground">
                                Akun sudah di-setup otomatis sesuai standar
                            </p>
                        </div>
                    </div>
                </button>

                <button
                    type="button"
                    class="w-full p-4 rounded-xl border-2 transition-all text-left {configChoice ===
                    'custom'
                        ? 'border-blue-500 bg-blue-50/50'
                        : 'border-slate-200 hover:border-slate-300'}"
                    onclick={() => (configChoice = "custom")}
                >
                    <div class="flex items-center gap-3">
                        <div
                            class="h-5 w-5 rounded-full border-2 flex items-center justify-center {configChoice ===
                            'custom'
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-slate-300'}"
                        >
                            {#if configChoice === "custom"}
                                <Check class="h-3 w-3 text-white" />
                            {/if}
                        </div>
                        <div>
                            <p class="font-semibold text-sm">Mulai dari Nol</p>
                            <p class="text-xs text-muted-foreground">
                                Hapus semua akun & buat sendiri di Chart of
                                Accounts
                            </p>
                        </div>
                    </div>
                </button>
            </div>
        </div>

        <div class="flex justify-end gap-3 pt-2">
            <Button variant="outline" onclick={handleClose}>Batal</Button>
            <Button onclick={handleContinue} disabled={saving}>
                {saving ? "Menyimpan..." : "Lanjutkan"}
                <ArrowRight class="ml-2 h-4 w-4" />
            </Button>
        </div>
    </DialogContent>
</Dialog>

