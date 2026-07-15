<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import { fade, scale } from 'svelte/transition';

    export let show = false;
    export let title = "Informasi";
    export let type = "info"; // info, success, error, warning
    
    const dispatch = createEventDispatcher();

    function close() {
        show = false;
        dispatch('close');
    }

    function handleKeydown(e) {
        if (e.key === 'Escape' && show) close();
    }
</script>

<svelte:window on:keydown={handleKeydown}/>

{#if show}
    <div 
        class="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6"
        transition:fade={{ duration: 200 }}
    >
        <!-- Backdrop -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div 
            class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            on:click={close}
        ></div>

        <!-- Modal Content -->
        <div 
            class="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
            transition:scale={{ duration: 300, start: 0.95, opacity: 0 }}
        >
            <!-- Header/Icon -->
            <div class="px-6 pt-8 pb-4 flex flex-col items-center text-center">
                {#if type === 'error'}
                    <div class="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4 shadow-inner">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                    </div>
                {:else if type === 'success'}
                    <div class="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4 shadow-inner">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                {:else if type === 'warning'}
                    <div class="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-4 shadow-inner">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                {:else}
                    <div class="w-16 h-16 rounded-2xl bg-primary-50 text-primary-500 flex items-center justify-center mb-4 shadow-inner">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                {/if}

                <h3 class="text-xl font-bold text-slate-800">{title}</h3>
                <div class="mt-2 text-slate-500 leading-relaxed px-2">
                    <slot name="content"></slot>
                </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-6 bg-slate-50 flex flex-col gap-2">
                <slot name="actions">
                    <button 
                        on:click={close}
                        class="btn {type === 'error' ? 'btn-danger' : 'btn-primary'} w-full py-3 text-lg font-bold shadow-lg"
                    >
                        MENGERTI
                    </button>
                </slot>
            </div>
        </div>
    </div>
{/if}
