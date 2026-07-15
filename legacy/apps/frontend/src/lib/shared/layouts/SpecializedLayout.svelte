<script lang="ts">
    import Navbar from "$lib/shared/components/nav/Navbar.svelte";

    let { children } = $props();
</script>

<div class="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col">
    <Navbar />
    <main class="flex-1 overflow-x-hidden animate-in fade-in duration-500">
        <div class="px-4 py-6 md:px-8 md:py-8 max-w-[1700px] mx-auto w-full">
            {@render children()}
        </div>
    </main>
</div>
