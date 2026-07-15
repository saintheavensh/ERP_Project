import { api } from "$lib/shared/lib/api-client";
import { ServiceService } from "$lib/features/services/services/service.service";
import { toast } from "svelte-sonner";
import { goto } from "$app/navigation";
import { QC_ITEMS } from "@repo/shared";

export class ServiceFormStore {
    // Service Type
    isWalkin = $state(false);
    priority = $state<"standard" | "wait">("standard");
    isDirectComplete = $state(false);
    currentStep = $state(1);
    isSubmitting = $state(false);

    // Step 1: Customer Data
    customerName = $state("");
    customerPhone = $state("");
    customerAddress = $state("");

    // Step 2: Device Data
    phoneBrand = $state("");
    phoneModel = $state("");
    selectedDeviceId = $state<string | null>(null);
    phoneStatus = $state("nyala");
    // isDead is derived now
    isDead = $derived(this.phoneStatus === "mati_total");
    phoneColor = $state(""); // New Color Field
    deviceImage = $state<string | null>(null); // Persist Image
    deviceColors = $state<string[]>([]); // Persist Colors
    imei = $state("");
    pinPattern = $state("");
    physicalConditions = $state<string[]>([]);
    completeness = $state<string[]>([]);
    physicalNotes = $state("");

    // Pattern Lock
    isPatternOpen = $state(false);
    patternPoints = $state<number[]>([]);
    patternString = $derived(
        this.patternPoints.length > 0
            ? this.patternPoints.map((p) => p + 1).join("-")
            : ""
    );

    // Step 3: Service Details
    complaint = $state("");
    technician = $state("");
    estimatedCompletionDate = $state("");

    // Regular service specific
    initialDiagnosis = $state("");
    possibleCauses = $state("");
    isPriceRange = $state(false);
    estimatedCost = $state(0);
    minPrice = $state(0);
    maxPrice = $state(0);
    downPayment = $state(0);
    warranty = $state("1 Minggu"); // Default or "none"

    // Walk-in specific
    serviceFee = $state(0);
    serviceDescription = $state("");
    sparepartSource = $state("none");
    selectedParts = $state<any[]>([]);
    extPartName = $state("");
    extPartBuyPrice = $state(0);

    // Common
    photos = $state<string[]>([]);
    isUploading = $state(false);

    // QC Checklist Items
    // QC Checklist Items
    static QC_ITEMS = QC_ITEMS;

    // Initial QC (Step 2 for walk-in + nyala phones)
    initialQC = $state<Record<string, boolean>>({});

    // Final QC (after repair for walk-in)
    qcAfter = $state<Record<string, boolean>>({});
    qcNotes = $state("");

    // Payment (for walk-in)
    paymentMethod = $state<"cash" | "transfer" | "qris" | "mixed">("cash");
    paymentNotes = $state("");
    // warranty removed (duplicate)
    payments = $state<{ method: string; amount: number }[]>([{ method: "cash", amount: 0 }]);
    cashReceived = $state(0);
    selectedBank = $state<{ id: string; name: string; accountNumber: string; accountHolder: string } | null>(null);

    // Derived: Check if phone can do initial QC
    // Derived: Check if phone can do initial QC
    canDoInitialQC = $derived(this.phoneStatus === "nyala" && !this.isDead);

    // Derived: QC passed (all checked items in after must be true)
    qcPassed = $derived(
        Object.keys(this.qcAfter).length > 0 &&
        Object.values(this.qcAfter).every((v) => v === true)
    );

    // Computed
    step1Valid = $derived(
        this.customerName.trim() !== "" && (this.isWalkin || this.customerPhone.trim() !== "")
    );

    step2Valid = $derived(
        this.phoneBrand.trim() !== "" && this.phoneModel.trim() !== ""
    );

    totalPartPrice = $derived(
        this.sparepartSource === "customer"
            ? 0
            : this.selectedParts.reduce(
                (sum, p) => sum + (parseInt(p.sellPrice) || 0),
                0
            ) + (this.sparepartSource === "external" ? this.extPartBuyPrice || 0 : 0)
    );

    grandTotal = $derived((this.serviceFee || 0));
    walkinServiceFee = $derived(this.grandTotal - this.totalPartPrice);

    // Computed: Total paid from payments array (must be after grandTotal)
    totalPaid = $derived(
        this.payments.reduce((sum, p) => sum + (p.amount || 0), 0)
    );

    // Computed: Remaining amount
    remainingAmount = $derived(this.grandTotal - this.totalPaid);

    // Computed: Change amount
    changeAmount = $derived(
        this.cashReceived > 0 ? this.cashReceived - this.grandTotal : 0
    );

