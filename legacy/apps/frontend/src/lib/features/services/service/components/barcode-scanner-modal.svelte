<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { Button } from "$lib/shared/components/ui/button";
    import { X, Camera, AlertTriangle } from "lucide-svelte";
    import {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
    } from "$lib/shared/components/ui/dialog";

    interface Props {
        open: boolean;
        onScan: (result: string) => void;
        onClose: () => void;
    }

    let { open, onScan, onClose }: Props = $props();

    let scanning = $state(false);
    let error = $state<string | null>(null);
    let html5QrCode: any = null;
    let readerId = "reader-" + Math.random().toString(36).substring(7);

    $effect(() => {
        if (open) {
            // Give time for DOM and script to load
            setTimeout(startScanner, 300);
        } else {
            stopScanner();
        }
    });

    async function startScanner() {
        if (scanning) return;
        error = null;

        // Check if library is loaded
        if (!("Html5Qrcode" in window)) {
            error = "Library scanner sedang dimuat, coba lagi sebentar lagi...";
            return;
        }

        if (!window.isSecureContext) {
            error =
                "Akses kamera memerlukan HTTPS atau Localhost. Browser memblokir akses kamera pada koneksi tidak aman (HTTP).";
            return;
        }

        // Ensure element exists
        if (!document.getElementById(readerId)) {
            console.warn("Scanner element not found, retrying...");
            setTimeout(startScanner, 200);
            return;
        }

        try {
            scanning = true;
            // Validasi instance sebelumnya
            if (html5QrCode) {
                await stopScanner();
            }

            // @ts-ignore
            html5QrCode = new window.Html5Qrcode(readerId);

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
            };

            await html5QrCode.start(
                { facingMode: "environment" },
                config,
                (decodedText: string) => {
                    onScan(decodedText);
                    stopScanner();
                },
                (errorMessage: string) => {
                    // ignore frame errors
                },
            );
        } catch (err: any) {
            console.error("Scanner Error Full:", err);
            scanning = false;
            let errMsg = err?.message || err;
            if (typeof errMsg !== "string") errMsg = JSON.stringify(errMsg);
            error = "Gagal: " + errMsg;
        }
    }

    async function stopScanner() {
        if (html5QrCode && html5QrCode.isScanning) {
            try {
                await html5QrCode.stop();
                html5QrCode.clear();
            } catch (e) {
                console.warn("Failed to stop scanner", e);
            }
        }
        scanning = false;
        html5QrCode = null;
    }

    onDestroy(() => {
        stopScanner();
    });
</script>

<svelte:head>
    <script
        src="/vendor/html5-qrcode.js"
        onload={() => console.log("Scanner Lib Loaded")}
    ></script>
</svelte:head>

<Dialog {open} onOpenChange={(v) => !v && onClose()}>
    <DialogContent class="sm:max-w-md">
        <DialogHeader>
            <DialogTitle class="flex items-center gap-2">
                <Camera class="h-5 w-5" />
                Scan Barcode
            </DialogTitle>
        </DialogHeader>

        <div
            class="relative min-h-[300px] bg-black rounded-lg overflow-hidden flex items-center justify-center"
        >
            <div id={readerId} class="w-full h-full"></div>

            {#if !scanning && !error}
                <div
                    class="absolute inset-0 flex items-center justify-center text-white"
                >
                    <p>Memuat Kamera...</p>
                </div>
            {/if}

            {#if error}
                <div
                    class="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-white p-4 text-center"
                >
                    <AlertTriangle class="h-10 w-10 text-yellow-500 mb-2" />
                    <p>{error}</p>
                    <Button
                        variant="outline"
                        size="sm"
                        class="mt-4 text-black"
                        onclick={() => {
                            stopScanner();
                            setTimeout(startScanner, 200);
                        }}
                    >
                        Coba Lagi
                    </Button>
                </div>
            {/if}
        </div>

        <div class="flex justify-end">
            <Button variant="secondary" onclick={onClose}>Batal</Button>
        </div>
    </DialogContent>
</Dialog>
