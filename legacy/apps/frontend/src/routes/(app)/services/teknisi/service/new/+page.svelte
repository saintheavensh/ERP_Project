<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import { Separator } from "$lib/shared/components/ui/separator";
    import { toast } from "svelte-sonner";
    import {
        ArrowLeft,
        ArrowRight,
        CheckCircle,
        User,
        Smartphone,
        Wrench,
        Clock,
        Loader2,
        Plus,
        ClipboardCheck,
        FileCheck,
        Printer,
        FileText,
        Sparkles,
    } from "lucide-svelte";
    import { goto } from "$app/navigation";
    import { createQuery } from "@tanstack/svelte-query";
    import { api } from "$lib/shared/lib/api-client";
    import type { ApiResponse } from "@repo/shared";
    import { ServiceService } from "$lib/features/services/services/service.service";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
    } from "$lib/shared/components/ui/dialog";
    import ServiceNotePrint from "$lib/features/services/tickets/components/print/ServiceNotePrint.svelte";
    import ServicePickupWizard from "$lib/features/services/tickets/components/wizards/ServicePickupWizard.svelte";

    // Logic & State
    import { TicketFormController } from "$lib/features/services/tickets/ticket-form.controller.svelte";

    // Steps
    import Step1Customer from "$lib/features/services/tickets/components/wizard/Step1Customer.svelte";
    import Step2Device from "$lib/features/services/tickets/components/wizard/Step2Device.svelte";
    import Step3Service from "$lib/features/services/tickets/components/wizard/Step3Service.svelte";
    import Step35QC from "$lib/features/services/tickets/components/wizard/Step35QC.svelte";
    import Step5Review from "$lib/features/services/tickets/components/wizard/Step5Review.svelte";
    import { fade, fly } from "svelte/transition";
    import { cn } from "$lib/shared/lib/utils";

    // Initialize Store
    const form = new TicketFormController();

    // Queries
    const techniciansQuery = createQuery(() => ({
        queryKey: ["users", "technicians"],
        queryFn: async () => {
            const res = await api.get<ApiResponse<any[]>>(
                "/users?role=teknisi",
            );
            return res.data?.data || [];
        },
    }));

    const inventoryQuery = createQuery(() => ({
        queryKey: ["inventory"],
        queryFn: async () => {
            const res = await api.get("/inventory");
            return res.data?.data || [];
        },
    }));

    const servicesQuery = createQuery(() => ({
        queryKey: ["services", "calendar"],
        queryFn: () => ServiceService.getAll(),
    }));

    const paymentMethodsQuery = createQuery(() => ({
        queryKey: ["payment-methods"],
        queryFn: async () => {
            const res = await api.get("/payment-methods");
            return res.data?.data || [];
        },
    }));

    let technicians = $derived(techniciansQuery.data || []);
    let inventoryItems = $derived(inventoryQuery.data || []);
    let services = $derived((servicesQuery.data || []) as any[]);
    let paymentMethods = $derived((paymentMethodsQuery.data || []) as any[]);

    // Unified Steps for Intake
    const steps = [
        { step: 1, label: "Customer", icon: User, desc: "Data Pelanggan" },
        {
            step: 2,
            label: "Unit",
            icon: Smartphone,
            desc: "Fisik & Kelengkapan",
        },
        {
            step: 3,
            label: "Checklist",
            icon: ClipboardCheck,
            desc: "Fungsi Awal (QC)",
        },
        { step: 4, label: "Keluhan", icon: Wrench, desc: "Detail Masalah" },
        {
            step: 5,
            label: "Konfirmasi",
            icon: FileCheck,
            desc: "Review & Simpan",
        },
    ];

    let totalSteps = 5;

    let showPrintSuccessModal = $state(false);
    let createdServiceId = $state<number | string | null>(null);
    let printedServiceData = $state<any>(null);
    let showPrintPreview = $state(false);
    let printMode = $state<"receipt" | "sticker">("receipt");

    // Pickup Wizard State
    let showPickupWizard = $state(false);
    let completedService = $state<any>(null);

    function openPrintPreview(mode: "receipt" | "sticker") {
        printMode = mode;
        showPrintPreview = true;
    }

    function closeAllAndRedirect() {
        showPrintSuccessModal = false;
        goto("/service");
    }
