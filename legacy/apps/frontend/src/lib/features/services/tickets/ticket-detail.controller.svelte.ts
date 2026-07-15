import { goto } from "$app/navigation";
import { ServiceService } from "$lib/features/services/services/service.service";
import { refreshServiceList } from "$lib/features/services/services/event-store.svelte";
import { SettingsService, type WhatsAppSettings } from "$lib/features/settings/settings.service";
import { api } from "$lib/shared/lib/api-client";
import { toast } from "svelte-sonner";
import {
    Clock,
    Search,
    AlertCircle,
    Wrench,
    CheckCircle,
    Smartphone,
    RefreshCw,
    XCircle,
} from "lucide-svelte";

export class TicketDetailController {
    // Core Data
    serviceId: number;
    serviceOrder = $state<any>(null);
    loading = $state(true);
    currentUser = $state<any>(null);
    serviceSettings = $state<any>(null);
    whatsappSettings = $state<WhatsAppSettings>({
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
    technicians = $state<{ id: string; name: string }[]>([]);

    // Modal States
    showDiagnosisModal = $state(false);
    showCompletionModal = $state(false);
    showAssignModal = $state(false);
    showPartsModal = $state(false);
    showReconfirmModal = $state(false);
    showCancelModal = $state(false);
    showCompleteConfirm = $state(false);
    showDeleteConfirm = $state(false);
    showStartWorkConfirm = $state(false);
    showLiquidateConfirm = $state(false);
    showPickupWizard = $state(false);
    showPrintPreview = $state(false);

    // Form Inputs
    selectedTechnicianId = $state("");
    diagnosisInput = $state({
        initial: "",
        possibleCauses: "",
        costEstimate: 0,
        estimatedCompletion: "",
    });
    completionInput = $state({
        actualCost: 0,
        notes: "",
    });
    newPart = $state({
        name: "",
        source: "stok",
        qty: 1,
        price: 0,
    });
    reconfirmInput = $state({
        notes: "",
        replacedComponent: "",
        cost: 0,
    });
    cancelReason = $state("");
    liquidationType = $state<"resell" | "cannibalize">("resell");
    printMode = $state<"receipt" | "sticker">("receipt");
    isProcessingAction = $state(false);

    constructor(serviceId: number) {
        this.serviceId = serviceId;
        this.loadUser();
    }

    loadUser() {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                this.currentUser = JSON.parse(userStr);
            } catch { }
        }
    }

    async init() {
        await Promise.all([
            this.loadData(),
            this.loadTechnicians(),
            this.loadSettings(),
        ]);
    }

    async loadData() {
        this.loading = true;
        try {
            this.serviceOrder = await ServiceService.getById(this.serviceId);
            if (this.serviceOrder.device) this.serviceOrder.phone = this.serviceOrder.device;
            if (!this.serviceOrder.parts) this.serviceOrder.parts = [];
            if (!this.serviceOrder.timeline) this.serviceOrder.timeline = [];

            // Pre-fill inputs
            this.prefillInputs();
        } catch (e) {
            console.error(e);
            toast.error("Gagal memuat detail service");
        } finally {
            this.loading = false;
        }
    }

    prefillInputs() {
        if (!this.serviceOrder) return;

        if (this.serviceOrder.diagnosis) {
            try {
                const d = JSON.parse(this.serviceOrder.diagnosis);
                if (d.initial) this.diagnosisInput.initial = d.initial;
                if (d.possibleCauses) this.diagnosisInput.possibleCauses = d.possibleCauses;
                if (d.costEstimate) this.diagnosisInput.costEstimate = d.costEstimate;
            } catch { }
        }
        if (this.serviceOrder.costEstimate)
            this.diagnosisInput.costEstimate = this.serviceOrder.costEstimate;

        if (this.serviceOrder.estimatedCompletionDate) {
            try {
                const date = new Date(this.serviceOrder.estimatedCompletionDate);
                this.diagnosisInput.estimatedCompletion = date.toISOString().slice(0, 16);
            } catch { }
        }

        if (this.serviceOrder.actualCost)
            this.completionInput.actualCost = this.serviceOrder.actualCost;

        if (this.serviceOrder.costEstimate && !this.serviceOrder.actualCost)
            this.completionInput.actualCost = this.serviceOrder.costEstimate;
    }

