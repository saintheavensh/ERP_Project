<script lang="ts">
    import { page } from "$app/stores";
    import { authStore } from "$lib/shared/lib/auth-store.svelte";
    import {
        NAV_ITEMS,
        filterNavByRole,
        type NavItem,
        type UserRole,
    } from "$lib/shared/config/navigation.config";
    import RoleSwitcher from "$lib/shared/components/nav/RoleSwitcher.svelte";
    import { Button } from "$lib/shared/components/ui/button";
    import * as Sheet from "$lib/shared/components/ui/sheet";
    import { Menu, LogOut, Package, Bell } from "lucide-svelte";
    import { cn } from "$lib/shared/lib/utils";
    import * as DropdownMenu from "$lib/shared/components/ui/dropdown-menu";
    import { Avatar, AvatarFallback } from "$lib/shared/components/ui/avatar";

    let mobileMenuOpen = $state(false);

    let currentNav = $derived(
        authStore.activeRole
            ? filterNavByRole(NAV_ITEMS, authStore.activeRole as UserRole)
            : [],
    );
    let currentPath = $derived($page.url.pathname);
    let userName = $derived(authStore.user?.name || "User");
    let roleConfig = $derived(authStore.activeRoleConfig);

    async function handleLogout() {
        await authStore.logout();
    }

    function isActive(item: NavItem): boolean {
        if (item.href) return currentPath === item.href;
        if (item.children) {
            return item.children.some(
                (child) => child.href && currentPath.startsWith(child.href),
            );
        }
        return false;
    }
</script>

<nav
    class="flex h-16 items-center justify-between px-4 md:px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-all duration-200"