</script>

<div
    class="min-h-screen w-full bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-slate-950 dark:to-slate-900 p-4 lg:p-6 flex flex-col relative overflow-hidden"
>
    <!-- Background Accents -->
    <div
        class="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none"
    ></div>
    <div
        class="fixed bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-cyan-400/10 rounded-full blur-[100px] pointer-events-none"
    ></div>

    <!-- Header Navigation -->
    <header class="flex items-center justify-between mb-6 z-10">
        <div class="flex items-center gap-4">
            <Button
                variant="ghost"
                size="icon"
                href="/service"
                class="rounded-full hover:bg-white/50 backdrop-blur-sm"
            >
                <ArrowLeft class="h-5 w-5 text-muted-foreground" />
            </Button>
            <div>
                <h1
                    class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-cyan-600 dark:from-blue-400 dark:to-cyan-400"
                >
                    Service Baru
                </h1>
                <p class="text-sm text-muted-foreground hidden sm:block">
                    Buat tiket service untuk pelanggan baru
                </p>
            </div>
        </div>

        <div class="flex items-center gap-2">
            <div
                class="hidden md:flex items-center gap-1 bg-white/40 dark:bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-sm"
            >
                <Sparkles class="h-3.5 w-3.5 text-amber-500" />
                <span class="text-xs font-medium text-muted-foreground"
                    >Premium Mode</span
                >
            </div>
        </div>
    </header>

    <!-- Main Content Layout -->
    <div
        class="flex-1 flex flex-col lg:flex-row gap-6 max-w-[1600px] mx-auto w-full z-10"
    >
        <!-- Left Sidebar: Stepper & Mode -->
        <aside class="w-full lg:w-[320px] shrink-0 flex flex-col gap-6">
            <!-- Mode Selection Card -->
            <div
                class="rounded-3xl border border-white/40 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-lg shadow-blue-900/5 p-5 transition-all hover:shadow-xl"
            >
                <p
                    class="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2"
                >
                    <Clock class="h-3.5 w-3.5" /> Tipe Layanan
                </p>
                <div class="grid grid-cols-2 gap-3">
                    <button
                        class={cn(
                            "relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 overflow-hidden",
                            form.priority === "standard"
                                ? "border-blue-500/50 bg-blue-50/50 dark:bg-blue-900/20 shadow-inner"
                                : "border-transparent bg-muted/30 hover:bg-muted/60",
                        )}
                        onclick={() => {
                            form.priority = "standard";
                            form.isDirectComplete = false;
                            form.isWalkin = false;
                        }}
                    >
                        {#if form.priority === "standard"}
                            <div
                                class="absolute inset-0 bg-blue-500/5 dark:bg-blue-400/5 animate-pulse"
                            ></div>
                        {/if}
                        <Clock
                            class={cn(
                                "h-6 w-6 mb-2",
                                form.priority === "standard"
                                    ? "text-blue-600"
                                    : "text-muted-foreground",
                            )}
                        />
                        <span
                            class={cn(
                                "text-[10px] font-black tracking-wide",
                                form.priority === "standard"
                                    ? "text-blue-700"
                                    : "text-muted-foreground",
                            )}>REGULER</span
                        >
                    </button>

                    <button
                        class={cn(
                            "relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 overflow-hidden",
                            form.priority === "wait"
                                ? "border-cyan-500/50 bg-cyan-50/50 dark:bg-cyan-900/20 shadow-inner"
                                : "border-transparent bg-muted/30 hover:bg-muted/60",
                        )}
                        onclick={() => {
                            form.priority = "wait";
                            form.isDirectComplete = true;
                            form.isWalkin = true;
                        }}
                    >
                        {#if form.priority === "wait"}
                            <div
                                class="absolute inset-0 bg-cyan-500/5 dark:bg-cyan-400/5 animate-pulse"
                            ></div>
                        {/if}
                        <User
                            class={cn(
                                "h-6 w-6 mb-2",
                                form.priority === "wait"
                                    ? "text-cyan-600"
                                    : "text-muted-foreground",
                            )}
                        />
                        <span
                            class={cn(
                                "text-[10px] font-black tracking-wide",
                                form.priority === "wait"
                                    ? "text-cyan-700"
                                    : "text-muted-foreground",
                            )}>DITUNGGU</span
                        >
                    </button>
                </div>

                <!-- Expandable Options for Priority -->
                <div
                    class={cn(
                        "grid transition-all duration-300 ease-in-out",
                        form.priority === "wait"
                            ? "grid-rows-[1fr] opacity-100 mt-3 pt-3 border-t border-dashed"
                            : "grid-rows-[0fr] opacity-0",
                    )}
                >
                    <div class="overflow-hidden">
                        <label
                            class="flex items-center gap-3 cursor-pointer group p-2 rounded-xl hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors"
                        >
                            <input
                                type="checkbox"
                                bind:checked={form.isDirectComplete}
                                class="w-4 h-4 rounded border-cyan-300 text-cyan-600 focus:ring-cyan-500 accent-cyan-600"
                            />
                            <span
                                class="text-xs font-semibold text-cyan-700/80 group-hover:text-cyan-800 transition-colors"
                                >Langsung Selesai & Bayar</span
                            >
                        </label>
                    </div>
                </div>
            </div>

            <!-- Stepper Container -->
            <div
                class="flex-1 rounded-3xl border border-white/40 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-lg shadow-blue-900/5 p-6 hidden lg:flex flex-col justify-center"
            >
                <nav class="relative space-y-8">
                    <!-- Vertical Line -->
                    <div
                        class="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-800 -z-10 rounded-full"
                    ></div>
                    <div
                        class="absolute left-[19px] top-4 w-0.5 bg-gradient-to-b from-blue-500 to-cyan-400 -z-10 rounded-full transition-all duration-700 ease-in-out"
                        style="height: {((form.currentStep - 1) /
                            (steps.length - 1)) *
                            100}%"
                    ></div>

                    {#each steps as item}
                        {@const isActive = form.currentStep === item.step}
                        {@const isCompleted = form.currentStep > item.step}
                        <button
                            class="flex items-center gap-4 group w-full text-left"
                            onclick={() => {
                                if (isCompleted) form.currentStep = item.step;
                            }}
                            disabled={!isCompleted}
                        >
                            <div
                                class={cn(
                                    "relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 border-2 z-10 bg-white dark:bg-slate-900",
                                    isActive
                                        ? "border-blue-500 text-blue-600 shadow-[0_0_20px_-5px_rgba(59,130,246,0.6)] scale-110"
                                        : isCompleted
                                          ? "border-cyan-500 bg-cyan-500 text-white border-transparent"
                                          : "border-slate-200 text-slate-300 dark:border-slate-800",
                                )}
                            >
                                {#if isCompleted}
                                    <CheckCircle
                                        class="h-5 w-5 animate-in zoom-in duration-300"
                                    />
                                {:else}
                                    {item.step}
                                {/if}
                            </div>
                            <div
                                class={cn(
                                    "flex-1 transition-all duration-300",
                                    isActive
                                        ? "opacity-100 translate-x-1"
                                        : isCompleted
                                          ? "opacity-80"
                                          : "opacity-40",
                                )}
                            >
                                <p
                                    class={cn(
                                        "text-sm font-bold leading-none mb-1",
                                        isActive
                                            ? "text-blue-700 dark:text-blue-400"
                                            : "text-foreground",
                                    )}
                                >
                                    {item.label}
                                </p>
                                <p
                                    class="text-[11px] font-medium text-muted-foreground uppercase tracking-wider"
                                >
                                    {item.desc}
                                </p>
                            </div>
                        </button>
                    {/each}
                </nav>
            </div>
        </aside>

        <!-- Right: Form Area -->
        <main class="flex-1 flex flex-col relative">
            <div
                class="flex-1 rounded-[2.5rem] border border-white/40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl shadow-xl shadow-blue-900/5 p-6 sm:p-10 relative overflow-hidden flex flex-col"
            >
                <!-- Inner Glows -->
                <div
                    class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-bl-[100px] pointer-events-none"
                ></div>

                <!-- Step Content Container -->
                <div class="flex-1 relative min-h-[500px]">
                    {#key form.currentStep}
                        <div
                            in:fly={{ x: 20, duration: 400, delay: 100 }}
                            out:fade={{ duration: 200 }}
                            class="h-full"
                        >
                            {#if form.currentStep === 1}
                                <Step1Customer {form} />
                            {:else if form.currentStep === 2}
                                <Step2Device {form} />
                            {:else if form.currentStep === 3}
                                <Step35QC {form} />
                            {:else if form.currentStep === 4}
                                <Step3Service
                                    {form}
                                    {technicians}
                                    {inventoryItems}
                                    {services}
                                />
                            {:else if form.currentStep === 5}
                                <Step5Review {form} />
                            {/if}
                        </div>
                    {/key}
                </div>

                <!-- Action Bar -->
                <div
                    class="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between"
                >
                    <Button
                        variant="ghost"
                        onclick={form.prevStep.bind(form)}
                        disabled={form.currentStep === 1}
                        class={cn(
                            "hover:bg-slate-100 rounded-xl px-6",
                            form.currentStep === 1
                                ? "opacity-0 pointer-events-none"
                                : "opacity-100",
                        )}
                    >
                        <ArrowLeft class="h-4 w-4 mr-2" />
                        Sebelumnya
                    </Button>

                    {#if form.currentStep < totalSteps}
                        <Button
                            onclick={() => {
                                if (form.currentStep === 2 && form.isDead) {
                                    form.currentStep = 4; // Skip QC
                                } else {
                                    form.nextStep();
                                }
                            }}
                            size="lg"
                            class="px-8 rounded-2xl shadow-lg shadow-blue-600/20 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 border-0 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Selanjutnya
                            <ArrowRight class="h-4 w-4 ml-2" />
                        </Button>
                    {:else}
                        <!-- Finish Actions -->
                        <div class="flex gap-3">
                            <Button
                                onclick={async () => {
                                    const res = await form.handleSubmit();
                                    if (res?.success) form.resetForNextUnit();
                                }}
                                disabled={form.isSubmitting}
                                variant="outline"
                                class="rounded-xl border-dashed border-2 hover:bg-slate-50"
                            >
                                <Plus class="h-4 w-4 mr-2" />
                                Simpan & Tambah Unit
                            </Button>
                            <Button
                                onclick={async () => {
                                    const res = await form.handleSubmit();
                                    if (res?.success) {
                                        if (form.isWalkin) {
                                            completedService = {
                                                serviceId: res.serviceId,
                                                serviceNo:
                                                    res.serviceNo || "NEW",
                                                customer: {
                                                    name: form.customerName,
                                                    phone: form.customerPhone,
                                                },
                                                device: {
                                                    brand: form.phoneBrand,
                                                    model: form.phoneModel,
                                                    imei: form.imei,
                                                },
                                                cost: form.grandTotal,
                                                status: "selesai",
                                                warranty: form.warranty,
                                            };
                                            showPickupWizard = true;
                                        } else {
                                            if (res.serviceId) {
                                                createdServiceId =
                                                    res.serviceId;
                                                const currentUser =
                                                    typeof localStorage !==
                                                    "undefined"
                                                        ? JSON.parse(
                                                              localStorage.getItem(
                                                                  "user",
                                                              ) || "{}",
                                                          )
                                                        : {};
                                                printedServiceData = {
                                                    no: res.serviceNo,
                                                    dateIn: new Date(),
                                                    customer: {
                                                        name: form.customerName,
                                                        phone: form.customerPhone,
                                                    },
                                                    phone: {
                                                        brand: form.phoneBrand,
                                                        model: form.phoneModel,
                                                        imei: form.imei,
                                                        condition:
                                                            form.physicalConditions,
                                                        status: form.phoneStatus,
                                                    },
                                                    complaint: form.complaint,
                                                    creator: {
                                                        name:
                                                            currentUser.name ||
                                                            "Admin",
                                                    },
                                                    warranty: form.warranty,
                                                    isDirectComplete: false,
                                                };
                                                showPrintSuccessModal = true;
                                            } else {
                                                goto("/service");
                                            }
                                        }
                                    }
                                }}
                                disabled={form.isSubmitting}
                                size="lg"
                                class="px-8 rounded-2xl shadow-xl shadow-green-500/20 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 border-0 transition-all hover:scale-[1.02]"
                            >
                                {#if form.isSubmitting}
                                    <Loader2
                                        class="h-4 w-4 mr-2 animate-spin"
                                    />
                                    Menyimpan...
                                {:else}
                                    <CheckCircle class="h-4 w-4 mr-2" />
                                    Simpan & Selesai
                                {/if}
                            </Button>
                        </div>
                    {/if}
                </div>
            </div>
        </main>
    </div>

    <!-- Print Success Modal -->
    <Dialog open={showPrintSuccessModal} onOpenChange={closeAllAndRedirect}>
        <DialogContent
            class="sm:max-w-md rounded-3xl border-0 overflow-hidden bg-white/90 backdrop-blur-xl"
        >
            <div
                class="absolute inset-0 bg-gradient-to-br from-green-500/10 to-blue-500/10 -z-10"
            ></div>
            <DialogHeader>
                <DialogTitle class="text-2xl text-center pt-4"
                    >Service Berhasil Dibuat! 🎉</DialogTitle
                >
                <DialogDescription class="text-center">
                    Data service telah tersimpan. Silahkan cetak tanda terima.
                </DialogDescription>
            </DialogHeader>
            <div class="grid grid-cols-2 gap-4 py-6 px-2">
                <button
                    class="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-slate-100 bg-white hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all group"
                    onclick={() => openPrintPreview("sticker")}
                >
                    <div
                        class="h-14 w-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform"
                    >
                        <Printer class="h-7 w-7" />
                    </div>
                    <div class="text-center">
                        <span class="font-bold text-foreground block"
                            >Label Unit</span
                        >
                        <span class="text-xs text-muted-foreground"
                            >Stiker Tempel</span
                        >
                    </div>
                </button>
                <button
                    class="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-slate-100 bg-white hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all group"
                    onclick={() => openPrintPreview("receipt")}
                >
                    <div
                        class="h-14 w-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform"
                    >
                        <FileText class="h-7 w-7" />
                    </div>
                    <div class="text-center">
                        <span class="font-bold text-foreground block"
                            >Nota Service</span
                        >
                        <span class="text-xs text-muted-foreground"
                            >Untuk Customer</span
                        >
                    </div>
                </button>
            </div>
            <DialogFooter class="sm:justify-center gap-4 pb-4">
                <Button
                    variant="ghost"
                    onclick={closeAllAndRedirect}
                    class="rounded-full text-muted-foreground hover:text-foreground"
                    >Tutup</Button
                >
                <Button
                    variant="default"
                    onclick={() => goto("/service")}
                    class="rounded-full bg-blue-600 hover:bg-blue-700"
                    >Ke Daftar Service</Button
                >
            </DialogFooter>
        </DialogContent>
    </Dialog>

    {#if createdServiceId && printedServiceData}
        <ServiceNotePrint
            bind:open={showPrintPreview}
            serviceId={createdServiceId}
            serviceOrder={printedServiceData}
            mode={printMode}
            onClose={() => {
                showPrintPreview = false;
            }}
        />
    {/if}

    {#if showPickupWizard && completedService}
        <ServicePickupWizard
            bind:open={showPickupWizard}
            serviceId={completedService.serviceId}
            serviceNo={completedService.serviceNo}
            customer={completedService.customer}
            device={completedService.device}
            cost={completedService.cost}
            serviceStatus={completedService.status}
            requireProof={false}
            warranty={completedService.warranty}
            onComplete={() => {
                showPickupWizard = false;
                createdServiceId = completedService.serviceId;
                showPrintSuccessModal = true;
            }}
            onClose={() => {
                showPickupWizard = false;
                goto("/service");
            }}
        />
    {/if}
</div>
