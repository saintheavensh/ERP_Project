<script>
    import { onMount } from 'svelte';

    import { config } from './config.js';

    let status = 'CHECKING'; // 'READY', 'ERROR', 'CHECKING'
    let printerName = '-';
    let errorMessage = '';
    let lastChecked = '';

    const checkStatus = async () => {
        status = 'CHECKING';
        try {
            const res = await fetch(`${config.printBase}/api/printer/status`);
            const data = await res.json();
            
            if (data.success) {
                printerName = data.printer;
                if (data.status === 'READY') {
                    status = 'READY';
                } else {
                    status = 'ERROR';
                    errorMessage = data.status; // Berisi 'OFFLINE', 'PAPER_OUT', dll
                }
            } else {
                status = 'ERROR';
                errorMessage = data.message;
            }
        } catch (err) {
            status = 'ERROR';
            errorMessage = 'Backend Offline';
        } finally {
            lastChecked = new Date().toLocaleTimeString('id-ID');
        }
    };

    onMount(() => {
        checkStatus();
        // Cek otomatis tiap 1 menit (permintaan user)
        const interval = setInterval(checkStatus, 60000);
        return () => clearInterval(interval);
    });
</script>

<div class="flex items-center gap-3 px-3 py-1.5 rounded-xl border border-slate-200/60 bg-white/50 shadow-sm transition-all hover:shadow-md">
    <!-- Indikator Bulat -->
    <div class="relative flex h-3 w-3">
        {#if status === 'READY'}
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        {:else if status === 'ERROR'}
            <span class="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
        {:else}
            <span class="relative inline-flex rounded-full h-3 w-3 bg-amber-400 animate-pulse"></span>
        {/if}
    </div>

    <!-- Info Printer -->
    <div class="flex flex-col">
        <div class="flex items-center gap-1.5">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Printer</span>
            <span class="text-xs font-semibold {status === 'ERROR' ? 'text-rose-600' : 'text-slate-700'} truncate max-w-[100px]">
                {status === 'READY' ? printerName : (status === 'CHECKING' ? 'Memuat...' : 'Offline')}
            </span>
        </div>
        {#if status === 'ERROR'}
            <span class="text-[9px] text-rose-500 font-medium leading-none">{errorMessage}</span>
        {:else}
            <span class="text-[9px] text-slate-400 font-medium leading-none">Terakhir: {lastChecked}</span>
        {/if}
    </div>

    <!-- Tombol Refresh Manual -->
    <button 
        on:click={checkStatus}
        class="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary-500 transition-colors"
        title="Cek Status Printer Sekarang"
    >
        <svg class="w-4 h-4 {status === 'CHECKING' ? 'animate-spin' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
    </button>
</div>
