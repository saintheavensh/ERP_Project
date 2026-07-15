<script lang="ts">
    import { page } from "$app/stores";
    import { cn } from "$lib/shared/lib/utils";
    import { authStore } from "$lib/shared/lib/auth-store.svelte";
    import {
        Store,
        Users,
        CreditCard,
        MessageCircle,
        Wrench,
        Receipt,
        RotateCcw,
        Settings,
        Briefcase,
        Link,
    } from "lucide-svelte";

    // Define all possible settings routes
    const allRoutes = [
        {
            title: "General",
            href: "/shared/settings/general",
            icon: Settings,
            roles: ["owner", "super_admin"],
        },
        {
            title: "Toko",
            href: "/shared/settings/store",
            icon: Store,
            roles: ["owner", "super_admin"],
        },
        {
            title: "Pengguna",
            href: "/shared/settings/employees",
            icon: Users,
            roles: ["owner", "super_admin"],
        },
        {
            title: "Pembayaran",
            href: "/shared/settings/payment",
            icon: CreditCard,
            roles: ["owner", "super_admin", "manager"],
        },
        {
            title: "Akuntansi",
            href: "/shared/settings/accounting",
            icon: Briefcase,
            roles: ["owner", "super_admin"], // Manager restricted
        },
        {
            title: "Service",
            href: "/shared/settings/service",
            icon: Wrench,
            roles: ["owner", "super_admin", "manager"],
        },
        {
            title: "Nota & Struk",
            href: "/shared/settings/notes",
            icon: Receipt,
            roles: ["owner", "super_admin", "manager"],
        },
        {
            title: "WhatsApp",
            href: "/shared/settings/integration/whatsapp",
            icon: MessageCircle,
            roles: ["owner", "super_admin", "manager"],
        },
        {
            title: "Integrasi",
            href: "/shared/settings/integration/device",
            icon: Link,
            roles: ["owner", "super_admin", "manager"],
        },
        {
            title: "Reset System",
            href: "/shared/settings/reset",
            icon: RotateCcw,
            roles: ["owner", "super_admin"],
        },
    ];

    // Filter routes based on active role
    const activeRoutes = $derived(
        allRoutes.filter((route) => {
            if (!authStore.activeRole) return false;
            return route.roles.includes(authStore.activeRole);
        }),
    );

    const activePath = $derived($page.url.pathname);
</script>

<nav class="flex flex-col space-y-1 w-full lg:w-64 shrink-0">
    {#each activeRoutes as route}
        <a
            href={route.href}
            class={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                activePath === route.href
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
            )}
        >
            <route.icon class="h-4 w-4" />
            {route.title}
        </a>
    {/each}
</nav>
