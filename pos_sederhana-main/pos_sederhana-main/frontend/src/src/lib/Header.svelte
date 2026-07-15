<script>
    import { onMount } from 'svelte';
    
    let timeString = '';
    
    onMount(() => {
        const interval = setInterval(() => {
            timeString = new Date().toLocaleString('id-ID', {
                dateStyle: 'short',
                timeStyle: 'medium'
            });
        }, 1000);
        
        return () => clearInterval(interval);
    });
</script>

<header class="no-print bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 shadow-inner">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
            </div>
            <h1 class="text-xl font-bold bg-linear-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">New Majmu Service</h1>
        </div>
        
        <div class="flex items-center gap-4">
            <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-sm font-medium border border-slate-200 shadow-sm">
                <span>{timeString}</span>
            </div>
        </div>
    </div>
</header>
