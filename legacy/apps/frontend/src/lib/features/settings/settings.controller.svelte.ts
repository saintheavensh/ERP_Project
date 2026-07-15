
import {
    SettingsService,
    type StoreInfo,
    type ServiceSettings
} from "$lib/features/settings/settings.service";
import { settingsStore } from "$lib/features/settings/settings-store.svelte";
import { toast } from "svelte-sonner";

export class SettingsController {
    // --- Store Info State ---
    storeInfo = $state<StoreInfo>({
        name: "",
        address: "",
        phone: "",
        email: "",
        logo: "",
        socialMedia: "",
    });

    // --- Service Settings State ---
    serviceSettings = $state<ServiceSettings>({
        numberFormat: "SRV-{YYYY}-{XXX}",
        resetCounterYearly: true,
        defaultStatus: "antrian",
        autoNotifyOnStatusChange: false,
        commissionModel: "completion",
        warrantyPresets: [],
        defaultWarrantyDays: 7,
        gracePeriodDays: 3,
        autoCloseAfterDays: 30,
        enableVirtualArchive: true,
        archiveExclusions: ["dikerjakan"],
        enableLiquidation: false,
        reminderBeforePickup: true,
        reminderDays: 7,
    });

    // --- UI State ---
    loading = $state(false);
    saving = $state(false);
    newPresetLabel = $state("");
    newPresetDays = $state(0);

    constructor() { }

    // ==========================================
    // Store Settings Methods
    // ==========================================

    async loadStoreInfo() {
        this.loading = true;
        try {
            const data = await SettingsService.getStoreInfo();
            this.storeInfo = {
                name: data.name || "",
                address: data.address || "",
                phone: data.phone || "",
                email: data.email || "",
                logo: data.logo || "",
                socialMedia: data.socialMedia || "",
            };
        } catch (e) {
            console.error(e);
            toast.error("Gagal memuat informasi toko");
        } finally {
            this.loading = false;
        }
    }

    async saveStoreInfo() {
        this.saving = true;
        try {
            await SettingsService.setStoreInfo(this.storeInfo);
            toast.success("Informasi toko berhasil disimpan");
            await settingsStore.refresh();
        } catch (e) {
            toast.error("Gagal menyimpan informasi toko");
        } finally {
            this.saving = false;
        }
    }

    handleLogoUpload(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                this.storeInfo.logo = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    }

    resetLogo() {
        this.storeInfo.logo = "";
    }

    // ==========================================
    // Service Settings Methods
    // ==========================================

    async loadServiceSettings() {
        this.loading = true;
        try {
            const data = await SettingsService.getServiceSettings();
            if (data) {
                this.serviceSettings = {
                    ...this.serviceSettings,
                    ...data,
                    // Explicit safeguards for fields that might be missing
                    enableVirtualArchive: data.enableVirtualArchive ?? true,
                    archiveExclusions: data.archiveExclusions ?? ["dikerjakan"],
                    enableLiquidation: data.enableLiquidation ?? false,
                    commissionModel: data.commissionModel ?? "completion",
                };
            }
        } catch (e) {
            console.error(e);
            toast.error("Gagal memuat pengaturan service");
        } finally {
            this.loading = false;
        }
    }

    async saveServiceSettings() {
        this.saving = true;
        try {
            await SettingsService.setServiceSettings(this.serviceSettings);
            await settingsStore.refresh();
            toast.success("Pengaturan service berhasil disimpan");
        } catch (e) {
            toast.error("Gagal menyimpan pengaturan");
        } finally {
            this.saving = false;
        }
    }

    addPreset() {
        if (!this.newPresetLabel || this.newPresetDays < 0) return;
        this.serviceSettings.warrantyPresets = [
            ...this.serviceSettings.warrantyPresets,
            { label: this.newPresetLabel, days: this.newPresetDays },
        ];
        this.newPresetLabel = "";
        this.newPresetDays = 0;
    }

    removePreset(index: number) {
        this.serviceSettings.warrantyPresets = this.serviceSettings.warrantyPresets.filter(
            (_, i) => i !== index,
        );
    }

    toggleArchiveExclusion(status: string) {
        if (this.serviceSettings.archiveExclusions?.includes(status)) {
            this.serviceSettings.archiveExclusions = this.serviceSettings.archiveExclusions.filter(s => s !== status);
        } else {
            this.serviceSettings.archiveExclusions = [...(this.serviceSettings.archiveExclusions || []), status];
        }
    }

    // Derived Logic for Preview Number
    get previewNumber() {
        const date = new Date();
        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");

        let fmt = this.serviceSettings.numberFormat || "SRV-{XXX}";
        fmt = fmt.replace(/{YYYY}/g, year);
        fmt = fmt.replace(/{YY}/g, year.slice(-2));
        fmt = fmt.replace(/{MM}/g, month);
        fmt = fmt.replace(/{DD}/g, day);
        fmt = fmt.replace(/{XXX+}/g, (m) => "0".repeat(m.length - 2) + "1");
        fmt = fmt.replace(/{XXX}/g, "001");

        return fmt;
    }
}