    async loadSettings() {
        try {
            const [svcSettings, waSettings] = await Promise.all([
                SettingsService.getServiceSettings(),
                SettingsService.getWhatsAppSettings()
            ]);
            this.serviceSettings = svcSettings;
            this.whatsappSettings = waSettings;
        } catch (e) {
            console.error("Failed to load settings", e);
        }
    }

    async loadTechnicians() {
        try {
            this.technicians = await ServiceService.getTechnicians();
        } catch (e) {
            console.error("Failed to load technicians", e);
        }
    }

    // Role Checks
    isAdmin = $derived(this.currentUser?.role === "admin");
    isKasir = $derived(this.currentUser?.role === "kasir");
    isTeknisi = $derived(this.currentUser?.role === "teknisi");

    canViewFinancials = $derived(this.isAdmin || this.isKasir);
    canViewContact = $derived(this.isAdmin || this.isKasir);
    canEditWorkflow = $derived(this.isAdmin || this.isTeknisi);
    canAssignTechnician = $derived(this.isAdmin);
    canProcessPayment = $derived(this.isAdmin || this.isKasir);

    // Derived Financials
    totalParts = $derived(
        this.serviceOrder?.items?.reduce(
            (itemSum: number, item: any) =>
                itemSum + (item.parts?.reduce((partSum: number, p: any) => partSum + (p.sellingPrice * p.quantity), 0) || 0),
            0
        ) || this.serviceOrder?.parts?.reduce(
            (sum: number, p: any) => sum + (p.subtotal || p.price * p.qty),
            0,
        ) || 0,
    );

    grandTotal = $derived(
        this.serviceOrder?.items?.reduce(
            (sum: number, item: any) => sum + (item.actualCost || item.estimatedCost || 0),
            0
        ) || this.serviceOrder?.actualCost || this.serviceOrder?.costEstimate || 0,
    );

    derivedServiceFee = $derived(Math.max(0, this.grandTotal - this.totalParts));

    // Status & Workflow
    STATUS_CONFIG: Record<string, any> = {
        antrian: {
            color: "text-slate-700",
            bg: "bg-slate-100",
            gradient: "from-slate-500/10 to-slate-500/5",
            shadow: "shadow-slate-200",
            label: "Antrian",
            icon: Clock,
        },
        dicek: {
            color: "text-blue-700",
            bg: "bg-blue-100",
            gradient: "from-blue-500/10 to-blue-500/5",
            shadow: "shadow-blue-200",
            label: "Sedang Dicek",
            icon: Search,
        },
        konfirmasi: {
            color: "text-amber-700",
            bg: "bg-amber-100",
            gradient: "from-amber-500/10 to-amber-500/5",
            shadow: "shadow-amber-200",
            label: "Konfirmasi",
            icon: AlertCircle,
        },
        dikerjakan: {
            color: "text-purple-700",
            bg: "bg-purple-100",
            gradient: "from-purple-500/10 to-purple-500/5",
            shadow: "shadow-purple-200",
            label: "Dikerjakan",
            icon: Wrench,
        },
        selesai: {
            color: "text-green-700",
            bg: "bg-green-100",
            gradient: "from-green-500/10 to-green-500/5",
            shadow: "shadow-green-200",
            label: "Selesai",
            icon: CheckCircle,
        },
        diambil: {
            color: "text-teal-700",
            bg: "bg-teal-100",
            gradient: "from-teal-500/10 to-teal-500/5",
            shadow: "shadow-teal-200",
            label: "Sudah Diambil",
            icon: Smartphone,
        },
        "re-konfirmasi": {
            color: "text-orange-700",
            bg: "bg-orange-100",
            gradient: "from-orange-500/10 to-orange-500/5",
            shadow: "shadow-orange-200",
            label: "Re-konfirmasi",
            icon: RefreshCw,
        },
        batal: {
            color: "text-red-700",
            bg: "bg-red-100",
            gradient: "from-red-500/10 to-red-500/5",
            shadow: "shadow-red-200",
            label: "Dibatalkan",
            icon: XCircle,
        },
    };

    STATUS_ORDER = [
        "antrian",
        "dicek",
        "konfirmasi",
        "dikerjakan",
        "re-konfirmasi",
        "selesai",
        "diambil",
    ];

