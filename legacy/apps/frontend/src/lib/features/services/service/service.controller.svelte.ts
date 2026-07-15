
import { ServiceService } from "$lib/features/services/services/service.service";
import { SettingsService, type ServiceSettings } from "$lib/features/settings/settings.service";
import { api } from "$lib/shared/lib/api-client";
import { toast } from "svelte-sonner";
import { refreshServiceList } from "$lib/features/services/services/event-store.svelte";
import { authStore } from "$lib/shared/lib/auth-store.svelte";
import {
    Play,
    UserPlus,
    ChevronRight,
    CheckCircle,
    Package,
} from "lucide-svelte";
import type { ComponentType } from "svelte";

export class ServiceController {
    // Data State
    serviceOrders = $state<any[]>([]);
    loading = $state(false);
    settings = $state<ServiceSettings | null>(null);
    technicians = $state<{ id: string; name: string }[]>([]);

    // Filters
    searchQuery = $state("");
    filterStatus = $state("all");
    filterTechnician = $state("all");
    showArchived = $state(false);

    // Modal States
    showReassignModal = $state(false);
    showScanner = $state(false);
    selectedServiceForReassign = $state<any>(null);

    // Quick Action Modal States
    showAssignModal = $state(false);
    showPickupModal = $state(false);
    showDiagnosisModal = $state(false);
    showCompletionModal = $state(false);
    showReconfirmModal = $state(false);
    selectedOrderForAction = $state<any>(null);
    selectedTechnicianId = $state("");

    // Action Data
    diagnosisNotes = $state("");
    diagnosisPossibleCauses = $state("");
    diagnosisCostEstimate = $state(0);
    completionNotes = $state("");
    completionActualCost = $state(0);
    reconfirmInput = $state({
        notes: "",
        replacedComponent: "",
        cost: 0,
    });

    // Confirm Dialog
    showConfirmDialog = $state(false);
    confirmDialogConfig = $state({
        title: "",
        description: "",
        action: async () => { },
        actionLabel: "",
        variant: "default" as "default" | "destructive" | undefined,
    });
    isProcessingAction = $state(false);

    // Logic for "Semua Data" view
    isAllDataView = $state(true);

    constructor() { }

    async init(urlStatus?: string | null) {
        if (urlStatus) {
            this.filterStatus = urlStatus;
            this.isAllDataView = false;
        } else {
            this.filterStatus = "all";
            this.isAllDataView = true;
        }

        if (authStore.role === "teknisi") {
            this.filterTechnician = authStore.user?.id || "all";
        }

        await Promise.all([
            this.loadTechnicians(),
            this.loadSettings(),
            this.loadData()
        ]);
    }

    async loadData() {
        this.loading = true;
        try {
            const params: any = {};
            if (this.filterStatus && this.filterStatus !== "all") {
                params.status = this.filterStatus;
            }

            // Enforce Technician Isolation
            if (authStore.role === "teknisi" && authStore.user?.id) {
                params.technicianId = authStore.user.id;
            } else if (this.filterTechnician && this.filterTechnician !== "all") {
                params.technicianId = this.filterTechnician;
            }

            this.serviceOrders = await ServiceService.getAll(params);
        } catch (e) {
            console.error(e);
            toast.error("Gagal memuat data service");
        } finally {
            this.loading = false;
        }
    }

    async loadTechnicians() {
        try {
            this.technicians = await ServiceService.getTechnicians();
        } catch (e) {
            console.error("Failed to load technicians", e);
        }
    }

    async loadSettings() {
        try {
            this.settings = await SettingsService.getServiceSettings();
        } catch (e) {
            console.error("Failed to load settings", e);
        }
    }

