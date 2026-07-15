<script lang="ts">
    import { authStore } from "$lib/shared/lib/auth-store.svelte";
    import { browser } from "$app/environment";
    import SpecializedLayout from "$lib/shared/layouts/SpecializedLayout.svelte";

    let { children } = $props();

    // All roles use the same SpecializedLayout with Navbar.
    // The nav items change dynamically based on activeRole (handled by Navbar).
    const isReady = $derived(
        browser &&
            authStore.isAuthenticated &&
            !authStore.loading &&
            !!authStore.activeRole,
    );
</script>

{#if !isReady}
    <!-- Prevent Flash: Render nothing while loading auth -->
    <div class="h-screen w-full bg-slate-950"></div>
{:else}
    <SpecializedLayout>
        {@render children()}
    </SpecializedLayout>
{/if}
