<script>
    import { onMount, tick } from 'svelte';
    import QRCode from 'qrcode';

    let isOpen = false;
    let qrCanvas;
    let accessUrl = '';
    let copyText = '--';

    function toggle() {
        isOpen = !isOpen;
    }

    function close() {
        isOpen = false;
    }

    function handleKeydown(e) {
        if (e.key === 'Escape') close();
    }

    async function fetchLanUrl() {
        try {
            const response = await fetch(`http://localhost:8080/api/server-info`);
            const data = await response.json();
            if (data.success && data.url) {
                return data.url;
            }
        } catch {
            // Fallback: use current location
        }
        return `${window.location.protocol}//${window.location.host}`;
    }

    async function copyUrl() {
        if (!accessUrl) return;
        try {
            await navigator.clipboard.writeText(accessUrl);
            const original = accessUrl;
            copyText = '✅ Disalin!';
            setTimeout(() => {
                copyText = original;
            }, 1500);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    }

    onMount(async () => {
        accessUrl = await fetchLanUrl();
        copyText = accessUrl;
        
        await tick();
        
        if (qrCanvas && accessUrl) {
            QRCode.toCanvas(qrCanvas, accessUrl, {
                width: 180,
                color: {
                    dark: '#1e293b',
                    light: '#ffffff'
                }
            }, function (error) {
                if (error) console.error(error);
            });
        }
    });
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Floating QR Code Widget (center-left) -->
<div class="no-print fixed top-1/2 -translate-y-1/2 left-4 z-60" style="top: 50%; transform: translateY(-50%);">
    
    <!-- Toggle Button -->
    <button 
        on:click|stopPropagation={toggle}
        class="w-16 h-16 rounded-full bg-primary-600 text-white shadow-lg shadow-primary-500/40 flex items-center justify-center text-3xl hover:bg-primary-700 hover:scale-110 active:scale-95 transition-all"
        title="Tampilkan QR Code"
    >
        📱
    </button>

    <!-- Expandable QR Card -->
    {#if isOpen}
        <div 
            class="absolute left-20 w-64 glass-card p-5 bg-white/95 backdrop-blur-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] rounded-2xl border border-slate-200/80 animate-fade-in origin-left"
            style="top: 50%; transform: translateY(-50%);"
        >
            <!-- Close Button -->
            <button 
                on:click|stopPropagation={close}
                class="absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-sm hover:bg-slate-200 hover:text-slate-700 transition-colors"
                title="Tutup"
            >
                ✕
            </button>

            <p class="text-xs font-bold text-slate-500 tracking-widest uppercase mb-4 flex items-center gap-1.5">
                <span class="text-lg">📱</span> Akses dari HP
            </p>

            <div class="flex flex-col items-center gap-3">
                <div class="rounded-xl shadow-inner border border-slate-200 p-2 bg-white flex justify-center w-full">
                    <canvas bind:this={qrCanvas}></canvas>
                </div>
                
                <!-- URL Copy Button -->
                <button 
                    on:click|stopPropagation={copyUrl}
                    class="block text-xs font-mono text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-100 select-all cursor-pointer w-full text-center truncate hover:bg-primary-100 transition-colors"
                    title="Klik untuk copy URL"
                >
                    {copyText}
                </button>
                
                <p class="text-[10px] text-slate-400 font-medium">Scan QR atau ketik URL di HP</p>
            </div>
        </div>
    {/if}
</div>

{#if isOpen}
    <!-- Click outside handler -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div 
        class="fixed inset-0 z-50 bg-transparent" 
        on:click={close}
    ></div>
{/if}
