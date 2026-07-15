<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
    } from "$lib/shared/components/ui/dialog";
    import { Label } from "$lib/shared/components/ui/label";
    import { Input } from "$lib/shared/components/ui/input";
    import { Separator } from "$lib/shared/components/ui/separator";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/shared/components/ui/select";
    import { Badge } from "$lib/shared/components/ui/badge";
    import CurrencyInput from "$lib/shared/components/custom/currency-input.svelte";
    import { toast } from "svelte-sonner";
    import {
        Camera,
        CheckCircle,
        CreditCard,
        Package,
        Upload,
        ChevronLeft,
        ChevronRight,
        Plus,
        X,
        Printer,
    } from "lucide-svelte";
    import { ServiceService } from "$lib/features/services/services/service.service";
    import {
        PaymentService,
        type PaymentMethod,
    } from "$lib/features/finance/shared/payment.service";
    import { formatCurrency } from "$lib/shared/lib/utils";
    import { onMount } from "svelte";
    import { SettingsService } from "$lib/features/settings/settings.service";

    interface Props {
        open: boolean;
        serviceId: number;
        serviceNo: string;
        customer?: { name: string; phone: string } | null;
        device?: { brand: string; model: string; imei?: string };
        cost: number;
        serviceStatus: string;
        onComplete: () => void;
        onClose: () => void;
    }

    let {
        open = $bindable(false),
        serviceId,
        serviceNo,
        customer,
        device,
        cost,
        serviceStatus,
        requireProof = true, // New Prop
        warranty: initialWarranty, // New Prop for pre-selected warranty
        onComplete,
        onClose,
    }: Props & { requireProof?: boolean; warranty?: string } = $props();

    type PaymentItem = {
        methodId: string;
        variantId?: string; // For bank selection
        amount: number;
        reference?: string;
    };

    // Wizard State
    let currentStep = $state(1);
    const TOTAL_STEPS = 2; // Step 1: Verification, Step 2: Payment
    let isSubmitting = $state(false);

    // Verification Data
    let receiptOption = $state<"receipt" | "no_receipt">("receipt");
    let receiptPhoto = $state("");
    let idPhoto = $state("");
    let idName = $state("");

    // Payment Data
    let availableMethods = $state<PaymentMethod[]>([]);
    let payments = $state<PaymentItem[]>([]); // Initialized in effect

    // Load payment methods
    onMount(async () => {
        try {
            availableMethods = await PaymentService.getEnabledMethods();
        } catch (e) {
            console.error("Failed to load payment methods", e);
            toast.error("Gagal memuat metode pembayaran");
        }
    });

    // Warranty State
    let warranty = $state("");
    let warrantyOptions = $state<string[]>([]);

    onMount(async () => {
        try {
            const settings = await SettingsService.getServiceSettings();
            if (
                settings.warrantyPresets &&
                settings.warrantyPresets.length > 0
            ) {
                warrantyOptions = settings.warrantyPresets.map((p) => p.label);
                // Default to settings default warranty days if not set
                if (!warranty) {
                    if (initialWarranty && initialWarranty !== "none") {
                        warranty = initialWarranty;
                    } else {
                        const defaultPreset = settings.warrantyPresets.find(
                            (p) => p.days === settings.defaultWarrantyDays,
                        );
                        if (defaultPreset) {
                            warranty = defaultPreset.label;
                        } else {
                            warranty = warrantyOptions[0];
                        }
                    }
                }
            } else {
                // Fallback defaults
                warrantyOptions = [
                    "Tanpa Garansi",
                    "1 Minggu",
                    "1 Bulan",
                    "3 Bulan",
                ];
                warranty = "1 Minggu";
            }
        } catch (e) {
            console.error("Failed to load service settings", e);
            // Fail safe
            warrantyOptions = ["Tanpa Garansi", "1 Minggu", "1 Bulan"];
            warranty = "1 Minggu";
        }
    });

    // Initialize payment amount when opening
    $effect(() => {
        if (open) {
            currentStep = 1;
            // Default to first method (usually Cash)
            const defaultMethod =
                availableMethods.find((m) => m.type === "cash") ||
                availableMethods[0];
            const defaultId = defaultMethod ? defaultMethod.id : "";

            payments = [{ methodId: defaultId, amount: cost }];
            receiptOption = "receipt";
            receiptPhoto = "";
            idPhoto = "";
            idName = "";
        }
    });

    // Derived Logic
    let totalPaid = $derived(
        payments.reduce((sum, p) => sum + (p.amount || 0), 0),
    );
    let change = $derived(totalPaid - cost);
    let remaining = $derived(cost - totalPaid);

    function nextStep() {
        if (currentStep === 1) {
            // Validate Step 1
            if (requireProof) {
                if (receiptOption === "receipt" && !receiptPhoto) {
                    toast.error("Mohon upload foto nota/kwitansi");
                    return;
                }
                if (receiptOption === "no_receipt") {
                    if (!idName.trim()) {
                        toast.error("Mohon isi nama sesuai KTP");
                        return;
                    }
                    if (!idPhoto) {
                        toast.error("Mohon upload foto KTP");
                        return;
                    }
                    // Validate Name Match
                    const customerName = (customer?.name || "").toLowerCase();
                    const inputName = idName.toLowerCase();
                    if (
                        !inputName.includes(customerName) &&
                        !customerName.includes(inputName) &&
                        !inputName.includes(customerName.split(" ")[0])
                    ) {
                        if (
                            !confirm(
                                "Nama di KTP berbeda dengan nama customer. Lanjutkan?",
                            )
                        ) {
                            return;
                        }
                    }
                }
            }
            currentStep++;
        }
    }

    function prevStep() {
        if (currentStep > 1) {
            currentStep--;
        }
    }

    function addPaymentRow() {
        const defaultMethod =
            availableMethods.find((m) => m.type === "cash") ||
            availableMethods[0];
        payments = [
            ...payments,
            { methodId: defaultMethod?.id || "", amount: 0 },
        ];
    }

    function removePaymentRow(index: number) {
        if (payments.length > 1) {
            payments = payments.filter((_, i) => i !== index);
        }
    }

    function handleMethodChange(index: number, newMethodId: string) {
        // Update method
        payments[index].methodId = newMethodId;
        // Reset variant
        payments[index].variantId = undefined;
    }

    function handleVariantChange(index: number, newVariantId: string) {
        payments[index].variantId = newVariantId;
    }

    function getSelectedMethod(methodId: string) {
        return availableMethods.find((m) => m.id === methodId);
    }

    async function handleSubmit() {
        if (remaining > 0) {
            toast.error(`Pembayaran kurang ${formatCurrency(remaining)}`);
            return;
        }

        // Validate banks for transfer methods
        for (const p of payments) {
            const method = getSelectedMethod(p.methodId);
            if (method?.type === "transfer" && !p.variantId) {
                toast.error("Mohon pilih Bank untuk metode Transfer");
                return;
            }
        }

        isSubmitting = true;
        try {
            // Map IDs to Names for storage (snapshot)
            // Or prefer storing IDs if backend supports linking.
            // Current schema `sale_payments` stores methodId AND method name.
            // `services` table stores `payment` as JSON. Ideally we store structure similar to sale_payments.

            const mappedPayments = payments.map((p) => {
                const method = getSelectedMethod(p.methodId);
                const variant = method?.variants?.find(
                    (v) => v.id === p.variantId,
                );
                return {
                    methodId: p.methodId,
                    method: method?.name,
                    variantId: p.variantId,
                    variant: variant?.name,
                    amount: p.amount,
                };
            });

            const paymentData = {
                payments: mappedPayments,
                totalPaid,
                change,
                receiptOption,
                receiptPhoto,
                idPhoto,
                idName,
                warranty: serviceStatus !== "batal" ? warranty : undefined,
            };

            await ServiceService.patchService(serviceId, {
                payment: paymentData,
            });

            // Status update
            // Construct note from payments
            const paymentNote = mappedPayments
                .map(
                    (p) =>
                        `${p.method}${p.variant ? ` (${p.variant})` : ""}: ${formatCurrency(p.amount)}`,
                )
                .join(", ");

            await ServiceService.updateStatus(serviceId, {
                status: "diambil",
                userId:
                    JSON.parse(localStorage.getItem("user") || "{}").id ||
                    "USR-000",
                notes: `Pembayaran: ${paymentNote}`,
                actualCost: totalPaid,
            });

            toast.success("Service berhasil diambil!");
            onComplete();
            open = false;
        } catch (e) {
            console.error(e);
            toast.error("Gagal memproses pengambilan");
        } finally {
            isSubmitting = false;
        }
    }

    function handlePhotoUpload(event: Event, target: "receipt" | "id") {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("File harus berupa gambar");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target?.result as string;
            if (target === "receipt") {
                receiptPhoto = base64;
            } else {
                idPhoto = base64;
            }
        };
        reader.readAsDataURL(file);
    }