>
    <div class="flex items-center gap-6">
        <!-- Logo -->
        <a href="/" class="flex items-center gap-2 mr-4 group">
            <div
                class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm group-hover:bg-blue-700 transition-colors"
            >
                <Package class="h-4 w-4" />
            </div>
            <span
                class="font-bold tracking-tight text-slate-900 dark:text-slate-100 hidden md:block"
            >
                Inventory
            </span>
        </a>

        <!-- Desktop Navigation -->
        <div class="hidden lg:flex items-center gap-1">
            {#each currentNav as item}
                {#if item.children}
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger>
                            <Button
                                variant="ghost"
                                class={cn(
                                    "flex items-center gap-2 px-3 rounded-full text-sm font-medium transition-all group",
                                    isActive(item)
                                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
                                )}
                            >
                                <item.icon
                                    class={cn(
                                        "h-4 w-4",
                                        isActive(item)
                                            ? ""
                                            : "opacity-70 group-hover:opacity-100",
                                    )}
                                />
                                {item.title}
                                <span
                                    class="ml-1 text-[10px] opacity-50 group-hover:opacity-100 transition-opacity"
                                    >▼</span
                                >
                            </Button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content align="start" class="w-48">
                            {#each item.children as child}
                                <DropdownMenu.Item
                                    class={cn(
                                        "cursor-pointer",
                                        currentPath === child.href &&
                                            "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-medium",
                                    )}
                                >
                                    <a
                                        href={child.href}
                                        class="flex items-center w-full"
                                    >
                                        <child.icon
                                            class="mr-2 h-4 w-4 opacity-70"
                                        />
                                        {child.title}
                                    </a>
                                </DropdownMenu.Item>
                            {/each}
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>
                {:else}
                    <a
                        href={item.href}
                        class={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all hover:bg-slate-100 dark:hover:bg-slate-800 group",
                            currentPath === item.href
                                ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                                : "text-slate-600 dark:text-slate-400",
                        )}
                    >
                        <item.icon
                            class={cn(
                                "h-4 w-4",
                                currentPath === item.href
                                    ? ""
                                    : "opacity-70 group-hover:opacity-100",
                            )}
                        />
                        {item.title}
                    </a>
                {/if}
            {/each}
        </div>
    </div>

    <!-- Right Actions -->
    <div class="flex items-center gap-3">
        <!-- Role Switcher -->
        <RoleSwitcher />

        {#if !authStore.hasMultipleRoles && roleConfig}
            <div
                class="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50"
            >
                <span class="text-sm">{roleConfig.icon}</span>
                <span
                    class="text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >{roleConfig.label}</span
                >
            </div>
        {/if}

        <Button variant="ghost" size="icon" class="rounded-full relative">
            <Bell class="h-5 w-5 text-slate-500" />
            <span
                class="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border-2 border-white dark:border-slate-900"
            ></span>
        </Button>

        <DropdownMenu.Root>
            <DropdownMenu.Trigger>
                <div
                    class="flex items-center gap-2 hover:opacity-80 transition-opacity p-1 rounded-full border border-slate-200 dark:border-slate-800 pr-3"
                >
                    <Avatar class="h-8 w-8">
                        <AvatarFallback class="bg-blue-600 text-white text-xs">
                            {userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div class="text-left hidden sm:block">
                        <p class="text-xs font-bold leading-none">{userName}</p>
                        <p class="text-[10px] text-slate-500 leading-tight">
                            {roleConfig?.label || authStore.activeRole}
                        </p>
                    </div>
                </div>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" class="w-56">
                <DropdownMenu.Label>My Account</DropdownMenu.Label>
                <DropdownMenu.Separator />
                <DropdownMenu.Item>Profile</DropdownMenu.Item>
                <DropdownMenu.Item>Settings</DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item
                    onclick={handleLogout}
                    class="text-red-500 focus:text-red-600 cursor-pointer"
                >
                    <LogOut class="mr-2 h-4 w-4" />
                    Logout
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu.Root>

        <!-- Mobile Menu -->
        <Sheet.Root bind:open={mobileMenuOpen}>
            <Sheet.Trigger>
                <Button
                    variant="ghost"
                    size="icon"
                    class="lg:hidden rounded-full"
                >
                    <Menu class="h-5 w-5 text-slate-600 dark:text-slate-300" />
                </Button>
            </Sheet.Trigger>
            <Sheet.Content
                side="left"
                class="w-72 p-0 flex flex-col border-r border-slate-200 dark:border-slate-800"
            >
                <div
                    class="flex h-16 items-center border-b border-slate-200 dark:border-slate-800 px-6"
                >
                    <div class="flex items-center gap-2">
                        <div
                            class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white"
                        >
                            <Package class="h-4 w-4" />
                        </div>
                        <span class="font-bold tracking-tight">Inventory</span>
                    </div>
                </div>
                <div class="flex-1 overflow-y-auto py-4 px-4 custom-scrollbar">
                    <nav class="grid gap-1">
                        {#each currentNav as item}
                            {#if item.children}
                                <div class="mt-4 mb-1 first:mt-0">
                                    <div
                                        class="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2"
                                    >
                                        <item.icon class="h-3.5 w-3.5" />
                                        {item.title}
                                    </div>
                                    <div class="grid gap-1 pl-3">
                                        {#each item.children as child}
                                            <a
                                                href={child.href}
                                                class={cn(
                                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                                                    currentPath === child.href
                                                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-medium"
                                                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
                                                )}
                                                onclick={() =>
                                                    (mobileMenuOpen = false)}
                                            >
                                                <child.icon
                                                    class="h-4 w-4 opacity-70"
                                                />
                                                {child.title}
                                            </a>
                                        {/each}
                                    </div>
                                </div>
                            {:else}
                                <a
                                    href={item.href}
                                    class={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                                        currentPath === item.href
                                            ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-medium"
                                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
                                    )}
                                    onclick={() => (mobileMenuOpen = false)}
                                >
                                    <item.icon class="h-4 w-4 opacity-70" />
                                    {item.title}
                                </a>
                            {/if}
                        {/each}
                    </nav>
                </div>
                <div
                    class="p-4 border-t border-slate-200 dark:border-slate-800"
                >
                    <Button
                        variant="ghost"
                        class="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                        onclick={handleLogout}
                    >
                        <LogOut class="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </Sheet.Content>
        </Sheet.Root>
    </div>
</nav>

<style>
    :global(.custom-scrollbar::-webkit-scrollbar) {
        width: 6px;
    }
    :global(.custom-scrollbar::-webkit-scrollbar-track) {
        background: transparent;
    }
    :global(.custom-scrollbar::-webkit-scrollbar-thumb) {
        background: rgba(148, 163, 184, 0.3);
        border-radius: 10px;
    }
</style>
