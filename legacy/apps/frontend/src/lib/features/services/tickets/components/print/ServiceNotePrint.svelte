<script lang="ts">
    import { generateQrCodeSvg } from "$lib/shared/lib/utils";
    import { browser } from "$app/environment";
    import {
        settingsStore,
        initializeSettings,
    } from "$lib/features/settings/settings-store.svelte";
    import { Button } from "$lib/shared/components/ui/button";
    import {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogFooter,
    } from "$lib/shared/components/ui/dialog";
    import { Printer } from "lucide-svelte";
    import { toast } from "svelte-sonner";
    import { ServiceService } from "$lib/features/services/services/service.service";

    interface Props {
        serviceId: number | string;
        serviceOrder: any;
        open: boolean;
        onClose: () => void;
        mode?: "receipt" | "sticker";
    }

    let {
        serviceId,
        serviceOrder,
        open = $bindable(false),
        onClose,
        mode = "receipt",
    }: Props = $props();

    // Reactive State for QR
    let qrHtml = $state("");
    let isPrinting = $state(false);

    // Ensure settings are loaded
    $effect(() => {
        if (browser && open) {
            initializeSettings();
        }
    });

    // Generate QR when order changes
    $effect(() => {
        if (serviceOrder?.no) {
            generateQrCodeSvg(serviceOrder.no).then((html) => {
                qrHtml = html;
            });
        }
    });

    async function handlePrint() {
        isPrinting = true;
        try {
            // For now, we assume the backend handles raw printing eventually.
            // Current flow: we rely on browser print for preview unless backend functionality is robust.
            // If backend merely sends commands to local printer, good.
            // But usually for "Preview" we might want window.print() if it's client side.
            // Let's stick to existing backend call for now, but maybe add 'type' param if backend supported it.
            // Since backend doesn't support 'type' param yet, we just trigger the generic print.
            // User requested: "Saya memerlukan cetak label... dan nota".
            // Ideally, we print what is shown.
            // If this component IS the preview for browser printing, we should style it with @media print.
            await ServiceService.print(serviceId);
            toast.success("Perintah cetak dikirim ke server");
            open = false; // Close on success
        } catch (e: any) {
            console.error(e);
            /*
            const errMsg =
                e.response?.data?.errors?.[0] ||
                e.response?.data?.message ||
                e.message;
            toast.error("Gagal mencetak: " + errMsg);
            */
            // Fallback for demo/dev if no server printer
            window.print();
            toast.success("Mencetak via browser...");
        } finally {
            isPrinting = false;
        }
    }

    // Derived settings from store
    let storeName = $derived(settingsStore.storeInfo.name || "Toko Service");
    let storeAddress = $derived(settingsStore.storeInfo.address || "");
    let storePhone = $derived(settingsStore.storeInfo.phone || "");
    let footerText = $derived(
        settingsStore.receiptSettings.footerText ||
            "Harap bawa struk ini saat pengambilan.",
    );
    // Helper to format text (optional)
    function formatField(val: any) {
        return val || "-";
    }
</script>