</script>

<Dialog bind:open>
    <DialogContent
        class="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col p-0 border-0 shadow-2xl rounded-3xl"
    >
        <DialogHeader
            class="px-8 py-6 border-b bg-gradient-to-r from-background to-muted/30"
        >
            <DialogTitle class="text-2xl font-bold tracking-tight text-primary"
                >Pengambilan Unit</DialogTitle
            >
            <DialogDescription class="text-base text-muted-foreground/80">
                Tiket <span
                    class="font-mono font-medium text-foreground bg-muted px-2 py-0.5 rounded-md"
                    >#{serviceNo}</span
                >
                • {customer?.name}
            </DialogDescription>
        </DialogHeader>

        <div class="flex-1 overflow-y-auto p-8 bg-muted/10">
            {#if currentStep === 1}
                <!-- Step 1: Verification -->
                <div
                    class="space-y-8 animate-in slide-in-from-right-4 duration-300"
                >
                    <!-- Device Info Card -->
                    <div
                        class="bg-card p-5 rounded-2xl border shadow-sm space-y-4"
                    >
                        <div class="flex items-center gap-3 mb-2">
                            <div
                                class="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl"
                            >
                                <Package class="h-5 w-5" />
                            </div>
                            <h4 class="font-bold text-lg">Detail Perangkat</h4>
                        </div>

                        <div class="grid grid-cols-2 gap-6 text-sm">
                            <div>
                                <span
                                    class="text-xs text-muted-foreground font-semibold uppercase tracking-wider"
                                    >Model Device</span
                                >
                                <p class="font-medium text-base mt-0.5">
                                    {device?.brand}
                                    {device?.model}
                                </p>
                            </div>
                            <div>
                                <span
                                    class="text-xs text-muted-foreground font-semibold uppercase tracking-wider"
                                    >IMEI / S/N</span
                                >
                                <p
                                    class="font-mono font-medium text-base mt-0.5"
                                >
                                    {device?.imei || "-"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {#if requireProof}
                        <div class="space-y-5">
                            <div class="flex items-center gap-3">
                                <div
                                    class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm ring-4 ring-primary/5"
                                >
                                    1
                                </div>
                                <Label class="text-lg font-bold"
                                    >Verifikasi Pengambil</Label
                                >
                            </div>

                            <!-- Option Selector -->
                            <div class="grid grid-cols-2 gap-4">
                                <label
                                    class={`relative overflow-hidden flex flex-col items-center justify-center p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 gap-3 group
                                ${
                                    receiptOption === "receipt"
                                        ? "bg-primary/5 border-primary text-primary shadow-md shadow-primary/10"
                                        : "bg-card border-muted hover:border-primary/30 hover:bg-muted/50"
                                }`}
                                >
                                    <input
                                        type="radio"
                                        bind:group={receiptOption}
                                        value="receipt"
                                        class="sr-only"
                                    />
                                    <div
                                        class={`p-3 rounded-full transition-colors ${receiptOption === "receipt" ? "bg-primary text-white" : "bg-muted group-hover:bg-white"}`}
                                    >
                                        <Printer class="h-6 w-6" />
                                    </div>
                                    <span class="font-bold"
                                        >Bawa Nota Service</span
                                    >
                                    {#if receiptOption === "receipt"}
                                        <div
                                            class="absolute inset-0 bg-primary/5 z-[-1]"
                                        ></div>
                                    {/if}
                                </label>

                                <label
                                    class={`relative overflow-hidden flex flex-col items-center justify-center p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 gap-3 group
                                ${
                                    receiptOption === "no_receipt"
                                        ? "bg-amber-50 border-amber-500 text-amber-700 shadow-md shadow-amber-500/10"
                                        : "bg-card border-muted hover:border-amber-500/30 hover:bg-muted/50"
                                }`}
                                >
                                    <input
                                        type="radio"
                                        bind:group={receiptOption}
                                        value="no_receipt"
                                        class="sr-only"
                                    />
                                    <div
                                        class={`p-3 rounded-full transition-colors ${receiptOption === "no_receipt" ? "bg-amber-500 text-white" : "bg-muted group-hover:bg-white"}`}
                                    >
                                        <CreditCard class="h-6 w-6" />
                                    </div>
                                    <span class="font-bold"
                                        >Tanpa Nota (KTP)</span
                                    >
                                    {#if receiptOption === "no_receipt"}
                                        <div
                                            class="absolute inset-0 bg-amber-500/5 z-[-1]"
                                        ></div>
                                    {/if}
                                </label>
                            </div>

                            <div
                                class="animate-in fade-in slide-in-from-bottom-2 duration-300"
                            >
                                {#if receiptOption === "receipt"}
                                    <div
                                        class="border-2 border-dashed border-primary/20 bg-primary/5 rounded-2xl p-8 text-center hover:bg-primary/10 transition-colors cursor-pointer group"
                                    >
                                        {#if receiptPhoto}
                                            <div
                                                class="relative inline-block group/img w-full max-w-sm"
                                            >
                                                <img
                                                    src={receiptPhoto}
                                                    alt="Nota"
                                                    class="w-full rounded-xl shadow-lg ring-1 ring-border"
                                                />
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    class="absolute top-2 right-2 opacity-0 group-hover/img:opacity-100 transition-opacity"
                                                    onclick={() =>
                                                        (receiptPhoto = "")}
                                                >
                                                    <X class="h-4 w-4 mr-2" /> Ganti
                                                    Foto
                                                </Button>
                                            </div>
                                        {:else}
                                            <label
                                                class="cursor-pointer min-h-[150px] flex flex-col items-center justify-center gap-3"
                                            >
                                                <div
                                                    class="p-4 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300"
                                                >
                                                    <Camera
                                                        class="h-8 w-8 text-primary"
                                                    />
                                                </div>

                                                <div class="space-y-1">
                                                    <span
                                                        class="font-bold text-lg text-primary block"
                                                        >Upload Foto Nota</span
                                                    >
                                                    <span
                                                        class="text-sm text-muted-foreground"
                                                        >Klik area ini untuk
                                                        mengambil gambar</span
                                                    >
                                                </div>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    class="hidden"
                                                    onchange={(e) =>
                                                        handlePhotoUpload(
                                                            e,
                                                            "receipt",
                                                        )}
                                                />
                                            </label>
                                        {/if}
                                    </div>
                                {:else}
                                    <div
                                        class="space-y-5 bg-card border rounded-2xl p-6 shadow-sm"
                                    >
                                        <div
                                            class="bg-amber-50 border border-amber-100 text-amber-800 p-4 rounded-xl text-sm flex items-start gap-3"
                                        >
                                            <div
                                                class="p-1.5 bg-amber-100 rounded-full shrink-0"
                                            >
                                                <span
                                                    class="text-xs font-bold block"
                                                    >⚠️</span
                                                >
                                            </div>
                                            <p class="leading-relaxed">
                                                <strong
                                                    >Prosedur Keamanan:</strong
                                                > Wajib memfoto KTP asli pelapor
                                                yang sesuai dengan nama pemilik unit
                                                untuk arsip keamanan.
                                            </p>
                                        </div>

                                        <div class="space-y-4">
                                            <div class="space-y-2">
                                                <Label
                                                    class="text-sm font-semibold"
                                                    >Nama Lengkap (Sesuai KTP)</Label
                                                >
                                                <Input
                                                    bind:value={idName}
                                                    placeholder="Ketik nama lengkap..."
                                                    class="h-11 rounded-xl"
                                                />
                                            </div>

                                            <div class="space-y-2">
                                                <Label
                                                    class="text-sm font-semibold"
                                                    >Foto KTP Fisik</Label
                                                >
                                                <div
                                                    class="border-2 border-dashed rounded-xl p-6 text-center hover:bg-muted/50 transition-colors"
                                                >
                                                    {#if idPhoto}
                                                        <div
                                                            class="relative inline-block group w-full max-w-sm"
                                                        >
                                                            <img
                                                                src={idPhoto}
                                                                alt="KTP"
                                                                class="w-full rounded-xl shadow-lg"
                                                            />
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onclick={() =>
                                                                    (idPhoto =
                                                                        "")}
                                                            >
                                                                <X
                                                                    class="h-4 w-4 mr-2"
                                                                /> Ganti
                                                            </Button>
                                                        </div>
                                                    {:else}
                                                        <label
                                                            class="cursor-pointer min-h-[120px] flex flex-col items-center justify-center gap-2"
                                                        >
                                                            <div
                                                                class="p-3 bg-muted rounded-full"
                                                            >
                                                                <Camera
                                                                    class="h-6 w-6 text-muted-foreground"
                                                                />
                                                            </div>
                                                            <div
                                                                class="text-center"
                                                            >
                                                                <span
                                                                    class="font-medium text-foreground block"
                                                                    >Ambil Foto
                                                                    KTP</span
                                                                >
                                                                <span
                                                                    class="text-xs text-muted-foreground"
                                                                    >Pastikan
                                                                    foto jelas &
                                                                    terbaca</span
                                                                >
                                                            </div>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                class="hidden"
                                                                onchange={(e) =>
                                                                    handlePhotoUpload(
                                                                        e,
                                                                        "id",
                                                                    )}
                                                            />
                                                        </label>
                                                    {/if}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    {/if}
                </div>
            {:else if currentStep === 2}
                <!-- Step 2: Payment (Sales Style) -->
                <div
                    class="flex flex-col h-full gap-6 animate-in slide-in-from-right-4 duration-300"
                >
                    <!-- Summary Top -->
                    <div
                        class="bg-gradient-to-br from-primary/90 to-primary p-6 rounded-2xl shadow-lg shadow-primary/20 text-center space-y-1 text-primary-foreground relative overflow-hidden"
                    >
                        <div
                            class="absolute inset-0 bg-white/5 opacity-50 pattern-grid"
                        ></div>
                        <span
                            class="text-xs font-semibold uppercase tracking-wider opacity-90 relative z-10"
                            >Total Tagihan Service</span
                        >
                        <div
                            class="text-4xl font-bold font-mono tracking-tight relative z-10"
                        >
                            {formatCurrency(cost)}
                        </div>
                    </div>

                    <!-- Payment Methods -->
                    <div class="space-y-4 flex-1">
                        <div class="flex justify-between items-center">
                            <div class="flex items-center gap-3">
                                <div
                                    class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm ring-4 ring-primary/5"
                                >
                                    2
                                </div>
                                <Label class="text-lg font-bold"
                                    >Pembayaran</Label
                                >
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onclick={addPaymentRow}
                                disabled={payments.length >= 2 ||
                                    (payments[0] &&
                                        getSelectedMethod(payments[0].methodId)
                                            ?.type === "cash") ||
                                    availableMethods.length === 0}
                                class="h-9 rounded-full text-xs font-semibold border-dashed"
                            >
                                <Plus class="h-3.5 w-3.5 mr-1" /> Split Payment
                            </Button>
                        </div>

                        {#if availableMethods.length === 0}
                            <div
                                class="text-center p-8 border rounded-2xl bg-muted/20 text-muted-foreground text-sm"
                            >
                                <div class="animate-pulse">
                                    Memuat metode pembayaran...
                                </div>
                            </div>
                        {:else}
                            {#each payments as payment, i}
                                {@const selectedMethod = getSelectedMethod(
                                    payment.methodId,
                                )}
                                <div
                                    class="p-5 border rounded-2xl bg-card shadow-sm space-y-4 relative group hover:border-primary/30 transition-colors"
                                >
                                    {#if payments.length > 1}
                                        <div
                                            class="flex justify-between items-center mb-2"
                                        >
                                            <span
                                                class="text-xs font-bold text-muted-foreground uppercase bg-muted px-2 py-0.5 rounded"
                                                >Pembayaran #{i + 1}</span
                                            >
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                class="h-6 w-6 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-full"
                                                onclick={() =>
                                                    removePaymentRow(i)}
                                            >
                                                <X class="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    {/if}

                                    <div class="grid gap-3">
                                        <div class="grid grid-cols-2 gap-3">
                                            <Select
                                                type="single"
                                                value={payment.methodId}
                                                onValueChange={(val) =>
                                                    handleMethodChange(i, val)}
                                            >
                                                <SelectTrigger
                                                    class="h-11 rounded-xl bg-background border-input"
                                                >
                                                    <span>
                                                        {getSelectedMethod(
                                                            payment.methodId,
                                                        )?.name ||
                                                            "Pilih Metode"}
                                                    </span>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {#each availableMethods as method}
                                                        <SelectItem
                                                            value={method.id}
                                                        >
                                                            <span
                                                                class="flex items-center gap-2"
                                                            >
                                                                <span
                                                                    >{method.icon}</span
                                                                >
                                                                {method.name}
                                                            </span>
                                                        </SelectItem>
                                                    {/each}
                                                </SelectContent>
                                            </Select>

                                            <!-- Sub-method / Variant Selector -->
                                            {#if selectedMethod?.variants && selectedMethod.variants.length > 0}
                                                <Select
                                                    type="single"
                                                    value={payment.variantId}
                                                    onValueChange={(val) =>
                                                        handleVariantChange(
                                                            i,
                                                            val,
                                                        )}
                                                >
                                                    <SelectTrigger
                                                        class="h-11 rounded-xl bg-muted/30 border-input"
                                                    >
                                                        <span>
                                                            {selectedMethod.variants.find(
                                                                (v) =>
                                                                    v.id ===
                                                                    payment.variantId,
                                                            )?.name ||
                                                                "Pilih Bank"}
                                                        </span>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {#each selectedMethod.variants as variant}
                                                            <SelectItem
                                                                value={variant.id}
                                                            >
                                                                <div
                                                                    class="flex flex-col"
                                                                >
                                                                    <span
                                                                        class="font-medium"
                                                                        >{variant.name}</span
                                                                    >
                                                                    {#if variant.accountNumber}
                                                                        <span
                                                                            class="text-xs text-muted-foreground"
                                                                            >{variant.accountNumber}</span
                                                                        >
                                                                    {/if}
                                                                </div>
                                                            </SelectItem>
                                                        {/each}
                                                    </SelectContent>
                                                </Select>
                                            {:else}
                                                <div
                                                    class="h-11 rounded-xl bg-muted/10 border border-transparent flex items-center px-3 text-sm text-muted-foreground italic"
                                                >
                                                    Opsi standar
                                                </div>
                                            {/if}
                                        </div>

                                        <div class="relative">
                                            <span
                                                class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold"
                                                >Rp</span
                                            >
                                            <CurrencyInput
                                                class="pl-10 h-12 text-lg font-bold text-right rounded-xl"
                                                bind:value={payment.amount}
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        {/if}
                    </div>

                    {#if serviceStatus !== "batal"}
                        <div
                            class="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 space-y-3"
                        >
                            <div class="flex justify-between items-center">
                                <Label class="text-sm font-bold text-blue-900"
                                    >Garansi Layanan</Label
                                >
                                {#if initialWarranty && initialWarranty !== "none"}
                                    <Badge
                                        variant="outline"
                                        class="bg-blue-100/50 text-blue-700 border-blue-200 gap-1 pl-1.5"
                                    >
                                        <CheckCircle
                                            class="h-3 w-3 fill-blue-500 text-white"
                                        />
                                        Terverifikasi
                                    </Badge>
                                {/if}
                            </div>

                            <Select
                                type="single"
                                value={warranty}
                                onValueChange={(v) => (warranty = v)}
                                disabled={!!(
                                    initialWarranty &&
                                    initialWarranty !== "none"
                                )}
                            >
                                <SelectTrigger
                                    class={`h-10 rounded-xl bg-white border-blue-200 ${initialWarranty && initialWarranty !== "none" ? "opacity-90 font-medium" : ""}`}
                                >
                                    {warranty || "Pilih Garansi"}
                                </SelectTrigger>
                                <SelectContent>
                                    {#each warrantyOptions as opt}
                                        <SelectItem value={opt}
                                            >{opt}</SelectItem
                                        >
                                    {/each}
                                </SelectContent>
                            </Select>
                            {#if initialWarranty && initialWarranty !== "none"}
                                <p
                                    class="text-[10px] text-blue-600/80 font-medium ml-1"
                                >
                                    * Garansi telah ditentukan saat pendaftaran
                                    service
                                </p>
                            {/if}
                        </div>
                    {/if}

                    <!-- Payment Summary Box -->
                    <div
                        class="bg-muted/50 p-5 rounded-2xl space-y-3 text-sm mt-auto backdrop-blur-sm"
                    >
                        <div
                            class="flex justify-between items-center text-muted-foreground"
                        >
                            <span>Total Terbayar</span>
                            <span class="font-medium text-foreground"
                                >{formatCurrency(totalPaid)}</span
                            >
                        </div>
                        <Separator class="bg-border/60" />
                        {#if remaining > 0}
                            <div
                                class="flex justify-between items-center font-bold text-destructive text-base"
                            >
                                <span>Kurang Bayar</span>
                                <span>{formatCurrency(remaining)}</span>
                            </div>
                        {:else}
                            <div
                                class="flex justify-between items-center font-bold text-green-600 text-base"
                            >
                                <span>Kembalian</span>
                                <span>{formatCurrency(change)}</span>
                            </div>
                        {/if}
                    </div>
                </div>
            {/if}
        </div>

        <DialogFooter class="px-8 py-5 border-t bg-background items-center">
            {#if currentStep === 1}
                <Button
                    variant="ghost"
                    onclick={onClose}
                    class="rounded-full hover:bg-muted font-medium text-muted-foreground"
                    >Batal</Button
                >
                <Button
                    onclick={nextStep}
                    class="rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/20 transition-all"
                >
                    Lanjut Pembayaran <ChevronRight class="ml-2 h-4 w-4" />
                </Button>
            {:else}
                <Button
                    variant="ghost"
                    onclick={prevStep}
                    class="rounded-full hover:bg-muted font-medium text-muted-foreground mr-auto"
                >
                    <ChevronLeft class="mr-2 h-4 w-4" /> Kembali
                </Button>
                <Button
                    onclick={handleSubmit}
                    disabled={isSubmitting || remaining > 0}
                    class="min-w-[160px] rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/20 transition-all"
                >
                    {#if isSubmitting}
                        Memproses...
                    {:else}
                        <CreditCard class="mr-2 h-4 w-4" /> Bayar & Selesai
                    {/if}
                </Button>
            {/if}
        </DialogFooter>
    </DialogContent>
</Dialog>

