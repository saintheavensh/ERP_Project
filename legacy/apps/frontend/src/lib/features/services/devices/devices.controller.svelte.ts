import { createQuery, createMutation, useQueryClient } from "@tanstack/svelte-query";
import { ProductsService } from "$lib/features/inventory/products/products.service";
import { BrandsService, type Brand } from "$lib/features/inventory/brands/brands.service";
import { toast } from "svelte-sonner";
import type { Device } from "@repo/shared";

export class DevicesController {
    #queryClient = useQueryClient();

    // UI State
    searchTerm = $state("");
    selectedBrand = $state("all");
    layout = $state<"grid" | "list">("grid");

    // Dialog States
    openDialog = $state(false);
    openDelete = $state(false);
    openBulkDelete = $state(false);
    detailOpen = $state(false);

    // Selection State
    selectedIds = $state<string[]>([]);
    deletingId = $state<string | null>(null);
    editingId = $state<string | null>(null);
    selectedDevice = $state<Device | null>(null);

    // Form State
    form = $state({
        brand: "",
        series: "",
        model: "",
        code: "",
        image: "",
        specs: "",
        chipset: "",
        colors: "", // comma separated
        os: "",
        display: "",
        displayType: "",
        network: "",
        release: "",
        usb: "",
        mainCamera: "",
        selfieCamera: "",
        battery: "",
    });

    // Queries
    brandsQuery = createQuery(() => ({
        queryKey: ["brands"],
        queryFn: BrandsService.getAll,
    }));

    devicesQuery = createQuery(() => ({
        queryKey: ["devices", this.searchTerm],
        queryFn: () => ProductsService.getDevices(this.searchTerm, 1000), // Fetch all for client-side filtering/stats
    }));

    // Derived Data
    brands = $derived(this.brandsQuery.data || []);
    devices = $derived(this.devicesQuery.data || []);
    loading = $derived(this.devicesQuery.isLoading);

    filteredDevices = $derived.by(() => {
        let result = this.devices;

        if (this.selectedBrand !== "all") {
            result = result.filter(d => d.brand === this.selectedBrand);
        }

        // Search is handled by API but we can refine here if needed
        // For now relying on API search or if API returns all, we filter here
        // The current API usage seems to pass searchTerm to getDevices

        return result;
    });

    // Stats
    totalDevices = $derived(this.devices.length);
    brandStats = $derived.by(() => {
        const stats: Record<string, number> = {};
        this.devices.forEach(d => {
            stats[d.brand] = (stats[d.brand] || 0) + 1;
        });
        return stats;
    });

    topBrand = $derived.by(() => {
        if (this.devices.length === 0) return "-";
        const entries = Object.entries(this.brandStats);
        if (entries.length === 0) return "-";
        return entries.sort((a, b) => b[1] - a[1])[0][0];
    });

    // Grouping
    groupedDevices = $derived.by(() => {
        const groups: Record<string, { flat: Device[], series: Record<string, Device[]> }> = {};

        this.filteredDevices.forEach(d => {
            if (!groups[d.brand]) {
                groups[d.brand] = { flat: [], series: {} };
            }

            if (d.series && d.series.trim()) {
                if (!groups[d.brand].series[d.series]) {
                    groups[d.brand].series[d.series] = [];
                }
                groups[d.brand].series[d.series].push(d);
            } else {
                groups[d.brand].flat.push(d);
            }
        });

        // Sort keys
        return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
    });

