<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { authStore } from "$lib/shared/lib/auth-store.svelte";

    let { children } = $props();

    $effect(() => {
        const path = $page.url.pathname as string;
        if (path === "/finance" || path === "/finance/") {
            // Redirect based on role
            switch (authStore.role) {
                case "manager":
                case "owner":
                case "super_admin":
                    goto("/finance/manager/reports");
                    break;
            }
        }
    });
</script>

{@render children()}
