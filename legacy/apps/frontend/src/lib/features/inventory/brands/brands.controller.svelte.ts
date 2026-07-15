import { toast } from "svelte-sonner";
import { BrandsService, type Brand } from "./brands.service";

interface BrandFormData {
    id: string;
    name: string;
    logo: string;
}

/**
 * Controller for the Brands page
 * Manages state and business logic for brand CRUD operations
 */
export class BrandsController {
    // State
    brands = $state<Brand[]>([]);
    loading = $state(false);
    isDialogOpen = $state(false);
    isEditing = $state(false);

    formData = $state<BrandFormData>({
        id: "",
        name: "",
        logo: "",
    });

    /**
     * Initialize the controller by loading brands
     */
    init(): void {
        this.loadBrands();
    }

    /**
     * Load all brands from API
     */
    async loadBrands(): Promise<void> {
        this.loading = true;
        try {
            this.brands = await BrandsService.getAll();
        } catch (error) {
            toast.error("Gagal memuat data brand");
            console.error(error);
        } finally {
            this.loading = false;
        }
    }

    /**
     * Reset form to initial state
     */
    resetForm(): void {
        this.formData = { id: "", name: "", logo: "" };
        this.isEditing = false;
    }

    /**
     * Open dialog for creating a new brand
     */
    openCreateDialog(): void {
        this.resetForm();
        this.isDialogOpen = true;
    }

    /**
     * Open dialog for editing an existing brand
     */
    openEditDialog(brand: Brand): void {
        this.formData = { ...brand, logo: brand.logo || "" };
        this.isEditing = true;
        this.isDialogOpen = true;
    }

    /**
     * Close the dialog
     */
    closeDialog(): void {
        this.isDialogOpen = false;
        this.resetForm();
    }

    /**
     * Handle form submission for create/update
     */
    async handleSubmit(): Promise<void> {
        if (!this.formData.name) {
            toast.error("Nama brand harus diisi");
            return;
        }

        // If creating, generate ID from name if not provided
        if (!this.isEditing && !this.formData.id) {
            this.formData.id = this.formData.name
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "-");
        }

        try {
            if (this.isEditing) {
                await BrandsService.update(this.formData.id, {
                    name: this.formData.name,
                    logo: this.formData.logo,
                });
                toast.success("Brand berhasil diperbarui");
            } else {
                await BrandsService.create(this.formData);
                toast.success("Brand berhasil dibuat");
            }
            this.isDialogOpen = false;
            this.loadBrands();
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || "Gagal menyimpan brand"
            );
        }
    }

    /**
     * Handle brand deletion with confirmation
     */
    async handleDelete(id: string): Promise<void> {
        if (!confirm("Apakah anda yakin ingin menghapus brand ini?")) return;

        try {
            await BrandsService.delete(id);
            toast.success("Brand berhasil dihapus");
            this.loadBrands();
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || "Gagal menghapus brand"
            );
        }
    }
}