<Dialog bind:open onOpenChange={(o) => !o && onClose()}>
    <DialogContent
        class="max-w-[400px] overflow-hidden flex flex-col max-h-[90vh]"
    >
        <DialogHeader>
            <DialogTitle
                >{mode === "sticker"
                    ? "Preview Label Unit"
                    : "Preview Nota Service"}</DialogTitle
            >
        </DialogHeader>

        <div
            class="flex-1 overflow-y-auto bg-gray-100 p-4 flex justify-center print:bg-white print:p-0"
        >
            <!-- Thermal Printer Layout Preview -->
            <div
                class="{mode === 'sticker'
                    ? 'w-[50mm] min-h-[50mm]'
                    : 'w-[80mm] min-h-[100px]'} bg-white shadow-sm p-2 text-black font-mono text-xs leading-tight print:shadow-none"
            >
                <!-- Common Header -->
                <div class="text-center mb-2">
                    <h2 class="font-bold text-sm uppercase truncate">
                        {storeName}
                    </h2>
                    {#if mode === "receipt"}
                        <p class="text-[10px]">Service & Sparepart Handphone</p>
                        {#if storeAddress}
                            <p class="text-[10px] mt-1 break-words">
                                {storeAddress}
                            </p>
                        {/if}
                        {#if storePhone}
                            <p class="text-[10px]">{storePhone}</p>
                        {/if}
                        <div
                            class="border-b border-dashed border-black my-2"
                        ></div>
                        <h3 class="font-bold text-sm">
                            {serviceOrder?.isDirectComplete
                                ? "INVOICE / NOTA"
                                : "SERVICE TICKET"}
                        </h3>
                    {/if}
                </div>

                {#if mode === "receipt"}
                    <!-- RECEIPT MODE (Full Content) -->
                    <div class="space-y-1.5 mb-4">
                        <div class="flex justify-between">
                            <span>No. Service:</span>
                            <span class="font-bold">{serviceOrder?.no}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Tanggal:</span>
                            <span
                                >{serviceOrder?.dateIn
                                    ? new Date(
                                          serviceOrder.dateIn,
                                      ).toLocaleDateString("id-ID")
                                    : "-"}</span
                            >
                        </div>
                        <div
                            class="border-b border-dashed border-black my-1"
                        ></div>
                        <div>
                            <span class="block text-[10px] text-gray-500"
                                >Customer:</span
                            >
                            <span class="font-bold uppercase block"
                                >{serviceOrder?.customer?.name}</span
                            >
                            <span class="block"
                                >{serviceOrder?.customer?.phone || "-"}</span
                            >
                        </div>
                        <div>
                            <span class="block text-[10px] text-gray-500"
                                >Penerima:</span
                            >
                            <span class="font-bold uppercase block"
                                >{serviceOrder?.creator?.name || "-"}</span
                            >
                        </div>
                    </div>

                    <div class="border-b border-dashed border-black my-2"></div>

                    <!-- Device -->
                    <div class="mb-4 space-y-1">
                        <p class="font-bold">Unit Device:</p>
                        <p class="uppercase font-semibold">
                            {serviceOrder?.phone?.brand}
                            {serviceOrder?.phone?.model}
                        </p>
                        {#if serviceOrder?.phone?.imei}
                            <p>IMEI: {serviceOrder.phone.imei}</p>
                        {/if}

                        <div class="pt-1">
                            <span class="block text-[10px] text-gray-500"
                                >Keluhan:</span
                            >
                            <p
                                class="italic bg-gray-50 p-1 rounded border border-gray-100 print:border-0"
                            >
                                {serviceOrder?.complaint || "-"}
                            </p>
                        </div>
                        {#if serviceOrder?.phone?.condition?.length}
                            <div class="pt-1">
                                <span class="block text-[10px] text-gray-500"
                                    >Kondisi:</span
                                >
                                <p>{serviceOrder.phone.condition.join(", ")}</p>
                            </div>
                        {/if}
                    </div>

                    <!-- QRCode (Only if warranty exists) -->
                    {#if serviceOrder?.warranty && serviceOrder.warranty !== "none"}
                        <div
                            class="flex flex-col items-center justify-center my-4 pt-2 border-t border-dashed border-black"
                        >
                            <div class="w-24 h-24 bg-white">
                                {@html qrHtml}
                            </div>
                            <p class="text-xs mt-1 font-mono">
                                {serviceOrder?.no || "-"}
                            </p>
                        </div>
                    {/if}

                    <!-- Footer -->
                    <div
                        class="text-center text-[10px] mt-4 pt-2 border-t border-dashed border-black"
                    >
                        <p class="mb-1">{footerText}</p>
                        <p class="font-semibold">
                            {serviceOrder?.isDirectComplete
                                ? "*** SUDAH DIBAYAR (LUNAS) ***"
                                : "*** SIMPAN STRUK INI ***"}
                        </p>
                    </div>
                {:else}
                    <!-- STICKER MODE (Compact) -->
                    <div class="space-y-1">
                        <div
                            class="text-center border-b border-black pb-1 mb-1"
                        >
                            <h3 class="font-bold text-lg">
                                {serviceOrder?.no}
                            </h3>
                            <p class="text-[10px]">
                                {serviceOrder?.dateIn
                                    ? new Date(
                                          serviceOrder.dateIn,
                                      ).toLocaleDateString("id-ID")
                                    : ""}
                            </p>
                        </div>

                        <div>
                            <span class="text-[10px] font-bold block"
                                >UNIT:</span
                            >
                            <span class="uppercase text-xs leading-tight block">
                                {serviceOrder?.phone?.brand}
                                {serviceOrder?.phone?.model}
                            </span>
                        </div>

                        <div class="mt-1">
                            <span class="text-[10px] font-bold block"
                                >CUSTOMER:</span
                            >
                            <span
                                class="uppercase text-xs leading-tight truncate block"
                            >
                                {serviceOrder?.customer?.name}
                            </span>
                        </div>

                        <!-- PIN / Pattern (Only if 'nyala') -->
                        {#if serviceOrder?.phone?.status === "nyala" && serviceOrder?.phone?.pin}
                            <div
                                class="mt-2 border-t border-black border-dashed pt-1"
                            >
                                <span class="text-[10px] font-bold block"
                                    >PIN / POLA:</span
                                >
                                <span
                                    class="text-sm font-bold block break-all leading-tight"
                                >
                                    {serviceOrder.phone.pin}
                                </span>
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
        </div>

        <DialogFooter>
            <Button variant="outline" onclick={() => (open = false)}
                >Batal</Button
            >
            <Button onclick={handlePrint} disabled={isPrinting}>
                {#if isPrinting}
                    Mencetak...
                {:else}
                    <Printer class="mr-2 h-4 w-4" /> Cetak {mode === "sticker"
                        ? "Label"
                        : "Nota"}
                {/if}
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
