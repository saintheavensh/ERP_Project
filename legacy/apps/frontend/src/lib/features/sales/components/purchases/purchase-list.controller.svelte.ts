import { api } from "$lib/shared/lib/api-client";
import { toast } from "svelte-sonner";
import { authStore } from "$lib/shared/lib/auth-store.svelte";
import { goto } from "$app/navigation";

export class PurchaseListController {
    // State
    purchases = $state<any[]>([]);
    loading = $state(false);
    search = $state("");
    statusFilter = $state("");
    startDate = $state("");
    endDate = $state("");

    // Access role derived from authStore
    get role() {
        return authStore.role;
    }

    get canCreate() {
        return ["manager", "owner", "super_admin"].includes(this.role as string);
    }

    get totalSpent() {
        return this.purchases.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
    }

    get totalItems() {
        return this.purchases.reduce((acc, p) => acc + (p.items?.length || 0), 0);
    }

    async load() {
        this.loading = true;
        try {
            const params = new URLSearchParams();
            if (this.search) params.append("search", this.search);
            if (this.statusFilter) params.append("status", this.statusFilter);
            if (this.startDate) params.append("startDate", this.startDate);
            if (this.endDate) params.append("endDate", this.endDate);

            const res = await api.get(`/purchases?${params.toString()}`);
            this.purchases = res.data?.data || res.data || [];
        } catch (e) {
            console.error(e);
            toast.error("Gagal memuat data pembelian");
        } finally {
            this.loading = false;
        }
    }

    handleSearch() {
        this.load();
    }

    async handleDelete(id: string) {
        if (!confirm("Apakah Anda yakin ingin menghapus data pembelian ini? Stok akan dikembalikan.")) {
            return;
        }
        try {
            await api.delete(`/purchases/${id}`);
            toast.success("Pembelian berhasil dihapus");
            this.load();
        } catch (e) {
            console.error(e);
            toast.error("Gagal menghapus pembelian");
        }
    }

    // Helpers
    getStatusColor(status: string) {
        switch (status) {
            case "ORDERED":
                return "bg-blue-500";
            case "RECEIVED":
                return "bg-amber-500";
            case "VERIFIED":
                return "bg-green-500";
            default:
                return "bg-slate-500";
        }
    }

    formatDate(dateStr: string) {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    }

    formatRp(val: number) {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(val);
    }
}
