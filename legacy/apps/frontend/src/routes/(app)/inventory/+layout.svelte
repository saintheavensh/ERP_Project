<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { authStore } from "$lib/shared/lib/auth-store.svelte";

    let { children } = $props();

    $effect(() => {
        const path = $page.url.pathname as string;
        if (path === "/inventory" || path === "/inventory/") {
            // Redirect based on role
            switch (authStore.role) {
                case "manager":
                case "owner":
                case "super_admin":
                    goto("/inventory/manager/products");
                    break;
                case "warehouse":
                    goto("/inventory/warehouse/stock");
                    break;
                case "teknisi":
                    goto("/inventory/teknisi/parts");
                    break;
            }
        }
    });
</script>

{@render children()}
