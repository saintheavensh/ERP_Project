<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { authStore } from "$lib/shared/lib/auth-store.svelte";

    let { children } = $props();

    $effect(() => {
        const path = $page.url.pathname as string;
        if (path === "/services" || path === "/services/") {
            // Redirect based on role
            switch (authStore.role) {
                case "teknisi":
                    goto("/services/teknisi/queue");
                    break;
                case "manager":
                case "owner":
                case "super_admin":
                    goto("/services/manager/reports");
                    break;
            }
        }
    });
</script>

{@render children()}
