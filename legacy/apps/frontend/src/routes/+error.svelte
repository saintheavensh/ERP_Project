<script lang="ts">
    import { page } from "$app/stores";
    import { Button } from "$lib/shared/components/ui/button";
    import { Home, RefreshCcw, AlertTriangle } from "lucide-svelte";
    import { browser } from "$app/environment";

    let { data } = $props();

    const status = $derived($page.status);
    const message = $derived(
        $page.error?.message || "Terjadi kesalahan yang tidak terduga",
    );

    function goHome() {
        if (browser) window.location.href = "/";
    }

    function reload() {
        if (browser) window.location.reload();
    }
</script>

<div
    class="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4"
>
    <div class="max-w-md w-full text-center space-y-6">
        <div
            class="relative mx-auto w-24 h-24 flex items-center justify-center"
        >
            <div
                class="absolute inset-0 bg-red-100 dark:bg-red-900/20 rounded-full animate-pulse"
            ></div>
            <AlertTriangle
                class="h-12 w-12 text-red-600 dark:text-red-500 relative z-10"
            />
        </div>

        <div class="space-y-2">
            <h1
                class="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
            >
                {status}
            </h1>
            <h2
                class="text-xl font-semibold text-slate-700 dark:text-slate-200"
            >
                {#if status === 404}
                    Halaman Tidak Ditemukan
                {:else if status === 500}
                    Terjadi Kesalahan Server
                {:else}
                    Terjadi Kesalahan
                {/if}
            </h2>
            <p class="text-slate-500 dark:text-slate-400">
                {message}
            </p>
        </div>

        <div class="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button variant="outline" onclick={reload}>
                <RefreshCcw class="mr-2 h-4 w-4" />
                Coba Lagi
            </Button>
            <Button onclick={goHome}>
                <Home class="mr-2 h-4 w-4" />
                Kembali ke Beranda
            </Button>
        </div>
    </div>
</div>
