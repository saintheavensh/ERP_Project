<script lang="ts">
    import { authStore, ROLE_CONFIG } from "$lib/shared/lib/auth-store.svelte";
    import { goto } from "$app/navigation";
    import { cn } from "$lib/shared/lib/utils";
    import * as DropdownMenu from "$lib/shared/components/ui/dropdown-menu";
    import { Button } from "$lib/shared/components/ui/button";
    import { ArrowLeftRight } from "lucide-svelte";

    const availableRoles = $derived(
        authStore.roles
            .filter((r) => ROLE_CONFIG[r])
            .map((r) => ({ id: r, ...ROLE_CONFIG[r] })),
    );

    const currentConfig = $derived(authStore.activeRoleConfig);

    function handleSwitch(roleId: string) {
        if (roleId === authStore.activeRole) return;

        const dashboardPath = authStore.switchRole(roleId);
        goto(dashboardPath);
    }
</script>

{#if authStore.hasMultipleRoles && currentConfig}
    <DropdownMenu.Root>
        <DropdownMenu.Trigger>
            <Button
                variant="ghost"
                size="sm"
                class="gap-2 h-9 px-3 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
                <span class="text-base leading-none">{currentConfig.icon}</span>
                <span class="text-sm font-semibold hidden sm:inline"
                    >{currentConfig.label}</span
                >
                <ArrowLeftRight class="h-3.5 w-3.5 text-slate-400 ml-0.5" />
            </Button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Content align="start" class="w-52">
            <DropdownMenu.Label class="text-xs text-muted-foreground"
                >Switch Mode</DropdownMenu.Label
            >
            <DropdownMenu.Separator />
            {#each availableRoles as role}
                <DropdownMenu.Item
                    onclick={() => handleSwitch(role.id)}
                    class={cn(
                        "cursor-pointer gap-3",
                        role.id === authStore.activeRole &&
                            "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
                    )}
                >
                    <span class="text-base leading-none">{role.icon}</span>
                    <span class="font-medium">{role.label}</span>
                    {#if role.id === authStore.activeRole}
                        <span class="ml-auto h-2 w-2 rounded-full bg-blue-500"
                        ></span>
                    {/if}
                </DropdownMenu.Item>
            {/each}
        </DropdownMenu.Content>
    </DropdownMenu.Root>
{/if}