    // Payment valid check
    paymentValid = $derived(
        !this.isWalkin || this.totalPaid >= this.grandTotal
    );

    step3Valid = $derived(
        // QC Validation: If walkin, maybe require some checks? For now, allow empty or just warning.
        // If regular intake, it's optional.
        true
    );

    step4Valid = $derived(
        this.complaint.trim() !== "" &&
        (!this.isWalkin || (this.technician !== "" && !!this.serviceFee))
    );

    // Step 3.5 QC validation (for walk-in only - Step 5/Final Check?)
    // Actually we keep qcValid for internal check, but step3 is the wizard step.

    // Methods
    nextStep() {
        if (this.currentStep === 1 && !this.step1Valid) {
            toast.error(
                this.isWalkin
                    ? "Harap isi nama customer"
                    : "Harap isi nama dan nomor telepon customer"
            );
            return;
        }
        if (this.currentStep === 2 && !this.step2Valid) {
            toast.error("Harap isi brand dan model handphone");
            return;
        }

        // Step 3: QC
        // Logic to skip QC if device is dead or cannot do initial QC
        if (this.currentStep === 2 && !this.canDoInitialQC) {
            this.currentStep = 4; // Skip to Step 4 (Complaint)
            return;
        }

        if (this.currentStep === 3 && !this.step3Valid) {
            // QC validation specific logic if needed
            return;
        }

        // Step 4: Complaint
        if (this.currentStep === 4 && !this.step4Valid) {
            if (this.isWalkin) {
                if (this.technician === "") {
                    toast.error("Teknisi wajib dipilih untuk Walk-in Service");
                } else if (!this.serviceFee) {
                    toast.error("Total biaya wajib diisi untuk Walk-in Service");
                } else if (this.serviceFee < this.totalPartPrice) {
                    toast.error("Total biaya tidak boleh kurang dari harga sparepart");
                } else {
                    toast.error("Harap isi kerusakan");
                }
            } else {
                toast.error("Harap isi keluhan customer");
            }
            return;
        }

        // Proceed to next step (Review is Step 5)
        this.currentStep++;
    }

    prevStep() {
        this.currentStep--;
        // If we landed on QC (Step 3) and cannot do QC (e.g. Dead Unit), skip back to Step 2
        if (this.currentStep === 3 && !this.canDoInitialQC) {
            this.currentStep = 2;
        }
    }