    statusConfig = $derived(
        this.STATUS_CONFIG[this.serviceOrder?.status] || this.STATUS_CONFIG.antrian,
    );

    statusIndex = $derived(this.STATUS_ORDER.indexOf(this.serviceOrder?.status || "antrian"));
    progress = $derived(((this.statusIndex >= 0 ? this.statusIndex : 0) + 1) / this.STATUS_ORDER.length * 100);

    isReadOnly = $derived(
        this.serviceOrder?.status === "selesai" ||
        this.serviceOrder?.status === "batal" ||
        this.serviceOrder?.status === "diambil",
    );

    isArchived = $derived.by(() => {
        if (!this.serviceOrder || !this.serviceSettings?.enableVirtualArchive)
            return false;
        const ARCHIVE_STATUSES = ["selesai", "diambil", "batal"];
        if (!ARCHIVE_STATUSES.includes(this.serviceOrder.status)) return false;

        const exclusions = this.serviceSettings.archiveExclusions || [];
        if (exclusions.includes(this.serviceOrder.status)) return false;

        const date = this.serviceOrder.updatedAt
            ? new Date(this.serviceOrder.updatedAt)
            : new Date(this.serviceOrder.dateIn);
        const diffTime = Math.abs(new Date().getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays > (this.serviceSettings.autoCloseAfterDays || 60);
    });

    canLiquidate = $derived(
        this.serviceSettings?.enableLiquidation &&
        this.isArchived &&
        this.isAdmin,
    );

    // WhatsApp Helper
    async sendWhatsApp(message: string, force: boolean = false) {
        if ((!this.whatsappSettings.enabled && !force) || !this.serviceOrder?.customer?.phone) return;

        const phone = this.serviceOrder.customer.phone.replace(/[^0-9]/g, "");
        const formattedPhone = phone.startsWith("0") ? "62" + phone.slice(1) : phone;

        // Parse Variables
        const variables: Record<string, string> = {
            "{customer}": this.serviceOrder.customer.name || "Customer",
            "{serviceNo}": this.serviceOrder.no,
            "{device}": `${this.serviceOrder.phone?.brand || ""} ${this.serviceOrder.phone?.model || ""}`.trim(),
            "{status}": this.statusConfig.label,
            "{total}": new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(this.grandTotal),
        };

        let finalMessage = message;
        Object.entries(variables).forEach(([key, value]) => {
            finalMessage = finalMessage.replace(new RegExp(key, "g"), value);
        });

        // Mode Check
        if (this.whatsappSettings.mode === 'server') {
            // Server-Side Mode
            const toastId = toast.loading("Mengirim pesan WhatsApp...");
            try {
                await api.post("/whatsapp/send", {
                    to: formattedPhone,
                    message: finalMessage
                });
                toast.success("Pesan WhatsApp terkirim!", { id: toastId });
            } catch (e) {
                console.error("WhatsApp Send Error:", e);
                toast.error("Gagal mengirim pesan WhatsApp", { id: toastId });
                // Fallback to client side if server fails? Maybe ask user?
                // For now, let's just error out to respect the "Server Only" choice.
            }
        } else {
            // Client-Side Mode (Default)
            const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(finalMessage)}`;
            window.open(url, "_blank");
        }
    }

    // Actions
    async updateStatus(newStatus: string, extraData: any = {}) {
        try {
            const userId = this.currentUser?.id || "USR-ADMIN";
            await ServiceService.updateStatus(this.serviceId, {
                status: newStatus,
                userId,
                ...extraData,
            });
            toast.success(`Status updated: ${newStatus}`);
            refreshServiceList.update((n) => n + 1);
            await this.loadData();

            // Auto Send WhatsApp logic
            if (this.whatsappSettings.enabled && this.whatsappSettings.autoSendOnStatusChange && this.whatsappSettings.statusUpdateTemplate) {
                // Re-trigger visual status update to ensure label is correct before sending
                // Actually this.serviceOrder is updated by loadData(), so statusConfig should be correct.
                // However, we need to ensure the message uses the NEW status label.
                // The loadData() calls above should have updated serviceOrder.status.
                setTimeout(() => {
                    this.sendWhatsApp(this.whatsappSettings.statusUpdateTemplate);
                }, 500);
            }

        } catch (e) {
            console.error(e);
            toast.error("Gagal update status");
        }
    }

    async handleAssignTechnician() {
        if (!this.selectedTechnicianId) return;
        try {
            await ServiceService.assignTechnician(
                this.serviceId,
                this.selectedTechnicianId,
            );
            toast.success("Teknisi berhasil ditugaskan");
            this.showAssignModal = false;
            await this.loadData();
        } catch (e) {
            toast.error("Gagal menugaskan teknisi");
        }
    }

    async handleSelfAssign() {
        if (!this.currentUser?.id) return;
        try {
            await ServiceService.assignTechnician(this.serviceId, this.currentUser.id);
            toast.success("Anda berhasil mengambil job ini");
            await this.loadData();
        } catch (e) {
            toast.error("Gagal mengambil job");
        }
    }

    async submitDiagnosis() {
        if (!this.diagnosisInput.initial || !this.diagnosisInput.possibleCauses) {
            toast.error("Mohon isi diagnosa awal dan kemungkinan kerusakan");
            return;
        }
        if (this.diagnosisInput.costEstimate <= 0) {
            toast.error("Estimasi biaya tidak boleh 0");
            return;
        }
        try {
            const payload = {
                diagnosis: {
                    initial: this.diagnosisInput.initial,
                    possibleCauses: this.diagnosisInput.possibleCauses,
                },
                costEstimate: this.diagnosisInput.costEstimate,
                estimatedCompletionDate: this.diagnosisInput.estimatedCompletion
                    ? new Date(this.diagnosisInput.estimatedCompletion)
                    : undefined,
            };

            await ServiceService.patchService(this.serviceId, payload);
            await this.updateStatus("konfirmasi");
            this.showDiagnosisModal = false;
        } catch (e) {
            toast.error("Gagal menyimpan diagnosa");
        }
    }

    async submitCompletion() {
        await this.updateStatus("selesai", {
            actualCost: parseInt(String(this.completionInput.actualCost)),
            notes: this.completionInput.notes,
        });
        this.showCompletionModal = false;
    }

    async submitReconfirm() {
        const cost = parseInt(String(this.reconfirmInput.cost));
        if (isNaN(cost)) {
            toast.error("Format harga salah");
            return;
        }
        if (cost <= 0) {
            toast.error("Biaya re-konfirmasi tidak boleh 0");
            return;
        }

        try {
            const finalNotes = this.reconfirmInput.replacedComponent
                ? `${this.reconfirmInput.notes}\n\nSparepart Perlu Diganti: ${this.reconfirmInput.replacedComponent}`
                : this.reconfirmInput.notes;

            const initialEstimate = this.serviceOrder.costEstimate || 0;
            if (cost <= initialEstimate) {
                await this.updateStatus("dikerjakan", {
                    notes: finalNotes,
                    actualCost: cost,
                });
                toast.success("Biaya tidak naik, status langsung lanjut dikerjakan");
            } else {
                await this.updateStatus("re-konfirmasi", {
                    notes: finalNotes,
                    actualCost: cost,
                });
                toast.success("Re-konfirmasi terkirim ke customer");
            }
            this.showReconfirmModal = false;
        } catch (e) {
            toast.error("Gagal mengirim re-konfirmasi");
        }
    }

    async addPart() {
        if (!this.newPart.name || this.newPart.qty <= 0) {
            toast.error("Nama dan qty harus diisi");
            return;
        }
        try {
            const part = {
                name: this.newPart.name,
                source: this.newPart.source,
                qty: this.newPart.qty,
                price: this.newPart.price,
                subtotal: this.newPart.qty * this.newPart.price,
            };
            const updatedParts = [...(this.serviceOrder.parts || []), part];
            await api.patch(`/service/${this.serviceId}`, { parts: updatedParts });
            toast.success("Part ditambahkan");
            this.newPart = { name: "", source: "stok", qty: 1, price: 0 };
            this.showPartsModal = false;
            await this.loadData();
        } catch (e) {
            toast.error("Gagal menambah part");
        }
    }

    async processComplete() {
        this.isProcessingAction = true;
        try {
            const userId = this.currentUser?.id || "USR-ADMIN";
            await ServiceService.updateStatus(this.serviceId, {
                status: "selesai",
                userId,
            });
            toast.success("Service selesai!");
            refreshServiceList.update((n) => n + 1);
            await this.loadData();

            // Auto Send WhatsApp logic for Complete
            if (this.whatsappSettings.enabled && this.whatsappSettings.autoSendOnComplete && this.whatsappSettings.readyForPickupTemplate) {
                setTimeout(() => {
                    this.sendWhatsApp(this.whatsappSettings.readyForPickupTemplate);
                }, 500);
            }

        } catch (e) {
            toast.error("Gagal update status");
        } finally {
            this.isProcessingAction = false;
            this.showCompleteConfirm = false;
        }
    }

    async handleCancel() {
        if (!this.cancelReason.trim()) {
            toast.error("Mohon isi alasan pembatalan");
            return;
        }
        try {
            const userId = this.currentUser?.id || "USR-ADMIN";
            await ServiceService.updateStatus(this.serviceId, {
                status: "batal",
                userId,
                notes: this.cancelReason,
            });
            toast.success("Service dibatalkan");
            this.showCancelModal = false;
            refreshServiceList.update((n) => n + 1);
            this.loadData();
        } catch (e) {
            toast.error("Gagal membatalkan");
        }
    }

    handleChatCustomer() {
        if (!this.serviceOrder) return;

        let message = "";
        // Use New Service Template if available and status is Antrian/Dicek, otherwise use generic or just open chat
        if (this.whatsappSettings.enabled && this.whatsappSettings.newServiceTemplate && ["antrian", "dicek"].includes(this.serviceOrder.status)) {
            message = this.whatsappSettings.newServiceTemplate;
            this.sendWhatsApp(message, true);
        } else {
            // Fallback to manual constructing if no template or not enabled, 
            // but strictly use sendWhatsApp to keep logic in one place.
            // If enabled but no specific template, maybe we just want to open chat?
            // The legacy code had a hardcoded string. Let's keep a generic fallback.
            const brand = this.serviceOrder.phone?.brand || "HP";
            const model = this.serviceOrder.phone?.model || "";
            message = `Halo Kak ${this.serviceOrder.customer?.name || "Customer"}, mengenai service ${brand} ${model} (No: ${this.serviceOrder.no})...`;
            this.sendWhatsApp(message, true);
        }
    }

    handlePrint(mode: "receipt" | "sticker" = "receipt") {
        this.printMode = mode;
        this.showPrintPreview = true;
    }

    async processDelete() {
        this.isProcessingAction = true;
        try {
            await api.delete(`/service/${this.serviceId}`);
            toast.success("Service dihapus");
            refreshServiceList.update((n) => n + 1);
            goto("/service");
        } catch (e) {
            toast.error("Gagal hapus");
        } finally {
            this.isProcessingAction = false;
            this.showDeleteConfirm = false;
        }
    }

    async processStartWork() {
        this.isProcessingAction = true;
        try {
            await this.updateStatus("dikerjakan");
        } catch (e) {
            toast.error("Gagal memulai pengerjaan");
        } finally {
            this.isProcessingAction = false;
            this.showStartWorkConfirm = false;
        }
    }

    async processLiquidation() {
        this.isProcessingAction = true;
        try {
            const userId = this.currentUser?.id || "USR-ADMIN";

            let note = "";
            let newStatus = "diambil";

            if (this.liquidationType === "resell") {
                note = `[LIQUIDATION] Unit dijual kembali (Resell). Diproses oleh ${this.currentUser?.name || "Admin"}.`;
            } else {
                note = `[LIQUIDATION] Unit dikanibalisasi untuk sparepart. Diproses oleh ${this.currentUser?.name || "Admin"}.`;
            }

            const currentNotes = this.serviceOrder.notes || "";
            const finalNotes = currentNotes ? `${currentNotes}\n\n${note}` : note;

            await ServiceService.updateStatus(this.serviceId, {
                status: newStatus as any,
                userId,
                notes: finalNotes,
            });

            toast.success(
                `Unit berhasil dilikuidasi: ${this.liquidationType === "resell" ? "Jual Unit" : "Kanibalisasi"}`,
            );
            this.loadData();
        } catch (e) {
            toast.error("Gagal memproses likuidasi");
        } finally {
            this.isProcessingAction = false;
            this.showLiquidateConfirm = false;
        }
    }
}