    // Mutations
    #createMutation = createMutation(() => ({
        mutationFn: ProductsService.createDevice,
        onSuccess: () => {
            this.#queryClient.invalidateQueries({ queryKey: ["devices"] });
            toast.success("Device berhasil dibuat");
            this.openDialog = false;
            this.resetForm();
        },
        onError: (err: any) => toast.error(err.response?.data?.message || "Gagal membuat device"),
    }));

    #updateMutation = createMutation(() => ({
        mutationFn: (data: any) => ProductsService.updateDevice(data.id, data.data),
        onSuccess: () => {
            this.#queryClient.invalidateQueries({ queryKey: ["devices"] });
            toast.success("Device berhasil diperbarui");
            this.openDialog = false;
            this.resetForm();
        },
        onError: (err: any) => toast.error(err.response?.data?.message || "Gagal memperbarui device"),
    }));

    #deleteMutation = createMutation(() => ({
        mutationFn: ProductsService.deleteDevice,
        onSuccess: () => {
            this.#queryClient.invalidateQueries({ queryKey: ["devices"] });
            toast.success("Device dihapus");
            this.openDelete = false;
            this.deletingId = null;
        },
        onError: () => toast.error("Gagal menghapus device"),
    }));

    #bulkDeleteMutation = createMutation(() => ({
        mutationFn: ProductsService.bulkDeleteDevices,
        onSuccess: () => {
            this.#queryClient.invalidateQueries({ queryKey: ["devices"] });
            toast.success(`${this.selectedIds.length} device dihapus`);
            this.openBulkDelete = false;
            this.selectedIds = [];
        },
        onError: () => toast.error("Gagal menghapus device terpilih"),
    }));

    // Sync Mutation
    isSyncing = $state(false);
    async syncCompatibility(id: string) {
        this.isSyncing = true;
        try {
            const res = await ProductsService.syncDeviceCompatibility(id);
            toast.success(`Synced with ${res.count} products`);
        } catch (e) {
            toast.error("Failed to sync");
        } finally {
            this.isSyncing = false;
        }
    }

    // Actions
    resetForm() {
        this.editingId = null;
        this.form = {
            brand: "",
            series: "",
            model: "",
            code: "",
            image: "",
            specs: "",
            chipset: "",
            colors: "",
            os: "",
            display: "",
            displayType: "",
            network: "",
            release: "",
            usb: "",
            mainCamera: "",
            selfieCamera: "",
            battery: "",
        };
    }

    handleCreateNew() {
        this.resetForm();
        this.openDialog = true;
    }

    handleEdit(device: Device) {
        this.editingId = device.id;
        const specs = device.specifications || {};

        this.form = {
            brand: device.brand,
            series: device.series || "",
            model: device.model,
            code: device.code || "",
            image: device.image || "",
            specs: device.specs || "",
            chipset: device.chipset || "",
            colors: Array.isArray(device.colors) ? device.colors.join(", ") : "",

            // Unpack specifications
            os: specs.platform?.os || "",
            display: specs.display?.resolution || "",
            displayType: specs.display?.type || "",
            network: specs.network?.technology || "",
            release: specs.launch?.announced || "",
            usb: specs.comms?.usb || "",
            mainCamera: specs.main_camera?.single || specs.main_camera?.dual || specs.main_camera?.triple || specs.main_camera?.quad || "",
            selfieCamera: specs.selfie_camera?.single || "",
            battery: specs.battery?.type || "",
        };
        this.openDialog = true;
    }

    handleDelete(id: string) {
        this.deletingId = id;
        this.openDelete = true;
    }

    confirmDelete() {
        if (this.deletingId) {
            this.#deleteMutation.mutate(this.deletingId);
        }
    }

    toggleSelect(id: string) {
        if (this.selectedIds.includes(id)) {
            this.selectedIds = this.selectedIds.filter(i => i !== id);
        } else {
            this.selectedIds = [...this.selectedIds, id];
        }
    }

    confirmBulkDelete() {
        if (this.selectedIds.length > 0) {
            this.openBulkDelete = true;
        }
    }

    handleBulkDelete() {
        this.#bulkDeleteMutation.mutate(this.selectedIds);
    }

    handleSubmit() {
        if (!this.form.brand || !this.form.model) {
            toast.error("Brand dan Model wajib diisi");
            return;
        }

        const normalizeBrandName = (name: string) => {
            if (!name || name.trim().length === 0) return name;
            const trimmed = name.trim();
            return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
        };

        const payload = {
            brand: normalizeBrandName(this.form.brand),
            model: this.form.model,
            series: this.form.series || undefined,
            code: this.form.code || undefined,
            image: this.form.image || undefined,
            specs: this.form.specs,
            chipset: this.form.chipset,
            colors: this.form.colors ? this.form.colors.split(",").map(c => c.trim()).filter(c => c) : [],
            specifications: {
                network: { technology: this.form.network },
                launch: { announced: this.form.release },
                display: { type: this.form.displayType, resolution: this.form.display },
                platform: { os: this.form.os },
                comms: { usb: this.form.usb },
                main_camera: { single: this.form.mainCamera },
                selfie_camera: { single: this.form.selfieCamera },
                battery: { type: this.form.battery }
            }
        };

        if (this.editingId) {
            this.#updateMutation.mutate({ id: this.editingId, data: payload });
        } else {
            this.#createMutation.mutate(payload);
        }
    }

    isSubmitting = $derived(this.#createMutation.isPending || this.#updateMutation.isPending);
}
