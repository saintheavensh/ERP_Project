<script lang="ts">
    import { page } from "$app/stores";
    import SettingsNav from "$lib/features/settings/components/SettingsNav.svelte";

    let { children } = $props();
</script>

<div
    class="container mx-auto p-4 md:p-8 max-w-7xl animate-in fade-in duration-500"
>
    <div class="flex flex-col lg:flex-row gap-8 lg:gap-12">
        <!-- Sidebar Navigation -->
        <aside class="lg:sticky lg:top-24 h-fit">
            <div class="mb-6 px-2">
                <h2
                    class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300"
                >
                    Pengaturan
                </h2>
                <p class="text-sm text-muted-foreground mt-1">
                    Kelola preferensi & konfigurasi sistem.
                </p>
            </div>

            <SettingsNav />
        </aside>

        <!-- Main Content Area -->
        <main class="flex-1 min-w-0">
            {@render children()}
        </main>
    </div>
</div>