    // Derived Logic
    isArchived(order: any) {
        if (!this.settings || !this.settings.enableVirtualArchive) return false;
        if (this.settings.archiveExclusions?.includes(order.status)) return false;

        const lastUpdate = new Date(order.updatedAt || order.dateIn);
        const diffTime = Math.abs(new Date().getTime() - lastUpdate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays > this.settings.autoCloseAfterDays;
    }

    get filteredOrders() {
        return this.serviceOrders.filter((order) => {
            const term = this.searchQuery.toLowerCase();
            const matchesSearch =
                order.no.toLowerCase().includes(term) ||
                order.customer.name.toLowerCase().includes(term) ||
                order.device.brand.toLowerCase().includes(term) ||
                (order.technician?.name || "").toLowerCase().includes(term);

            const archived = this.isArchived(order);
            if (!this.searchQuery && !this.showArchived && archived) return false;

            let matchesTechnician = true;
            if (authStore.role === "teknisi") {
                if (order.technician?.id !== authStore.user?.id) matchesTechnician = false;
            } else if (this.isAllDataView && this.filterTechnician !== "all") {
                if (this.filterTechnician === "unassigned") {
                    matchesTechnician = !order.technician;
                } else {
                    matchesTechnician = order.technician?.id === this.filterTechnician;
                }
            }

            return matchesSearch && matchesTechnician;
        });
    }

    get statusCounts() {
        const counts: Record<string, number> = {
            antrian: 0, dicek: 0, konfirmasi: 0, dikerjakan: 0,
            selesai: 0, batal: 0, diambil: 0,
        };
        this.serviceOrders.forEach((o) => {
            if (counts[o.status] !== undefined) counts[o.status]++;
        });
        return counts;
    }

    get statusTiles() {
        return [
            {
                id: "antrian",
                label: "Antrian",
                count: this.statusCounts.antrian,
                icon: "🕒",
                color: "text-blue-600",
                bg: "bg-blue-50/50 backdrop-blur-sm border-blue-200",
            },
            {
                id: "dicek",
                label: "Dicek",
                count: this.statusCounts.dicek,
                icon: "🔍",
                color: "text-indigo-600",
                bg: "bg-indigo-50/50 backdrop-blur-sm border-indigo-200",
            },
            {
                id: "konfirmasi",
                label: "Konfirmasi",
                count: this.statusCounts.konfirmasi,
                icon: "💬",
                color: "text-amber-600",
                bg: "bg-amber-50/50 backdrop-blur-sm border-amber-200",
            },
            {
                id: "dikerjakan",
                label: "Proses",
                count: this.statusCounts.dikerjakan,
                icon: "🔧",
                color: "text-purple-600",
                bg: "bg-purple-50/50 backdrop-blur-sm border-purple-200",
            },
            {
                id: "selesai",
                label: "Selesai",
                count: this.statusCounts.selesai,
                icon: "✅",
                color: "text-emerald-600",
                bg: "bg-emerald-50/50 backdrop-blur-sm border-emerald-200",
            },
        ];
    }

    // Actions

    getStatusBadge(status: string) {
        switch (status) {
            case "antrian": return { label: "Antrian", variant: "outline", className: "border-blue-200 text-blue-700 bg-blue-50", icon: "🕒" };
            case "dicek": return { label: "Sedang Dicek", variant: "secondary", className: "bg-indigo-100 text-indigo-700 hover:bg-indigo-100", icon: "🔍" };
            case "konfirmasi": return { label: "Tunggu Konfirmasi", variant: "secondary", className: "bg-amber-100 text-amber-700 hover:bg-amber-100", icon: "💬" };
            case "dikerjakan": return { label: "Sedang Dikerjakan", variant: "default", className: "bg-purple-600 hover:bg-purple-700", icon: "🔧" };
            case "re-konfirmasi": return { label: "Re-konfirmasi", variant: "secondary", className: "bg-amber-100 text-amber-700 hover:bg-amber-100", icon: "💬" };
            case "selesai": return { label: "Selesai", variant: "outline", className: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100", icon: "✅" };
            case "diambil": return { label: "Sudah Diambil", variant: "outline", className: "text-muted-foreground bg-muted", icon: "👋" };
            case "batal": return { label: "Dibatalkan", variant: "destructive", className: "", icon: "❌" };
            default: return { label: status, variant: "outline", className: "", icon: "" };
        }
    }

    getNextAction(status: string, hasTechnician: boolean): { label: string, icon: ComponentType, color: string, needsModal: boolean } | null {
        if (authStore.role === "teknisi" && (status === "selesai" || status === "batal")) {
            return null;
        }

        switch (status) {
            case "antrian": return { label: hasTechnician ? "Mulai Cek" : "Assign & Cek", icon: hasTechnician ? Play : UserPlus, color: "bg-blue-600 hover:bg-blue-700 text-white", needsModal: !hasTechnician };
            case "dicek": return { label: "Konfirmasi", icon: ChevronRight, color: "bg-amber-600 hover:bg-amber-700 text-white", needsModal: false };
            case "konfirmasi": return { label: "Kerjakan", icon: Play, color: "bg-purple-600 hover:bg-purple-700 text-white", needsModal: false };
            case "re-konfirmasi": return { label: "Kerjakan", icon: Play, color: "bg-purple-600 hover:bg-purple-700 text-white", needsModal: false };
            case "dikerjakan": return { label: "Selesai", icon: CheckCircle, color: "bg-emerald-600 hover:bg-emerald-700 text-white", needsModal: false };
            case "selesai":
            case "batal": return { label: "Diambil", icon: Package, color: "bg-slate-600 hover:bg-slate-700 text-white", needsModal: true };
            default: return null;
        }
    }

    async handleQuickAction(order: any) {
        const hasTechnician = !!order.technician;
        this.selectedOrderForAction = order;

        switch (order.status) {
            case "antrian":
                if (hasTechnician) {
                    this.confirmDialogConfig = {
                        title: "Mulai Pengecekan?",
                        description: "Pastikan unit sudah siap dimeja service untuk dilakukan analisa awal.",
                        action: async () => await this.updateOrderStatus(order.id, "dicek"),
                        actionLabel: "Mulai Cek",
                        variant: "default",
                    };
                    this.showConfirmDialog = true;
                } else {
                    this.selectedTechnicianId = "";
                    this.showAssignModal = true;
                }
                break;
            case "dicek":
                this.diagnosisNotes = "";
                this.diagnosisPossibleCauses = "";
                this.diagnosisCostEstimate = order.costEstimate || 0;
                this.showDiagnosisModal = true;
                break;
            case "konfirmasi":
            case "re-konfirmasi":
                this.confirmDialogConfig = {
                    title: "Mulai Pengerjaan?",
                    description: "Pastikan customer sudah konfirmasi dan setuju dengan biaya/estimasi.",
                    action: async () => await this.updateOrderStatus(order.id, "dikerjakan"),
                    actionLabel: "Mulai Pengerjaan",
                    variant: "default",
                };
                this.showConfirmDialog = true;
                break;
            case "dikerjakan":
                this.completionNotes = "";
                this.completionActualCost = order.costEstimate || order.actualCost || 0;
                this.showCompletionModal = true;
                break;
            case "selesai":
            case "batal":
                this.showPickupModal = true;
                break;
        }
    }

    async updateOrderStatus(id: number, newStatus: string, extraData?: any) {
        try {
            const uId = authStore.user?.id || "USR-ADMIN";
            await ServiceService.updateStatus(id, {
                status: newStatus as any,
                userId: uId,
                notes: extraData?.notes,
                actualCost: extraData?.actualCost,
            });
            toast.success(`Status berhasil diubah ke ${newStatus}`);
            refreshServiceList.update((n) => n + 1);
            this.loadData();
        } catch (e) {
            console.error(e);
            toast.error("Gagal mengubah status");
        }
    }

    async handleAssignAndStart() {
        if (!this.selectedTechnicianId || !this.selectedOrderForAction) {
            toast.error("Pilih teknisi terlebih dahulu");
            return;
        }
        try {
            await ServiceService.assignTechnician(
                this.selectedOrderForAction.id,
                this.selectedTechnicianId,
            );
            await this.updateOrderStatus(this.selectedOrderForAction.id, "dicek");
            this.showAssignModal = false;
            this.selectedOrderForAction = null;
        } catch (e) {
            toast.error("Gagal assign teknisi");
        }
    }

    async handleSubmitDiagnosis() {
        if (!this.selectedOrderForAction) return;
        if (!this.diagnosisNotes.trim()) {
            toast.error("Mohon isi catatan diagnosa");
            return;
        }
        if (this.diagnosisCostEstimate <= 0) {
            toast.error("Mohon isi estimasi biaya");
            return;
        }
        try {
            await ServiceService.patchService(this.selectedOrderForAction.id, {
                diagnosis: {
                    initial: this.diagnosisNotes,
                    possibleCauses: this.diagnosisPossibleCauses,
                },
                costEstimate: this.diagnosisCostEstimate,
            });
            await this.updateOrderStatus(this.selectedOrderForAction.id, "konfirmasi", {
                notes: this.diagnosisNotes,
            });
            this.showDiagnosisModal = false;
            this.selectedOrderForAction = null;
        } catch (e) {
            toast.error("Gagal menyimpan diagnosa");
        }
    }

    async handleSubmitCompletion() {
        if (!this.selectedOrderForAction) return;
        if (this.completionActualCost <= 0) {
            toast.error("Mohon isi biaya aktual");
            return;
        }
        try {
            await this.updateOrderStatus(this.selectedOrderForAction.id, "selesai", {
                notes: this.completionNotes,
                actualCost: this.completionActualCost,
            });
            this.showCompletionModal = false;
            this.selectedOrderForAction = null;
        } catch (e) {
            toast.error("Gagal menyelesaikan service");
        }
    }

    openReconfirmModal(order: any) {
        this.selectedOrderForAction = order;
        this.reconfirmInput = {
            notes: "",
            replacedComponent: "",
            cost: order.actualCost || order.costEstimate || 0,
        };
        this.showReconfirmModal = true;
    }

    async handleSubmitReconfirm() {
        if (!this.selectedOrderForAction) return;
        if (!this.reconfirmInput.notes.trim()) {
            toast.error("Mohon isi catatan rekonfirmasi");
            return;
        }
        try {
            await ServiceService.patchService(this.selectedOrderForAction.id, {
                reconfirmation: {
                    notes: this.reconfirmInput.notes,
                    replacedComponent: this.reconfirmInput.replacedComponent,
                    newCost: this.reconfirmInput.cost,
                },
            });
            await this.updateOrderStatus(this.selectedOrderForAction.id, "re-konfirmasi", {
                notes: this.reconfirmInput.notes,
            });
            this.showReconfirmModal = false;
            this.selectedOrderForAction = null;
        } catch (e) {
            toast.error("Gagal mengirim rekonfirmasi");
        }
    }

    async handleDelete(id: number) {
        this.confirmDialogConfig = {
            title: "Hapus Permanen?",
            description: "Apakah anda yakin ingin menghapus data service ini? Data tidak dapat dikembalikan.",
            action: async () => {
                await api.delete(`/service/${id}`);
                this.serviceOrders = this.serviceOrders.filter((o) => o.id !== id);
                toast.success("Data service berhasil dihapus");
                this.loadData();
            },
            actionLabel: "Hapus Data",
            variant: "destructive",
        };
        this.showConfirmDialog = true;
    }

    handleReassignConfirm() {
        this.showReassignModal = false;
        this.selectedServiceForReassign = null;
        this.loadData();
    }
}
