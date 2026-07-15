import { createQuery, createMutation, useQueryClient } from "@tanstack/svelte-query";
import { CustomersService } from "./customers.service";
import { toast } from "svelte-sonner";

export class CustomersController {
    #queryClient = useQueryClient();

    // State
    searchQuery = $state("");
    openDialog = $state(false);
    openDelete = $state(false);
    deleteId = $state<string | null>(null);
    editingId = $state<string | null>(null);

    // Form State
    name = $state("");
    phone = $state("");
    address = $state("");
    creditLimit = $state(0);

    // Queries
    customersQuery = createQuery(() => ({
        queryKey: ["customers"],
        queryFn: () => CustomersService.getAll(),
    }));

    // Derived
    customers = $derived(this.customersQuery.data || []);
    loading = $derived(this.customersQuery.isLoading);

    filteredCustomers = $derived(
        (this.customers || []).filter(
            (c: any) =>
                c.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                (c.phone && c.phone.includes(this.searchQuery))
        )
    );

    // Stats
    totalCustomers = $derived(this.customers.length);
    totalDebt = $derived(
        this.customers.reduce((acc: number, cur: any) => acc + (cur.debt || 0), 0)
    );
    totalLimit = $derived(
        this.customers.reduce(
            (acc: number, cur: any) => acc + (cur.creditLimit || 0),
            0
        )
    );
    activeReceivables = $derived(
        this.customers.filter((c: any) => (c.debt || 0) > 0).length
    );

    // Mutations
    #saveCustomerMutation = createMutation(() => ({
        mutationFn: async (data: any) => {
            if (data.id) {
                return CustomersService.update(data.id, data);
            } else {
                return CustomersService.create(data);
            }
        },
        onSuccess: () => {
            this.#queryClient.invalidateQueries({ queryKey: ["customers"] });
            toast.success("Data pelanggan berhasil disimpan");
            this.openDialog = false;
            this.resetForm();
        },
        onError: (err: any) => {
            toast.error(
                err.response?.data?.message || "Gagal menyimpan pelanggan"
            );
        },
    }));

    #deleteCustomerMutation = createMutation(() => ({
        mutationFn: CustomersService.delete,
        onSuccess: () => {
            this.#queryClient.invalidateQueries({ queryKey: ["customers"] });
            toast.success("Pelanggan berhasil dihapus");
            this.openDelete = false;
        },
        onError: () => toast.error("Gagal menghapus pelanggan"),
    }));

    get isSubmitting() {
        return this.#saveCustomerMutation.isPending;
    }

    get isDeleting() {
        return this.#deleteCustomerMutation.isPending;
    }

    // Actions
    resetForm() {
        this.editingId = null;
        this.name = "";
        this.phone = "";
        this.address = "";
        this.creditLimit = 0;
    }

    handleEdit(customer: any) {
        this.editingId = customer.id;
        this.name = customer.name;
        this.phone = customer.phone || "";
        this.address = customer.address || "";
        this.creditLimit = customer.creditLimit || 0;
        this.openDialog = true;
    }

    confirmDelete(id: string) {
        this.deleteId = id;
        this.openDelete = true;
    }

    handleDelete() {
        if (!this.deleteId) return;
        this.#deleteCustomerMutation.mutate(this.deleteId);
    }

    handleSave() {
        if (!this.name) {
            toast.error("Nama wajib diisi");
            return;
        }
        if (!this.phone) {
            toast.error("Telepon wajib diisi");
            return;
        }

        const payload = {
            id: this.editingId,
            name: this.name,
            phone: this.phone,
            address: this.address,
            creditLimit: Number(this.creditLimit),
        };
        this.#saveCustomerMutation.mutate(payload);
    }

    getInitials(name: string) {
        if (!name) return "??";
        return name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
    }
}
