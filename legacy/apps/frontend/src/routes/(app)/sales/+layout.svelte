<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { authStore } from "$lib/shared/lib/auth-store.svelte";

    let { children } = $props();

    $effect(() => {
        const path = $page.url.pathname as string;
        if (path === "/sales" || path === "/sales/") {
            // Redirect based on role
            switch (authStore.role) {
                case "kasir":
                    goto("/sales/kasir");
                    break;
                case "manager":
                case "owner":
                case "super_admin":
                    goto("/sales/manager/approvals");
                    break;
            }
        }
    });
</script>

{@render children()}
