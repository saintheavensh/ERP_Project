import {
    createQuery,
    createMutation,
    useQueryClient,
    type CreateQueryResult,
} from "@tanstack/svelte-query";
import { SuppliersService, type CreateSupplierInput } from "./suppliers.service";
import { toast } from "svelte-sonner";
import type { Supplier } from "@repo/shared";

/**
 * Controller for the Suppliers page
 * Manages state and business logic for supplier CRUD operations
 */
export class SuppliersController {
    private queryClient = useQueryClient();

    // UI State
    searchQuery = $state("");
    openSupplier = $state(false);
    openDelete = $state(false);
    deleteId = $state<string | null>(null);

    // Form State
    editingId = $state<string | null>(null);
    name = $state("");
    contact = $state("");
    phone = $state("");
    address = $state("");
    image = $state("");

    // Query
    suppliersQuery: CreateQueryResult<Supplier[], Error>;

    constructor() {
        this.suppliersQuery = createQuery(() => ({
            queryKey: ["suppliers"],
            queryFn: SuppliersService.getAll,
        }));
    }

    // Mutations
    private saveSupplierMutation = createMutation(() => ({
        mutationFn: async (data: any) => {
            if (data.id) {
                return SuppliersService.update(data.id, data);
            } else {
                return SuppliersService.create(data);
            }
        },
        onSuccess: () => {
            this.queryClient.invalidateQueries({ queryKey: ["suppliers"] });
            toast.success("Data supplier berhasil disimpan");
            this.openSupplier = false;
            this.resetForm();
        },
        onError: () => toast.error("Gagal menyimpan supplier"),
    }));

    private deleteSupplierMutation = createMutation(() => ({
        mutationFn: SuppliersService.delete,
        onSuccess: () => {
            this.queryClient.invalidateQueries({ queryKey: ["suppliers"] });
            toast.success("Supplier berhasil dihapus");
            this.openDelete = false;
        },
        onError: () => toast.error("Gagal menghapus supplier"),
    }));

    // Derived values
    get suppliers(): Supplier[] {
        return this.suppliersQuery.data || [];
    }

    get loading(): boolean {
        return this.suppliersQuery.isLoading;
    }

    get filteredSuppliers(): Supplier[] {
        const query = this.searchQuery.toLowerCase();
        return this.suppliers.filter(
            (s) =>
                s.name.toLowerCase().includes(query) ||
                (s.phone && s.phone.includes(this.searchQuery)) ||
                (s.contact && s.contact.toLowerCase().includes(query))
        );
    }

    get totalSuppliers(): number {
        return this.suppliers.length;
    }

    get activeContacts(): number {
        return this.suppliers.filter((s) => s.contact).length;
    }

    get reliablePartners(): number {
        return Math.max(1, Math.floor(this.totalSuppliers * 0.8));
    }

    get isSaving(): boolean {
        return this.saveSupplierMutation.isPending;
    }

    // Helper methods
    getInitials(name: string): string {
        if (!name) return "??";
        return name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
    }

    // Form methods
    resetForm(): void {
        this.editingId = null;
        this.name = "";
        this.contact = "";
        this.phone = "";
        this.address = "";
        this.image = "";
    }

    openCreateDialog(): void {
        this.resetForm();
        this.openSupplier = true;
    }

    handleEdit(supplier: Supplier): void {
        this.editingId = supplier.id;
        this.name = supplier.name;
        this.contact = supplier.contact || "";
        this.phone = supplier.phone || "";
        this.address = supplier.address || "";
        this.image = supplier.image || "";
        this.openSupplier = true;
    }

    confirmDelete(id: string): void {
        this.deleteId = id;
        this.openDelete = true;
    }

    handleDeleteSupplier(): void {
        if (!this.deleteId) return;
        this.deleteSupplierMutation.mutate(this.deleteId);
    }

    handleSaveSupplier(): void {
        if (!this.name) {
            toast.error("Nama supplier wajib diisi");
            return;
        }

        const payload = {
            id: this.editingId,
            name: this.name,
            contact: this.contact,
            phone: this.phone,
            address: this.address,
            image: this.image,
        };
        this.saveSupplierMutation.mutate(payload);
    }

    closeDialog(): void {
        this.openSupplier = false;
        this.resetForm();
    }
}