    async handleFileUpload(e: Event) {
        const input = e.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        this.isUploading = true;
        const files = Array.from(input.files);

        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append("file", file);
                const res = await api.post("/uploads", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                const data = res.data;
                if (data.success && data.data.url) {
                    this.photos.push(data.data.url);
                }
            }
            toast.success("Foto berhasil diupload");
        } catch (error) {
            toast.error("Gagal upload foto");
        } finally {
            this.isUploading = false;
            input.value = "";
        }
    }

    removePhoto(index: number) {
        this.photos = this.photos.filter((_, i) => i !== index);
    }

    addInventoryPart(part: any) {
        const sellPrice = part.batches?.[0]?.sellPrice || 0;
        const buyPrice = part.batches?.[0]?.buyPrice || 0;
        this.selectedParts.push({ ...part, sellPrice, buyPrice, type: "inventory" });
        toast.success(`${part.name} ditambahkan`);
    }

    removePart(index: number) {
        this.selectedParts = this.selectedParts.filter((_, i) => i !== index);
    }

    handlePatternChange(points: number[]) {
        this.patternPoints = points;
        this.pinPattern = "Pola: " + this.patternString;
    }

    async handleSubmit() {
        if (!this.step4Valid) {
            toast.error("Harap lengkapi data keluhan"); // Should fail if step 4 is invalid
            return;
        }

        this.isSubmitting = true;
        try {
            const payload: any = {
                type: this.isWalkin ? "walk_in" : "regular",
                customer: {
                    name: this.customerName,
                    phone: this.customerPhone || undefined,
                    address: this.customerAddress || undefined,
                },
                unit: {
                    brand: this.phoneBrand,
                    model: this.phoneModel,
                    status: this.phoneStatus,
                    imei: this.imei || undefined,
                    color: this.phoneColor || undefined, // New Payload Field
                    pin: this.pinPattern || undefined,
                    condition: this.physicalConditions,
                    completeness: this.completeness,
                    physicalNotes: this.physicalNotes || undefined,
                },
                complaint: this.complaint,
                technicianId: this.technician || null,
                status: this.isWalkin ? "selesai" : "antrian",
                priority: this.priority,
                isDirectComplete: this.isDirectComplete,
                estimatedCompletionDate: this.estimatedCompletionDate
                    ? new Date(this.estimatedCompletionDate).toISOString()
                    : undefined,
            };

            if (!this.isWalkin) {
                payload.diagnosis = {
                    initial: this.initialDiagnosis || undefined,
                    possibleCauses: this.possibleCauses || undefined,
                    estimatedCost: this.isPriceRange
                        ? `${this.minPrice}-${this.maxPrice}`
                        : (this.estimatedCost ? String(this.estimatedCost) : undefined),
                    downPayment: this.downPayment ? String(this.downPayment) : undefined,
                };

                // Add Initial QC if phone was "nyala" (Now enabled for Regular too)
                if (this.canDoInitialQC && Object.keys(this.initialQC).length > 0) {
                    payload.initialQC = this.initialQC;
                    // Also save to 'qc' field as 'before' state for consistency
                    payload.qc = {
                        before: this.initialQC
                    };
                }

                // Ensure date is passed correctly (it's already YYYY-MM-DD from Step3)
                if (this.estimatedCompletionDate) {
                    payload.estimatedCompletionDate = this.estimatedCompletionDate;
                }
            }

            if (this.isWalkin) {
                payload.serviceFee = this.walkinServiceFee;
                payload.serviceDescription = this.serviceDescription || undefined;
                payload.actualCost = this.serviceFee;
                if (this.selectedParts.length > 0) {
                    payload.parts = this.selectedParts.map((p) => ({
                        productId: p.id,
                        qty: 1,
                        price: parseInt(p.price),
                        buyPrice: p.buyPrice || 0,
                    }));
                }

                // Add Initial QC if phone was "nyala"
                if (this.canDoInitialQC && Object.keys(this.initialQC).length > 0) {
                    payload.initialQC = this.initialQC;
                }

                // Add Final QC
                if (Object.keys(this.qcAfter).length > 0) {
                    payload.qc = {
                        passed: this.qcPassed,
                        before: this.canDoInitialQC ? this.initialQC : undefined,
                        after: this.qcAfter,
                        notes: this.qcNotes || undefined,
                    };
                }

                payload.payments = this.payments;
                payload.paymentMethod = this.paymentMethod;
                payload.paymentNotes = this.paymentNotes || undefined;

                // Enforce warranty logic
                if (this.sparepartSource === 'customer') {
                    payload.warranty = "none";
                } else {
                    payload.warranty = this.warranty !== "none" ? this.warranty : undefined;
                }

                // Add bank details for transfer/mixed payments
                if ((this.paymentMethod === "transfer" || this.paymentMethod === "mixed") && this.selectedBank) {
                    payload.transferDetails = {
                        bankName: this.selectedBank.name,
                        accountNumber: this.selectedBank.accountNumber,
                        accountHolder: this.selectedBank.accountHolder,
                    };
                }
            }

            const newService = await ServiceService.create(payload);
            toast.success(
                this.isWalkin
                    ? "Service Walk-in Selesai!"
                    : "Service order berhasil dibuat!"
            );

            // Return success to allow handling navigation in the UI (for Print/Loop)
            return { success: true, serviceId: newService.id, serviceNo: newService.no }; // Added serviceNo
        } catch (e: any) {
            toast.error(
                "Gagal membuat service: " +
                (e.response?.data?.message || e.message)
            );
            return { success: false };
        } finally {
            this.isSubmitting = false;
        }
    }

    resetForNextUnit() {
        // Keep Step 1 (Customer)

        // Reset Step 2 (Device)
        this.phoneBrand = "";
        this.phoneModel = "";
        this.selectedDeviceId = null;
        this.deviceImage = null;
        this.deviceColors = [];
        this.phoneStatus = "nyala";
        // this.isDead is derived, auto updates
        this.phoneColor = "";
        this.imei = "";
        this.pinPattern = "";
        this.physicalConditions = [];
        this.completeness = [];
        this.physicalNotes = "";
        this.isPatternOpen = false;
        this.patternPoints = [];

        // Reset Step 3 (QC)
        this.initialQC = {};

        // Reset Step 4 (Service/Complaint)
        this.complaint = "";
        this.initialDiagnosis = "";
        this.possibleCauses = "";
        this.estimatedCost = 0;
        this.minPrice = 0;
        this.maxPrice = 0;
        this.downPayment = 0;
        this.technician = "";

        // Reset Photos
        this.photos = [];

        // Go back to Step 2
        this.currentStep = 2;

        // Indicate we are in "Multi-Unit Mode" if needed, or just standard reset
        toast.info("Silakan isi data untuk unit berikutnya");
    }
}

// Create a singleton instance or context-based? Singleton is fine for page-level state here if we reset it
// But better to instantiate in page and pass via Context
